# Cost Range Calculation Fix Documentation

## Issue

The cost range calculation in the application had several issues:

1. It was primarily using PFR (Private Fee Relative) values and not properly incorporating MFU (Medicare Fee Unit) values
2. The order of the cost range was not intuitive (low, average, high instead of low, high, average)
3. It was using 90th percentile values which were not needed for the calculation

## Solution

We've updated the cost calculation logic to:

1. Include both MFU and PFR values in the cost range calculation
2. Change the order to show low, high, then average (where average is calculated from low and high)
3. Use only the 50th and 75th percentiles (not 90th)

### Implementation Details

The changes were made in two key files:

1. `src/hooks/useCostCalculations.ts`
2. `src/utils/calculations/costCalculator.ts`

In both files, we updated the cost calculation logic to:

- Use 50th percentiles (from both MFU and PFR when available) for the low value
- Use 75th percentiles (from both MFU and PFR when available) for the high value
- Calculate the average as (low + high) / 2

We also added clearer comments to explain the calculation methodology.

### Benefits

This change provides several benefits:

1. **More Accurate Costs**: By incorporating both MFU and PFR values, the cost range is more representative of real-world costs
2. **More Intuitive Display**: The low-high-average order is more intuitive for users to understand
3. **Simplified Calculation**: By removing the 90th percentile from the calculation, we've simplified the logic while maintaining accuracy

## Testing

To test this fix, run the application using the provided restart script:

```bash
node restart_app_with_cost_range_fix.js
```

Verify that:
1. The application starts without errors
2. Cost ranges display correctly in the low, high, average order
3. Both MFU and PFR values are being used in the calculation (when available)
4. The 90th percentile values are no longer being used

## Technical Notes

- The calculation logic handles cases where only MFU data is available, only PFR data is available, or both are available
- Geographic adjustment factors are still applied to the respective fee schedules
- The average is now consistently calculated as (low + high) / 2, making it more predictable
