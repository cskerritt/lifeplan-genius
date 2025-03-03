# GAF Adjustment Fix for One-Time Costs

## Issue

The application was not properly displaying the Geographic Adjustment Factor (GAF) adjustments for one-time costs. Specifically:

1. The low, average, and high values for one-time costs were all showing the same value ($177.00) in the UI
2. The GAF adjustments were being correctly applied in the backend calculations, but the UI components were not displaying the full range of values

## Solution

We made the following changes to fix the issue:

### 1. Updated ItemCalculationDetails.tsx

- Modified the component to use the full cost range (low, average, high) for one-time items
- Updated the Lifetime Cost Calculation section to display all three values for one-time items
- Updated the Final Results section to show the low, average, and high values for one-time items

### 2. Updated CalculationBreakdown.tsx

- Modified the CostBreakdown component to display the full cost range for one-time items
- Added a section to show the low, average, and high values for one-time items

### 3. Added Test Script

- Created a test script (`test-one-time-gaf-adjustment.js`) to verify that GAF adjustments are being correctly applied to one-time costs
- The test script:
  - Creates a one-time item with a CPT code
  - Applies a known GAF factor
  - Verifies that the displayed values match the expected calculations
  - Checks that the low, average, and high values are different and correctly calculated

## Verification

You can verify the fix by:

1. Running the test script: `node test-one-time-gaf-adjustment.js`
2. Restarting the app with the fix: `node restart_app_with_gaf_fix.js`
3. Creating a one-time item with a CPT code in the UI
4. Checking that the item shows different values for low, average, and high costs
5. Verifying that the GAF adjustments are being correctly applied by comparing the values with and without a ZIP code

## Technical Details

The core calculation logic in `costCalculator.ts` was already correctly applying GAF adjustments to one-time costs. The issue was in the UI components that were not displaying the full range of values.

For one-time items, the calculation flow is:

1. Retrieve MFR (Medicare Facility Rates) and PFR (Private Facility Rates) percentiles from the database
2. Apply geographic adjustment factors (GAF) to these percentiles
3. Calculate combined base rates as averages of the adjusted percentiles
4. Return the low, average, and high values

The UI components now properly display these values, ensuring that users can see the full range of costs for one-time items.
