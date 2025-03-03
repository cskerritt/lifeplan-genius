# MFU/MFR Field Name Fix Documentation

## Issue

There was an inconsistency in the codebase regarding how Medicare fee values were referenced:

- The database and CPTCode interface use `mfu_*` prefixes for Medicare fee values (e.g., `mfu_50th`, `mfu_75th`, `mfu_90th`)
- However, some parts of the code were incorrectly referencing these values with `mfr_*` prefixes (e.g., `mfr_50th`, `mfr_75th`, `mfr_90th`)

This inconsistency was causing issues with fee lookups, as the code was trying to access properties that didn't exist or had different names than expected.

## Solution

The solution was to update all references to `mfr_50th`, `mfr_75th`, and `mfr_90th` to use `mfu_50th`, `mfu_75th`, and `mfu_90th` instead when referring to the Medicare fee values. This ensures consistency throughout the codebase and fixes the fee lookup issues.

### Files Modified

1. `src/utils/calculations/costCalculator.ts`
   - Updated all references to `mfr_50th`, `mfr_75th`, and `mfr_90th` to use `mfu_50th`, `mfu_75th`, and `mfu_90th` instead
   - Updated log messages to reflect the correct field names

2. `src/components/LifeCarePlan/GlobalCalculationInfo.tsx`
   - Updated the example code to use `mfu_50th` and `mfu_75th` instead of `mfr_50th` and `mfr_75th`

3. `src/hooks/useCostCalculations.ts`
   - Updated the data availability checks to look for `mfu_50th` and `mfu_75th` instead of `mfr_50th` and `mfr_75th`
   - Updated the raw percentile extraction to use `mfu_50th` and `mfu_75th` instead of `mfr_50th` and `mfr_75th`
   - Updated log messages to reflect the correct field names

### Important Notes

- The `mfr_factor` and `pfr_factor` fields were NOT changed, as these are correctly named and separate from the Medicare fee values
- The variable names in the code (e.g., `rawMfr50th`, `adjustedMfr50th`) were kept the same for consistency, even though they now reference `mfu_*` fields
- This fix ensures that the code correctly accesses the Medicare fee values from the database, which should resolve any issues with fee lookups

## Testing

To test this fix, run the application using the provided restart script:

```bash
node restart_app_with_mfu_fix.js
```

Verify that:
1. The application starts without errors
2. Fee lookups work correctly
3. Cost calculations are performed correctly
