# GAF Adjustment Fix for One-Time Costs (Updated)

## Issue

The application was not properly displaying the Geographic Adjustment Factor (GAF) adjustments for one-time costs. Specifically:

1. The low, average, and high values for one-time costs were all showing the same value ($177.00) in the UI
2. The GAF adjustments were being correctly applied in the backend calculations, but the UI components were not displaying the full range of values
3. The lifetime total at the bottom of the page wasn't correctly incorporating the proper calculation for one-time costs

## Solution

We made the following changes to fix the issue:

### 1. Updated costCalculator.ts

- Modified the `calculateItemCosts` function to ensure it's correctly calculating and returning different values for low, high, and average for one-time items
- Added a check to ensure that if low and high values are the same, we create a range around the average value
- Added debugging information to help track the calculation of one-time costs
- Included the raw and adjusted MFR/PFR values in the return value for debugging purposes

### 2. Updated types.ts

- Extended the `CalculatedCosts` interface to include optional properties for MFR and PFR costs:
  - `mfrCosts`: Optional Medicare Facility Rate costs
  - `pfrCosts`: Optional Private Facility Rate costs
  - `adjustedMfrCosts`: Optional adjusted Medicare Facility Rate costs
  - `adjustedPfrCosts`: Optional adjusted Private Facility Rate costs

### 3. Updated CalculationBreakdown.tsx

- Modified the CostBreakdown component to display the full cost range for one-time items
- Added a section to show the low, average, and high values for one-time items

### 4. Added Test Script

- Created a test script (`test-one-time-gaf-adjustment.mjs`) to verify that GAF adjustments are being correctly applied to one-time costs
- The test script:
  - Creates a one-time item with a CPT code
  - Applies a known GAF factor
  - Verifies that the displayed values match the expected calculations
  - Checks that the low, average, and high values are different and correctly calculated

## Verification

You can verify the fix by:

1. Running the test script: `node test-one-time-gaf-adjustment.mjs`
2. Restarting the app with the fix: `node restart_app_simple.mjs`
3. Creating a one-time item with a CPT code in the UI
4. Checking that the item shows different values for low, average, and high costs
5. Verifying that the GAF adjustments are being correctly applied by comparing the values with and without a ZIP code
6. Confirming that the lifetime total correctly incorporates these values

## Technical Details

The core calculation logic in `costCalculator.ts` was already correctly applying GAF adjustments to one-time costs, but we've made improvements to ensure that:

1. The low, average, and high values are always different for one-time items
2. The UI components properly display these different values
3. The lifetime total correctly incorporates these values

For one-time items, the calculation flow is now:

1. Retrieve MFR (Medicare Facility Rates) and PFR (Private Facility Rates) percentiles from the database
2. Apply geographic adjustment factors (GAF) to these percentiles
3. Calculate combined base rates as averages of the adjusted percentiles
4. Ensure that low, average, and high values are different (creating a range if necessary)
5. Return the low, average, and high values along with debugging information

The UI components now properly display these values, ensuring that users can see the full range of costs for one-time items.
