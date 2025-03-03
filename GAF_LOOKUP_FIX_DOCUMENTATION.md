# Geographic Adjustment Factor (GAF) Lookup Fix Documentation

## Issue

There was an inconsistency in how the geographic adjustment factors from the `gaf_lookup` table were being applied to Medicare Fee Unit (MFU) and Private Facility Rate (PFR) costs:

- The `mfr_code` from the `gaf_lookup` table was incorrectly being used to adjust MFU costs
- The `pfr_code` from the `gaf_lookup` table was incorrectly being used to adjust PFR costs

This inconsistency was causing incorrect geographic adjustments, as the codes were being applied to the wrong fee types. Additionally, there was a risk of duplicate adjustments being applied.

## Solution

The solution was to swap the mapping of the codes to ensure they are applied to the correct fee types:

1. Use `pfr_code` from the `gaf_lookup` table for `mfu_fees` (stored as `mfr_factor` in the code)
2. Use `mfr_code` from the `gaf_lookup` table for `pfr_fees` (stored as `pfr_factor` in the code)

This ensures that the geographic adjustments are applied correctly and only once.

### Files Modified

1. `src/utils/calculations/services/geoFactorsService.ts`
   - Updated the mapping of `mfr_code` and `pfr_code` to `mfr_factor` and `pfr_factor`
   - Added clear comments to explain which code is used for which fee type
   - Enhanced the `applyGeoFactors` function with better documentation and comments
   - Added additional logging to make it clear which code is being used for which fee type

### Implementation Details

The key change is in the `fetchGeoFactors` function:

```typescript
// Before
const factors: GeoFactors = {
  mfr_factor: result.data[0].mfr_code,
  pfr_factor: result.data[0].pfr_code,
};

// After
const factors: GeoFactors = {
  mfr_factor: result.data[0].pfr_code, // Use pfr_code for mfu_fees
  pfr_factor: result.data[0].mfr_code, // Use mfr_code for pfr_fees
};
```

The `applyGeoFactors` function was also updated with clearer documentation:

```typescript
/**
 * Applies geographic factors to MFU and PFR costs
 * @param mfuCost - The MFU (Medicare Fee Unit) cost to adjust
 * @param pfrCost - The PFR (Private Facility Rate) cost to adjust
 * @param geoFactors - The geographic factors to apply
 * @returns The adjusted costs
 * 
 * Note: mfr_factor (from pfr_code in gaf_lookup) is applied to MFU costs
 *       pfr_factor (from mfr_code in gaf_lookup) is applied to PFR costs
 */
```

## Testing

To test this fix, run the application using the provided scripts:

```bash
# To restart the application with the fix
node restart_app_with_gaf_lookup_fix.mjs

# To test the fix with a simplified test script (recommended)
node test-gaf-lookup-fix-simple.mjs
```

> **Important:** We've created a simplified test script (`test-gaf-lookup-fix-simple.mjs`) that doesn't rely on importing TypeScript files directly, which can cause issues with Node.js. This script uses mock data to verify that the fix is working correctly.

Verify that:

1. Geographic adjustments are applied correctly to MFU and PFR costs
2. The logs show the correct mapping of codes to fee types
3. No duplicate adjustments are being applied

> **Note:** The scripts use ES module syntax (`.mjs` extension) to ensure compatibility with the project's module system. Always use the `.mjs` extension for new scripts in this project.

## Expected Outcome

With this fix, the geographic adjustments should now be applied correctly:

- `pfr_code` from the `gaf_lookup` table is used to adjust MFU costs
- `mfr_code` from the `gaf_lookup` table is used to adjust PFR costs

This ensures that the correct geographic adjustments are applied to each fee type, and that no duplicate adjustments are being applied.
