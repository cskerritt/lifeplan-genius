import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import sanitizeFilename from 'sanitize-filename';
import { ExportData } from './types';
import { 
  groupItemsByCategory, 
  calculateCategoryTotal, 
  calculateCategoryOneTimeTotal, 
  isOneTimeItem,
  getItemDuration,
  calculateLifetimeCost,
  calculateCategoryLifetimeCost,
  getCategoryAgeRange
} from './utils';

// Use the centralized age calculation utility
import { calculateAgeFromDOB } from '@/utils/calculations';

const createEvalueeInfoSheet = (workbook: Workbook, data: ExportData) => {
  const sheet = workbook.addWorksheet('Evaluee Information');
  
  // Add title
  sheet.mergeCells('A1:B1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = 'LIFE CARE PLAN FOR: ' + (data.evalueeName || 'Unknown').toUpperCase();
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.height = 20;
  
  // Add subtitle
  sheet.mergeCells('A2:B2');
  const subtitleRow = sheet.getRow(2);
  subtitleRow.getCell(1).value = 'EVALUEE INFORMATION';
  subtitleRow.getCell(1).font = { bold: true, size: 12 };
  subtitleRow.height = 20;
  
  // Add evaluee details
  const details = [
    { label: 'Name', value: data.evalueeName || 'Unknown' },
    { label: 'Date of Birth', value: data.dateOfBirth || 'N/A' },
    { label: 'Date of Injury', value: data.dateOfInjury || 'N/A' },
    { label: 'Gender', value: data.gender || 'N/A' },
    { label: 'Life Expectancy', value: data.lifeExpectancy ? `${data.lifeExpectancy} years` : 'N/A' },
    { label: 'Age at Injury', value: data.ageAtInjury?.toString() || 'N/A' },
    { label: 'Address', value: data.address || 'N/A' },
    { label: 'City', value: data.city || 'N/A' },
    { label: 'State', value: data.state || 'N/A' },
    { label: 'ZIP Code', value: data.zipCode?.toString() || 'N/A' },
    { label: 'Phone', value: data.phone || 'N/A' },
    { label: 'Email', value: data.email || 'N/A' },
    { label: 'Report Created', value: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A' },
    { label: 'Last Updated', value: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'N/A' }
  ];
  
  details.forEach((detail, i) => {
    const row = sheet.getRow(i + 4);
    row.getCell(1).value = detail.label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = detail.value;
  });
  
  // Set column widths
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 30;
  
  return sheet;
};

const createLifetimeProjectedCostsSheet = (workbook: Workbook, data: ExportData) => {
  const sheet = workbook.addWorksheet('Lifetime Projected Costs');
  
  // Add title
  sheet.mergeCells('A1:E1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = 'Lifetime Projected Costs';
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.height = 20;
  
  // Add headers
  const headerRow = sheet.getRow(3);
  headerRow.getCell(1).value = 'Projected Care';
  headerRow.getCell(2).value = 'Duration Required (Years)';
  headerRow.getCell(3).value = 'Annual Cost';
  headerRow.getCell(4).value = 'Annual Cost × Duration';
  headerRow.getCell(5).value = 'Total One-Time Cost';
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
  });
  
  // Check if items is an array before using it
  if (!Array.isArray(data.items)) {
    console.error('Expected items to be an array but got:', data.items);
    return sheet;
  }
  
  // Group items by category
  const groupedItems = groupItemsByCategory(data.items);
  let currentRow = 4;
  let totalAnnualCost = 0;
  let totalLifetimeCost = 0;
  let totalOneTimeCost = 0;
  
  // Calculate and add rows for each category
  for (const [category, categoryItems] of Object.entries(groupedItems)) {
    // Calculate annual cost (excludes one-time items) and one-time cost separately
    const annualCost = calculateCategoryTotal(categoryItems); // This only includes recurring items
    const oneTimeCost = calculateCategoryOneTimeTotal(categoryItems); // This only includes one-time items
    
    // Calculate category age range and duration
    // Extract current age and max age from data if available
    const currentAge = data.dateOfBirth ? calculateAgeFromDOB(data.dateOfBirth) : undefined;
    const lifeExpectancy = data.lifeExpectancy ? parseFloat(data.lifeExpectancy) : undefined;
    const maxAge = currentAge !== undefined && lifeExpectancy !== undefined 
      ? currentAge + lifeExpectancy 
      : data.statisticalLifespan;
    
    // Check if any items in this category mention duration in frequency
    const itemsWithYearFrequency = categoryItems.filter(item => {
      if (isOneTimeItem(item)) return false;
      
      const frequencyLower = item.frequency.toLowerCase();
      return frequencyLower.includes("years") || 
             frequencyLower.includes("yrs") || 
             frequencyLower.includes("30 years");
    });
    
    // Default duration value
    let durationValue = '30'; // Default to 30 years
    let lifetimeCost = 0;
    
    // If we have items with year frequency, use that for duration
    if (itemsWithYearFrequency.length > 0) {
      // Extract the number of years from the first item's frequency
      const frequencyLower = itemsWithYearFrequency[0].frequency.toLowerCase();
      const yearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)/i);
      
      if (yearMatch) {
        durationValue = yearMatch[1];
      } else if (frequencyLower.includes("30 years")) {
        durationValue = "30"; // Special case for "4x per year 30 years"
      }
      
      lifetimeCost = annualCost * parseInt(durationValue);
    } else {
      // Use current age and max age as defaults for category age range
      const ageRange = getCategoryAgeRange(categoryItems, currentAge, maxAge);
      
      if (ageRange.startAge !== undefined && ageRange.endAge !== undefined) {
        const duration = ageRange.endAge - ageRange.startAge;
        durationValue = duration.toString();
        lifetimeCost = annualCost * duration;
      } else {
        // If no category age range, calculate using individual item durations
        lifetimeCost = calculateCategoryLifetimeCost(categoryItems);
        
        // Check if we have any non-one-time items with durations
        const nonOneTimeItems = categoryItems.filter(item => 
          !isOneTimeItem(item) && 
          item.startAge !== undefined && 
          item.endAge !== undefined
        );
        
        if (nonOneTimeItems.length > 0) {
          // Calculate average duration for reporting
          const totalDuration = nonOneTimeItems.reduce((sum, item) => 
            sum + getItemDuration(item), 0);
          const avgDuration = Math.round(totalDuration / nonOneTimeItems.length);
          durationValue = avgDuration.toString();
        } else {
          // Default to 30 years if we can't determine from age range or items
          lifetimeCost = annualCost * 30;
        }
      }
    }
    
    const row = sheet.getRow(currentRow);
    row.getCell(1).value = category.charAt(0).toUpperCase() + category.slice(1);
    row.getCell(2).value = durationValue;
    row.getCell(3).value = annualCost;
    row.getCell(3).numFmt = '$#,##0.00';
    row.getCell(4).value = lifetimeCost;
    row.getCell(4).numFmt = '$#,##0.00';
    row.getCell(5).value = oneTimeCost;
    row.getCell(5).numFmt = '$#,##0.00';
    
    totalAnnualCost += annualCost;
    totalLifetimeCost += lifetimeCost;
    totalOneTimeCost += oneTimeCost;
    
    currentRow++;
  }
  
  // Add total row
  const totalRow = sheet.getRow(currentRow + 1);
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(3).value = totalAnnualCost;
  totalRow.getCell(3).font = { bold: true };
  totalRow.getCell(3).numFmt = '$#,##0.00';
  totalRow.getCell(4).value = totalLifetimeCost;
  totalRow.getCell(4).font = { bold: true };
  totalRow.getCell(4).numFmt = '$#,##0.00';
  totalRow.getCell(5).value = totalOneTimeCost;
  totalRow.getCell(5).font = { bold: true };
  totalRow.getCell(5).numFmt = '$#,##0.00';
  
  // Set column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 20;
  
  return sheet;
};

