# One-Time GAF Display Fix

## Issue

The application was not properly displaying the Geographic Adjustment Factor (GAF) adjustments for one-time costs in the ItemCalculationDetails component. Specifically:

1. The low, average, and high values for one-time costs were all showing the same value ($177.00) in the UI
2. The GAF adjustments were being correctly applied in the backend calculations, but the UI components were not displaying the full range of values

## Root Cause

After investigation, we found that the issue was in the `ItemCalculationDetails.tsx` component. For one-time items, the component was using the raw `costRange` values from the item object without recalculating them based on the MFR and PFR data with GAF adjustments.

```typescript
// For one-time items, use the full cost range
const itemCostLow = new Decimal(item.costRange.low || 0);
const itemCostAvg = new Decimal(item.costRange.average || 0);
const itemCostHigh = new Decimal(item.costRange.high || 0);
```

The backend calculation logic in `costCalculator.ts` was correctly applying GAF adjustments to one-time costs, but the UI component was not using these adjusted values.

## Solution

We made the following changes to fix the issue:

### 1. Updated ItemCalculationDetails.tsx

- Modified the component to recalculate the cost range for one-time items based on MFR and PFR data with GAF adjustments
- Added debugging information to help identify if GAF adjustments are being applied correctly

```typescript
// For one-time items, recalculate the cost range based on MFR and PFR data
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
}
```

### 2. Added Debugging Information

- Added a note in the UI that values should be different if GAF adjustments are applied correctly
- Added console logging to help debug the issue

## Verification

You can verify the fix by:

1. Running the app with the fix: `node restart_app_with_one_time_gaf_fix.js`
2. Creating a one-time item with a CPT code in the UI
3. Checking that the item shows different values for low, average, and high costs
4. Verifying that the GAF adjustments are being correctly applied by comparing the values with and without a ZIP code

## Technical Details

The core calculation logic in `costCalculator.ts` was already correctly applying GAF adjustments to one-time costs. The issue was in the UI component that was not recalculating the values based on the MFR and PFR data with GAF adjustments.

For one-time items, the calculation flow is now:

1. Retrieve MFR (Medicare Facility Rates) and PFR (Private Facility Rates) percentiles from the item
2. Apply geographic adjustment factors (GAF) to these percentiles
3. Calculate low cost as average of 50th percentiles with GAF adjustment
4. Calculate high cost as average of 75th percentiles with GAF adjustment
5. Calculate average cost as average of low and high
6. Display these recalculated values in the UI

This ensures that the low, average, and high values are different when GAF adjustments are applied, providing a more accurate representation of the cost range for one-time items.
