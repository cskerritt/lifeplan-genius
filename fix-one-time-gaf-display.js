// This script creates a fix for the one-time GAF display issue
import fs from 'fs';
import path from 'path';

// Path to the ItemCalculationDetails.tsx file
const filePath = path.join('src', 'components', 'LifeCarePlan', 'ItemCalculationDetails.tsx');

// Read the file
console.log(`Reading file: ${filePath}`);
const fileContent = fs.readFileSync(filePath, 'utf8');

// Create a modified version of the file
const modifiedContent = fileContent.replace(
  // Find the section where one-time item costs are calculated
  `  // For one-time items, use the full cost range
  const itemCostLow = new Decimal(item.costRange.low || 0);
  const itemCostAvg = new Decimal(item.costRange.average || 0);
  const itemCostHigh = new Decimal(item.costRange.high || 0);`,
  
  // Replace with code that recalculates the values based on MFR and PFR data
  `  // For one-time items, recalculate the cost range based on MFR and PFR data
  // This ensures that GAF adjustments are properly applied
  let itemCostLow = new Decimal(item.costRange.low || 0);
  let itemCostAvg = new Decimal(item.costRange.average || 0);
  let itemCostHigh = new Decimal(item.costRange.high || 0);
  
  // If we have MFR and PFR data, recalculate the cost range
  if (isOneTime && item.mfrMin !== undefined && item.pfrMin !== undefined) {
    console.log('Recalculating one-time item cost range based on MFR and PFR data');
    
    // Get MFR and PFR values
    const mfrValues = getMFRValues();
    const pfrValues = getPFRValues();
    
    // Calculate low cost as average of 50th percentiles with GAF adjustment
    const adjustedMfr50th = new Decimal(mfrValues.min).times(mfrValues.factor);
    const adjustedPfr50th = new Decimal(pfrValues.min).times(pfrValues.factor);
    itemCostLow = adjustedMfr50th.plus(adjustedPfr50th).dividedBy(2);
    
    // Calculate high cost as average of 75th percentiles with GAF adjustment
    const adjustedMfr75th = new Decimal(mfrValues.max).times(mfrValues.factor);
    const adjustedPfr75th = new Decimal(pfrValues.max).times(pfrValues.factor);
    itemCostHigh = adjustedMfr75th.plus(adjustedPfr75th).dividedBy(2);
    
    // Calculate average cost as average of low and high
    itemCostAvg = itemCostLow.plus(itemCostHigh).dividedBy(2);
    
    console.log('Recalculated one-time item cost range:', {
      low: itemCostLow.toNumber(),
      average: itemCostAvg.toNumber(),
      high: itemCostHigh.toNumber()
    });
  }`
);

// Write the modified file
const backupPath = `${filePath}.backup`;
console.log(`Creating backup at: ${backupPath}`);
fs.writeFileSync(backupPath, fileContent);

console.log(`Writing modified file to: ${filePath}`);
fs.writeFileSync(filePath, modifiedContent);

console.log('Fix applied successfully!');
console.log('The fix recalculates the cost range for one-time items based on MFR and PFR data with GAF adjustments.');
console.log('This ensures that the low, average, and high values are different when GAF adjustments are applied.');
