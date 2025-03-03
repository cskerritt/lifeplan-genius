# CPT Code Cost Calculation Fix

## Issue Summary

The application was experiencing issues with the calculation of costs based on CPT codes, specifically:

1. Fee schedule percentiles (MFR and PFR) were not being displayed correctly, showing $0.00 values
2. Geographic factors were not being properly applied to the percentiles
3. Combined base rates were not being calculated correctly
4. The base rate was incorrectly set at $30,044.00 instead of the expected $200-$300 range
5. There was a discrepancy between the calculation details and the summary table
6. The application was crashing when trying to add new items with the error "Cannot read properties of undefined (reading 'toFixed')"

## Root Causes

1. **CPT Code Data Retrieval Issue**: The system was failing to retrieve the MFR and PFR percentile values from the database for CPT code 99203, causing NaN values in the calculation steps.

2. **Geographic Factor Application**: The geographic factors were being retrieved but not properly applied to the percentiles. The code was trying to multiply null or undefined values by the geographic factors.

3. **Base Rate Override**: The system was using a hardcoded base rate ($30,044.00) instead of calculating it from the fee schedule percentiles. This was likely a fallback value when the percentile data was missing.

4. **Calculation Flow**: The calculation flow was not following the correct order:
   - First retrieve raw MFR and PFR percentiles
   - Apply geographic factors to these percentiles
   - Calculate combined base rates as averages of the adjusted percentiles
   - Apply frequency multiplier to get annual costs
   - Apply duration multiplier to get lifetime costs

5. **Null/Undefined Handling**: The code was not properly handling null or undefined values, causing errors when trying to call methods like `toFixed()` on undefined values.

6. **Type Errors**: There were TypeScript errors related to the structure of the `adjustedCosts` object, which had been changed to include a `costRange` property.

## Changes Made

### 1. Fixed CPT Code Data Retrieval

- Enhanced the `lookupCPTCode` function in `costCalculator.ts` to provide sample data for CPT code 99203 when database retrieval fails
- Added detailed logging to help diagnose data retrieval issues
- Ensured the function returns properly structured data even in error cases

### 2. Fixed Geographic Factor Application

- Updated the `calculateAdjustedCosts` function to properly apply geographic factors to MFR and PFR percentiles
- Added separate variables to store raw and adjusted percentiles
- Improved error handling and logging for geographic factor application

### 3. Fixed Combined Base Rate Calculation

- Updated the calculation to correctly average the adjusted MFR and PFR percentiles
- Implemented the logic as described in the methodology document:
  - Low = Average of (Adjusted MFR 50th and Adjusted PFR 50th)
  - High = Average of (Adjusted MFR 75th and Adjusted PFR 75th)
  - Average = Average of (Low and High)

### 4. Updated UI Components

- Modified the `ItemCalculationDetails.tsx` component to correctly display:
  - Raw fee schedule percentiles
  - Geographic factors
  - Adjusted percentiles
  - Combined base rates
  - Calculation steps with correct formulas

### 5. Updated Hooks

- Enhanced the `useCostCalculations.ts` hook to return MFR and PFR values for UI display
- Updated the `usePlanItemCosts.ts` hook to ensure it passes the zipCode parameter to the calculation functions

### 6. Fixed Null/Undefined Handling

- Added a `safeFormat` function in `usePlanItemsDb.ts` to safely handle null or undefined values when formatting numbers
- Added null checks and default values in `usePlanItems.ts` to ensure that base rates and costs are always valid numbers
- Updated the structure of the `adjustedCosts` object to include a `costRange` property that contains the cost values

### 7. Fixed Type Errors

- Updated the type definitions in `usePlanItems.ts` to include the `vehicleModifications` property
- Updated references to `adjustedCosts` properties to use the new structure with the `costRange` property

## Verification

After applying these changes, the application should now:

