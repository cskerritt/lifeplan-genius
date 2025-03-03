# Comprehensive Cost Calculation Testing Framework

This document describes the comprehensive testing framework for cost calculations in the LifePlan Genius application. The framework is designed to test all combinations of care service types and frequencies to ensure there are no bugs or errors in the calculations.

## Overview

The testing framework consists of an HTML-based test runner that can:

1. Generate all possible combinations of test parameters
2. Run tests against each combination
3. Display detailed results with pass/fail indicators
4. Allow filtering and selection of specific test cases
5. Show detailed calculation steps for debugging

## Files

- `test-comprehensive-combinations.html` - The main HTML test file
- `open-comprehensive-test.mjs` - A script to open the test file in the default browser

## Running the Tests

To run the tests, execute the following command:

```bash
./open-comprehensive-test.mjs
```

This will open the test file in your default browser. From there, you can:

- Click "Run Representative Tests" to run a subset of tests (faster)
- Click "Run All Combinations" to run all possible combinations (may be slow)
- Click "Run Specific Test" to configure and run a specific test case
- Click "Clear Results" to clear the test results

## Test Parameters

The testing framework tests combinations of the following parameters:

### Care Categories
- Medical
- Therapy
- Nursing
- Personal Care
- Home Health
- Equipment
- Supplies
- Medications
- Transportation
- Housing
- Nutrition
- Recreation
- Education

### Frequency Patterns
- daily
- weekly
- monthly
- quarterly
- annually
- one-time
- once
- 2x daily
- 3x daily
- 2x weekly
- 3x weekly
- 2x monthly
- 3x monthly
- 2x annually
- 3x annually
- every 2 days
- every 3 days
- every 2 weeks
- every 3 weeks
- every 2 months
- every 3 months

### Duration Scenarios
- Start age 30, End age 80, Life expectancy 85
- Start age 40, No end age, Life expectancy 85
- Start age 50, End age 60, Life expectancy 85

### Geographic Adjustment Scenarios
- New York (high cost)
- Chicago (medium cost)
- Invalid ZIP (no adjustment)

### CPT Code Scenarios
- Standard office visit
- Physical therapy
- No MFU data
- No PFR data
- Invalid CPT code

### Age Increment Scenarios
- No age increments
- Standard age increments (different adjustment factors for different age ranges)

## Validation Criteria

For each test case, the framework validates:

1. All required properties are present in the result
2. One-time frequencies are correctly identified
3. Annual cost is 0 for one-time items
4. Lifetime cost is greater than 0 for non-zero base rates
5. Cost range is valid (low ≤ average ≤ high)

## Test Results

The test results are displayed in a clear, visual format with:

- Summary statistics (passed tests, failed tests, total tests)
- A progress bar showing the percentage of passed tests
- A list of test cases with pass/fail indicators
- Detailed information for each test case, including:
  - Parameters
  - Result
  - Validations
  - Errors (if any)

## Filtering Results

You can filter the test results by:

- Result (all, passed only, failed only)
- Search (by test case name or parameters)

## Edge Cases

The framework also tests various edge cases, including:

- Zero base rate
- Very high base rate
- Start age equals end age
- Start age greater than life expectancy

## Implementation Details

The test framework is implemented entirely in HTML and JavaScript, making it easy to run in any browser without additional dependencies. It uses mock data for external dependencies (CPT codes, geographic factors) to ensure consistent results.

The calculation logic is implemented in JavaScript and closely mirrors the actual calculation logic in the application. This ensures that the tests are accurate and relevant.

## Extending the Tests

To add new test cases:

1. Add new combinations to the `CARE_CATEGORIES`, `FREQUENCY_PATTERNS`, etc. arrays
2. Add new validation criteria to the `validateCalculationResult` function
3. Add new edge cases to the `generateTestCombinations` function

## Troubleshooting

If you encounter issues with the tests:

1. Check the browser console for errors
2. Verify that the calculation logic in the test file matches the actual application logic
3. Try running a specific test case to isolate the issue
