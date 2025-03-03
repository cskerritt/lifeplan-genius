# Geographic Adjustment Factors Documentation

## Overview

Geographic Adjustment Factors (GAFs) are critical components in the LifePlan Genius application that ensure cost calculations accurately reflect regional variations in healthcare costs. This document explains how GAFs are implemented, applied, and verified in the system.

## How Geographic Adjustment Factors Work

### Data Source

Geographic adjustment factors are stored in the database and are associated with ZIP codes. Each ZIP code has two primary adjustment factors:

1. **Medicare Facility Rate (MFR) Factor**: Applied to Medicare Fee Unit (MFU) costs
2. **Private Facility Rate (PFR) Factor**: Applied to Private Facility Rate (PFR) costs

These factors are retrieved from the database using the `fetchGeoFactors` function in the `geoFactorsService`.

### Application in Cost Calculations

Geographic adjustment factors are applied at multiple points in the cost calculation process:

1. **CPT Code Costs**: When calculating costs based on CPT codes, the system:
   - Retrieves the raw MFU and PFR costs from the CPT code data
   - Applies the appropriate geographic adjustment factors to these costs
   - Uses the adjusted costs to calculate the final cost range

2. **One-Time Costs**: For one-time costs, geographic adjustment factors are applied to ensure these costs reflect regional variations.

3. **Recurring Costs**: For recurring costs (e.g., annual services), geographic adjustment factors are applied to both the per-unit cost and the calculated annual cost.

### Implementation Details

The application of geographic adjustment factors is implemented in several key components:

1. **geoFactorsService.ts**: Provides functions to fetch and apply geographic adjustment factors
   - `fetchGeoFactors`: Retrieves the factors for a specific ZIP code
   - `applyGeoFactors`: Applies the factors to MFU and PFR costs

2. **adjustedCostService.ts**: Calculates adjusted costs based on various factors, including geographic adjustments
   - Applies geographic factors to both MFU and PFR costs
   - Calculates the final cost range based on the adjusted costs

3. **costCalculator.ts**: Orchestrates the overall cost calculation process
   - Ensures geographic factors are applied consistently across different cost calculation strategies

## Geographic Adjustment Factor Swapping

An important implementation detail is the swapping of MFR and PFR factors to avoid duplicate adjustments:

```javascript
// In geoFactorsService.ts
const factors: GeoFactors = {
  mfr_factor: result.data[0].pfr_code, // Use pfr_code for mfu_fees
  pfr_factor: result.data[0].mfr_code, // Use mfr_code for pfr_fees
};
```

This swapping is intentional and ensures that:

1. The MFR factor (derived from pfr_code in the database) is applied to MFU costs
2. The PFR factor (derived from mfr_code in the database) is applied to PFR costs

This approach prevents duplicate adjustments that would occur if both the CPT code data and the geographic factors applied the same adjustment.

## Manual Cost Override

When a care item has `is_manual_cost` set to `true`, the geographic adjustment factors are bypassed. This allows users to specify exact costs that should not be adjusted based on location.

## Verification

The system includes a test script (`test-geographic-adjustment-factors.mjs`) that verifies:

1. Geographic factors are correctly fetched from the database
2. Factors are properly applied to costs
3. The adjusted costs reflect the expected calculations
4. Manual cost override correctly bypasses geographic adjustments

## Evaluee Duplication and Geographic Factors

When duplicating an evaluee, the geographic adjustment factors are handled as follows:

1. If the ZIP code remains the same, the same geographic factors will be applied
2. If the ZIP code is changed during duplication, the system will automatically look up the appropriate geographic factors for the new location

This ensures that cost calculations for duplicated care plans use the correct geographic adjustment factors based on the location specified for the new evaluee.

## Troubleshooting

If geographic adjustment factors appear to be incorrectly applied, check:

1. The ZIP code associated with the evaluee
2. Whether the care item has manual cost override enabled
3. The database entries for the geographic factors associated with the ZIP code
4. The CPT code data to ensure it contains the expected MFU and PFR values

You can run the `test-geographic-adjustment-factors.mjs` script to verify that geographic factors are being applied correctly.
