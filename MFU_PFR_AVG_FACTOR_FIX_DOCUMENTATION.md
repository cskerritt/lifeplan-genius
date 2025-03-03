# MFU/PFR Average Factor Fix Documentation

## Issue

The application was applying MFU (Medical Fee Unit) and PFR (Physician Fee Relative) geographic adjustment factors separately to their respective costs. However, this approach wasn't correctly applying these factors to the annual cost calculations, resulting in the use of raw data without proper geographic adjustments.

## Solution

The solution was to calculate the average of the MFU and PFR factors and apply this average factor to the costs. This ensures that the geographic adjustments are properly applied to the annual cost calculations.

### Changes Made

1. Modified `src/utils/calculations/services/itemCostService.ts`:
   - Added calculation of the average of MFU and PFR factors
   - Applied this average factor to costs instead of applying MFU and PFR factors separately
   - Updated the cost calculation logic to use the average factor for all cost sources (MFU, PFR, or base costs)
   - Updated log messages to reflect the use of the average factor

### Implementation Details

The key change is the calculation of the average geographic factor:

```typescript
// Calculate the average of MFU and PFR factors
const avgGeoFactor = new Decimal(geoFactors.mfr_factor).plus(geoFactors.pfr_factor).dividedBy(2);
logger.info('Using average of MFU and PFR factors:', avgGeoFactor.toNumber());
```

This average factor is then applied to the costs:

```typescript
// Apply the average geographic factor
adjustedCostRange = {
  low: combinedLow.times(avgGeoFactor).toDP(2).toNumber(),
  high: combinedHigh.times(avgGeoFactor).toDP(2).toNumber(),
  average: combinedAvg.times(avgGeoFactor).toDP(2).toNumber()
};
```

## Testing

To test this fix, run the application using the provided restart script:

```bash
node restart_app_with_mfu_pfr_avg_fix.mjs
```

Verify that:
1. The application starts without errors
2. Cost calculations are performed correctly with the average of MFU and PFR factors
3. Annual costs reflect the proper application of geographic adjustments

## Expected Outcome

With this fix, the annual costs should now correctly incorporate the average of the MFU and PFR geographic adjustment factors, ensuring that the raw data is properly adjusted before being used in calculations.