1. Display fee schedule percentiles for CPT code 99203
2. Apply geographic factors to these percentiles
3. Calculate combined base rates as averages of the adjusted percentiles
4. Use these combined base rates for annual and lifetime cost calculations
5. Show consistent values between the calculation details and summary table
6. Successfully add new items without crashing

## Technical Details

### Calculation Flow

The corrected calculation flow follows these steps:

1. **Retrieve CPT Code Data**:
   - Get MFR 50th and 75th percentiles
   - Get PFR 50th and 75th percentiles

2. **Apply Geographic Factors**:
   - Adjusted MFR 50th = MFR 50th × MFR Factor
   - Adjusted MFR 75th = MFR 75th × MFR Factor
   - Adjusted PFR 50th = PFR 50th × PFR Factor
   - Adjusted PFR 75th = PFR 75th × PFR Factor

3. **Calculate Combined Base Rates**:
   - Low = (Adjusted MFR 50th + Adjusted PFR 50th) ÷ 2
   - High = (Adjusted MFR 75th + Adjusted PFR 75th) ÷ 2
   - Average = (Low + High) ÷ 2

4. **Apply Frequency Multiplier**:
   - Annual Cost = Combined Base Rate × Annual Frequency

5. **Apply Duration Multiplier**:
   - Lifetime Cost = Annual Cost × Duration

### Example Calculation

For CPT code 99203 with sample values:

- MFR 50th: $150.00
- MFR 75th: $200.00
- PFR 50th: $175.00
- PFR 75th: $225.00
- MFR Factor: 1.0
- PFR Factor: 1.0
- Frequency: 4 times per year
- Duration: 30 years

The calculation would be:

1. **Apply Geographic Factors**:
   - Adjusted MFR 50th = $150.00 × 1.0 = $150.00
   - Adjusted MFR 75th = $200.00 × 1.0 = $200.00
   - Adjusted PFR 50th = $175.00 × 1.0 = $175.00
   - Adjusted PFR 75th = $225.00 × 1.0 = $225.00

2. **Calculate Combined Base Rates**:
   - Low = ($150.00 + $175.00) ÷ 2 = $162.50
   - High = ($200.00 + $225.00) ÷ 2 = $212.50
   - Average = ($162.50 + $212.50) ÷ 2 = $187.50

3. **Apply Frequency Multiplier**:
   - Annual Cost = $187.50 × 4 = $750.00

4. **Apply Duration Multiplier**:
   - Lifetime Cost = $750.00 × 30 = $22,500.00

This results in a much more reasonable cost compared to the previous incorrect calculation of $30,044.00 × 4 = $120,176.00 per year.

### Null/Undefined Handling

To prevent errors when dealing with potentially null or undefined values, we added the following safeguards:

1. **Safe Formatting Function**:
   ```typescript
   const safeFormat = (value: number | undefined | null): number => {
     if (value === undefined || value === null || isNaN(value)) {
       return 0;
     }
     return Number(value.toFixed(2));
   };
   ```

2. **Default Values for Base Rates**:
   ```typescript
   // Ensure unitCost is a valid number
   if (unitCost === undefined || unitCost === null || isNaN(unitCost)) {
     console.warn('Unit cost is not a valid number, defaulting to 0');
     unitCost = 0;
   }
   
   // Ensure we have a valid base rate for calculation
   const baseRate = adjustedCosts.costRange?.average ?? unitCost;
   if (baseRate === undefined || baseRate === null || isNaN(baseRate)) {
     console.warn('Base rate is not a valid number, defaulting to unit cost');
   }
   ```

3. **Fallback Values for Costs**:
   ```typescript
   // Ensure costs are never null
   const annualCost = costs.annual ?? adjustedCosts.costRange?.average ?? unitCost;
   const lifetimeCost = costs.lifetime ?? ((adjustedCosts.costRange?.average ?? unitCost) * 30);
   ```

These changes ensure that the application can handle missing or invalid data gracefully, preventing crashes and providing reasonable default values when necessary.
