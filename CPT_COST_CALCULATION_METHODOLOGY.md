# CPT Code Cost Calculation Methodology

This document outlines the revised methodology for calculating costs based on CPT codes in the LifePlan Genius application.

## Overview

The cost calculation process follows these key steps:

1. Retrieve CPT code data from the database
2. Apply geographic adjustment factors
3. Calculate low, high, and average costs
4. Apply frequency and duration factors
5. Calculate annual and lifetime costs

## Detailed Process

### 1. Database Retrieval

When a CPT code is entered in the application:

- The system retrieves the following CPT code data:
  - Medicare Facility Rates (MFR): `mfr_50th` and `mfr_75th` percentiles
  - Private Facility Rates (PFR): `pfr_50th` and `pfr_75th` percentiles
  - Additional metadata including code description

### 2. Geographic Adjustment

If a ZIP code is provided:

- The system retrieves geographic adjustment factors:
  - Medicare Facility Rate factor (`mfr_factor`)
  - Private Facility Rate factor (`pfr_factor`)

- These factors are applied separately to their respective percentiles:
  - Adjusted MFR 50th = `mfr_50th` × `mfr_factor`
  - Adjusted MFR 75th = `mfr_75th` × `mfr_factor`
  - Adjusted PFR 50th = `pfr_50th` × `pfr_factor`
  - Adjusted PFR 75th = `pfr_75th` × `pfr_factor`

### 3. Cost Range Calculation

The cost range is calculated as follows:

- **When both MFR and PFR data are available:**
  - Low Cost = Average of (Adjusted MFR 50th and Adjusted PFR 50th)
  - High Cost = Average of (Adjusted MFR 75th and Adjusted PFR 75th)
  - Average Cost = Average of (Low Cost and High Cost)

- **When only MFR data is available:**
  - Low Cost = Adjusted MFR 50th
  - High Cost = Adjusted MFR 75th
  - Average Cost = Average of (Low Cost and High Cost)

- **When only PFR data is available:**
  - Low Cost = Adjusted PFR 50th
  - High Cost = Adjusted PFR 75th
  - Average Cost = Average of (Low Cost and High Cost)

All calculations utilize Decimal.js for numerical precision to avoid floating-point inaccuracies.

### 4. Frequency Parsing

The system parses the frequency string to determine how often the service occurs:

- The `parseFrequency` function analyzes patterns like "3 times per week", "monthly", "quarterly", etc.
- It calculates the number of occurrences per year (e.g., "3 times per week" = 156 times per year)
- It also determines if the item is a one-time occurrence
- The result is a `ParsedFrequency` object with `lowFrequency` and `highFrequency` values

### 5. Duration Calculation

The system determines the duration for which the service will be needed:

- The `parseDuration` function extracts duration information from:
  - The frequency string (e.g., "for 5 years")
  - The age range (start age to end age)
  - Current age and life expectancy
- The result is a `ParsedDuration` object with `lowDuration` and `highDuration` values

### 6. Final Cost Computation

For one-time items:
- Annual cost = 0 (no recurring cost)
- Lifetime cost = Average cost from the cost range

For recurring items:
- Annual cost = Average cost × Annual frequency
- Lifetime cost = Annual cost × Duration

All costs are consistently displayed with decimal precision for accuracy and transparency.

### 7. Age Increment Handling

For items with age increments (different frequencies at different ages):

- Each age increment is processed separately
- Costs are calculated for each increment based on its frequency and duration
- The results are aggregated to provide total annual and lifetime costs

## Special Considerations

- **Decimal Precision**: All calculations use Decimal.js to avoid floating-point errors
- **Geographic Adjustments**: MFR and PFR factors are applied separately to their respective percentiles
- **Validation**: Cost ranges are validated to ensure logical consistency (low ≤ average ≤ high)
- **Error Handling**: Fallback values are provided when calculations fail
- **Multi-source Costs**: For certain categories, costs can be calculated from multiple sources using statistical methods

## Implementation

The implementation of this methodology is primarily found in:

- `src/utils/calculations/costCalculator.ts`: Core calculation logic
- `src/hooks/useCostCalculations.ts`: React hook for using the calculations
- `src/hooks/usePlanItemCosts.ts`: Hook for calculating costs for plan items

## Logging and Debugging

The system includes comprehensive logging to track the calculation process:

- Input parameters are logged
- Intermediate calculation steps are logged
- Final results are logged
- Warnings and errors are logged for troubleshooting

This logging helps ensure transparency and facilitates debugging of complex calculations.
