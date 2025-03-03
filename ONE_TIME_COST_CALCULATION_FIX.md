# One-Time Cost Calculation Fix

## Issue

The application had issues with the cost range calculations for one-time costs and how they were being added to the totals:

1. The cost range for one-time items wasn't following the same pattern as the physician follow-up items
2. One-time costs weren't being properly added to the category totals and lifetime totals at the bottom of the page

## Solution

We made the following changes to fix the issue:

### 1. Updated PlanTable.tsx

- Modified the lifetime cost calculation to properly include one-time costs
- Added calculation of average one-time costs to be included in the lifetime totals
- Ensured that one-time costs are properly displayed in the UI with their full range (low, average, high)

### 2. Updated CategoryCalculationBreakdown.tsx

- Added calculation of low and high totals for one-time items
- Updated the display to show the one-time cost range in the UI
- Ensured that one-time costs are properly added to the category totals

## Verification

You can verify the fix by:

1. Running the test script: `node test-one-time-cost-totals.js`
2. Restarting the app with the fix: `node restart_app_with_one_time_cost_fix.js`
3. Creating a one-time item with a CPT code in the UI
4. Checking that the item shows different values for low, average, and high costs
5. Verifying that the one-time costs are properly added to the category totals and lifetime totals

## Technical Details

The core issue was that one-time costs weren't being properly handled in the UI components. The backend calculation logic in `costCalculator.ts` was already correctly applying GAF adjustments to one-time costs, but the UI components weren't properly displaying these values or adding them to the totals.

For one-time items, the calculation flow is now:

1. The backend calculates the low, average, and high costs for one-time items
2. The UI components display these values in the cost range column
3. The category totals include the one-time costs in their calculations
4. The lifetime totals at the bottom of the page properly include the one-time costs

This ensures that one-time costs are treated consistently with recurring costs, with the only difference being that one-time costs are not multiplied by a duration.
