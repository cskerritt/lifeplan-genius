import { Table, TableRow, TableCell, AlignmentType, Paragraph, TextRun, BorderStyle } from "docx";
import { CareItem } from "@/types/lifecare";
import { 
  groupItemsByCategory, 
  calculateCategoryTotal, 
  calculateCategoryOneTimeTotal, 
  isOneTimeItem,
  getItemDuration,
  calculateCategoryLifetimeCost,
  getCategoryAgeRange
} from "../utils";

export const createSummaryHeaderRow = (): TableRow => {
  return new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Projected Care", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Duration Required (Years)", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Annual Cost", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Annual Cost × Duration", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Total One-Time Cost", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
    ],
  });
};

// Calculate age from date of birth
const calculateAgeFromDOB = (dob: string): number => {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const calculateAverageDuration = (items: CareItem[], currentAge?: number, lifeExpectancyStr?: string): number => {
  const itemsWithAges = items.filter(item => 
    !isOneTimeItem(item) && 
    item.startAge !== undefined && 
    item.endAge !== undefined
  );
  
  if (itemsWithAges.length === 0) {
    // If no items have defined ages, use life expectancy if available
    if (lifeExpectancyStr !== undefined) {
      const lifeExpectancyValue = parseFloat(lifeExpectancyStr);
      if (!isNaN(lifeExpectancyValue)) {
        return lifeExpectancyValue;
      }
    }
    return 30.5; // Default value
  }
  
  const totalDuration = itemsWithAges.reduce((sum, item) => 
    sum + getItemDuration(item), 0);
  
  return Math.round(totalDuration / itemsWithAges.length);
};

export const createSummaryCategoryRows = (items: CareItem[], dateOfBirth?: string, lifeExpectancy?: string): TableRow[] => {
  const groupedItems = groupItemsByCategory(items);
  const rows: TableRow[] = [];

  // Calculate current age and max age
  const currentAge = dateOfBirth ? calculateAgeFromDOB(dateOfBirth) : 0;
  const lifeExpectancyValue = lifeExpectancy ? parseFloat(lifeExpectancy) : 30.5;
  const maxAge = currentAge + lifeExpectancyValue;

  for (const [category, categoryItems] of Object.entries(groupedItems)) {
    const annualCategoryTotal = calculateCategoryTotal(categoryItems);
    const oneTimeCategoryTotal = calculateCategoryOneTimeTotal(categoryItems);
    
    // Calculate duration
    let durationText = lifeExpectancyValue.toString();
    let lifetimeCost = annualCategoryTotal * lifeExpectancyValue;
    
    // Update items with current age and max age if startAge or endAge is undefined
    const updatedItems = categoryItems.map(item => {
      if (!isOneTimeItem(item)) {
        return {
          ...item,
          startAge: item.startAge !== undefined ? item.startAge : currentAge,
          endAge: item.endAge !== undefined ? item.endAge : maxAge
        };
      }
      return item;
    });
    
    // Get age range with updated items
    const ageRange = getCategoryAgeRange(updatedItems);
    
    if (ageRange.startAge !== undefined && ageRange.endAge !== undefined) {
      const duration = ageRange.endAge - ageRange.startAge;
      durationText = duration.toString();
      lifetimeCost = annualCategoryTotal * duration;
    }

    // Format category name with spaces between words
    const formattedCategory = category
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim(); // Remove any leading/trailing spaces

    rows.push(
      new TableRow({
        children: [
          // First column: Projected Care (Category Name)
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: formattedCategory,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
          // Second column: Duration Required (Years)
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: durationText,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
          // Third column: Annual Cost
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${annualCategoryTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
          // Fourth column: Annual Cost × Duration
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${lifetimeCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
          // Fifth column: Total One-Time Cost
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${oneTimeCategoryTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
        ],
      })
    );
  }

  return rows;
};

export const createSummaryTotalRow = (items: CareItem[], dateOfBirth?: string, lifeExpectancy?: string): TableRow => {
  const groupedItems = groupItemsByCategory(items);
  let totalAnnualCost = 0;
  let totalLifetimeCost = 0;
  let totalOneTimeCost = 0;

  // Calculate current age and max age
  const currentAge = dateOfBirth ? calculateAgeFromDOB(dateOfBirth) : 0;
  const lifeExpectancyValue = lifeExpectancy ? parseFloat(lifeExpectancy) : 30.5;
  const maxAge = currentAge + lifeExpectancyValue;

  for (const [category, categoryItems] of Object.entries(groupedItems)) {
    const annualCategoryTotal = calculateCategoryTotal(categoryItems);
    const oneTimeCategoryTotal = calculateCategoryOneTimeTotal(categoryItems);
    totalAnnualCost += annualCategoryTotal;
    totalOneTimeCost += oneTimeCategoryTotal;
    
    // Update items with current age and max age if startAge or endAge is undefined
    const updatedItems = categoryItems.map(item => {
      if (!isOneTimeItem(item)) {
        return {
          ...item,
          startAge: item.startAge !== undefined ? item.startAge : currentAge,
          endAge: item.endAge !== undefined ? item.endAge : maxAge
        };
      }
      return item;
    });
    
    // Get age range with updated items
    const ageRange = getCategoryAgeRange(updatedItems);
    
    if (ageRange.startAge !== undefined && ageRange.endAge !== undefined) {
      const duration = ageRange.endAge - ageRange.startAge;
      totalLifetimeCost += annualCategoryTotal * duration;
    } else {
      // If no age range, use life expectancy
      totalLifetimeCost += annualCategoryTotal * lifeExpectancyValue;
    }
  }

  return new TableRow({
    children: [
      // First column: "TOTAL"
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "TOTAL", bold: true })],
            alignment: AlignmentType.RIGHT,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      // Second column: Empty (Duration)
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      // Third column: Total Annual Cost
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `$${totalAnnualCost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                bold: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      // Fourth column: Total Lifetime Cost
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `$${totalLifetimeCost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                bold: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      // Fifth column: Total One-Time Cost
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `$${totalOneTimeCost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                bold: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
    ],
  });
};

export const createLifetimeProjectedCostsTable = (items: CareItem[], dateOfBirth?: string, lifeExpectancy?: string): Table => {
  return new Table({
    width: { size: 100, type: "pct" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
    },
    rows: [
      createSummaryHeaderRow(),
      ...createSummaryCategoryRows(items, dateOfBirth, lifeExpectancy),
      createSummaryTotalRow(items, dateOfBirth, lifeExpectancy),
    ],
  });
};