const createDetailedItemsSheet = (workbook: Workbook, data: ExportData) => {
  const sheet = workbook.addWorksheet('Detailed Items');
  
  // Add title
  sheet.mergeCells('A1:H1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = 'Detailed Life Care Plan Items';
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.height = 20;
  
  // Add headers
  const headerRow = sheet.getRow(3);
  headerRow.getCell(1).value = 'Category';
  headerRow.getCell(2).value = 'Service';
  headerRow.getCell(3).value = 'CPT/HCPCS Code';
  headerRow.getCell(4).value = 'Frequency';
  headerRow.getCell(5).value = 'Age Initiated';
  headerRow.getCell(6).value = 'Through Age';
  headerRow.getCell(7).value = 'Annual Cost';
  headerRow.getCell(8).value = 'One-Time Cost';
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
  });
  
  // Check if items is an array before using it
  if (!Array.isArray(data.items)) {
    console.error('Expected items to be an array but got:', data.items);
    return sheet;
  }
  
  // Group items by category
  const groupedItems = groupItemsByCategory(data.items);
  let currentRow = 4;
  
  // Add rows for each item
  for (const [category, categoryItems] of Object.entries(groupedItems)) {
    categoryItems.forEach((item) => {
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = category.charAt(0).toUpperCase() + category.slice(1);
      row.getCell(2).value = item.service;
      row.getCell(3).value = item.cptCode || 'N/A';
      row.getCell(4).value = item.frequency;
      
      if (isOneTimeItem(item)) {
        row.getCell(5).value = 'N/A';
        row.getCell(6).value = 'N/A';
        row.getCell(7).value = 'N/A';
        row.getCell(8).value = item.costRange.average;
        row.getCell(8).numFmt = '$#,##0.00';
      } else {
        row.getCell(5).value = item.startAge !== undefined ? item.startAge : 'N/A';
        row.getCell(6).value = item.endAge !== undefined ? item.endAge : 'N/A';
        row.getCell(7).value = item.annualCost;
        row.getCell(7).numFmt = '$#,##0.00';
        row.getCell(8).value = 'N/A';
      }
      
      currentRow++;
    });
    
    // Add category total row
    const categoryTotalRow = sheet.getRow(currentRow);
    const annualTotal = calculateCategoryTotal(categoryItems);
    const oneTimeTotal = calculateCategoryOneTimeTotal(categoryItems);
    
    categoryTotalRow.getCell(1).value = `${category.charAt(0).toUpperCase() + category.slice(1)} Total`;
    categoryTotalRow.getCell(1).font = { bold: true };
    categoryTotalRow.getCell(7).value = annualTotal;
    categoryTotalRow.getCell(7).font = { bold: true };
    categoryTotalRow.getCell(7).numFmt = '$#,##0.00';
    categoryTotalRow.getCell(8).value = oneTimeTotal;
    categoryTotalRow.getCell(8).font = { bold: true };
    categoryTotalRow.getCell(8).numFmt = '$#,##0.00';
    
    currentRow += 2; // Add an empty row after each category
  }
  
  // Set column widths
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 15;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 15;
  sheet.getColumn(8).width = 15;
  
  return sheet;
};

export const exportToExcel = async (data: ExportData) => {
  const workbook = new Workbook();
  
  // Create sheets
  createEvalueeInfoSheet(workbook, data);
  createLifetimeProjectedCostsSheet(workbook, data);
  createDetailedItemsSheet(workbook, data);
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Sanitize filename
  const filename = sanitizeFilename(`${data.evalueeName || 'Unknown'}_LifeCarePlan.xlsx`);
  
  // Save file
  saveAs(blob, filename);
};
