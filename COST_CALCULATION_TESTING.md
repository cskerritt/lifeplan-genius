# Cost Calculation Testing Documentation

This document outlines the comprehensive testing approach for the care services cost calculation system. The testing framework is designed to ensure that all combinations of service types and frequencies are properly tested to identify any potential bugs or errors in the calculations.

## Testing Approach

The testing framework uses a matrix-based approach to test all possible combinations of:

1. **Care Categories** (13 categories)
   - physicianEvaluation, physicianFollowUp, therapyEvaluation, therapyFollowUp, medication, surgical, dme, supplies, homeCare, homeModification, transportation, interventional, diagnostics

2. **Frequency Types** (20+ patterns)
   - one-time, once, annual, yearly, once a year, semi-annual, twice a year, quarterly, monthly, 2 times per month, twice a month, biweekly, every other week, weekly, 2 times per week, twice a week, daily, every day, 3 times per day, 3-5 times per year, 4-4x per year 30 years

3. **Duration Scenarios** (3 types)
   - Duration from frequency string (e.g., "for 5-10 years")
   - Duration from age range (e.g., startAge to endAge)
   - Default duration (based on current age and life expectancy)

4. **Geographic Adjustment Scenarios** (3 scenarios)
   - With valid ZIP code
   - Without ZIP code
   - With invalid ZIP code

5. **CPT Code Scenarios** (5 scenarios)
   - With valid CPT code
   - Without CPT code
   - With invalid CPT code
   - With CPT code that has no MFU data
   - With CPT code that has no PFR data

6. **Age Increment Scenarios** (2 scenarios)
   - Without age increments
   - With age increments (including various patterns)

7. **Edge Cases**
   - Zero base rate
   - Invalid frequency string
   - Age increments with gaps
   - Age increments with overlaps
   - Negative durations (end age less than start age)

## Test Files

The testing framework consists of the following files:

1. **costCalculationMatrix.test.ts**
   - Jest test suite that tests a subset of combinations
   - Includes tests for each category, frequency pattern, and edge case

2. **testDataGenerator.ts**
   - Utility to generate test combinations
   - Provides functions to generate all combinations or a representative subset

3. **runComprehensiveTests.js**
   - Script to run tests for all combinations
   - Validates results and reports failures

4. **test-cost-calculations.js**
   - Main test runner script
   - Supports generating HTML reports

## Running Tests

### Basic Test Suite

To run the basic Jest test suite:

```bash
npm test -- src/utils/calculations/__tests__/costCalculationMatrix.test.ts
```

This will run a subset of tests to verify basic functionality.

### Comprehensive Tests

To run comprehensive tests for all combinations:

```bash
node test-cost-calculations.js
```

By default, this will test a representative subset of combinations to keep runtime reasonable.

### Testing All Combinations

To test all possible combinations (may take longer):

```bash
node test-cost-calculations.js --all
```

### Generating a Report

To generate an HTML report of the test results:

```bash
node test-cost-calculations.js --report
```

This will create a file named `cost-calculation-test-report.html` with detailed test results.

## Validation Criteria

The tests validate the following criteria for each combination:

1. All required properties are present in the result
2. One-time frequencies are correctly identified
3. Annual cost is 0 for one-time items
4. Lifetime cost is greater than 0 for non-zero base rates
5. Cost range is valid (low ≤ average ≤ high)

## Extending the Tests

To add new test cases:

1. Add new combinations to the `generateTestCombinations` function in `testDataGenerator.ts`
2. Add specific test cases to `costCalculationMatrix.test.ts` for important scenarios
3. Update validation criteria in `runComprehensiveTests.js` if needed

## Troubleshooting

If tests fail, the test runner will provide detailed information about the failure, including:

1. The name of the failed test case
2. The error message
3. The parameters used for the test

This information can be used to identify and fix issues in the calculation logic.

## Continuous Integration

It's recommended to run these tests as part of your CI/CD pipeline to ensure that any changes to the calculation logic don't introduce regressions.

Example GitHub Actions workflow:

```yaml
name: Cost Calculation Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16.x'
    - run: npm ci
    - run: node test-cost-calculations.js --report
    - name: Archive test report
      uses: actions/upload-artifact@v2
      with:
        name: test-report
        path: cost-calculation-test-report.html
```

## Conclusion

This comprehensive testing approach ensures that all combinations of care services and frequencies are properly tested, helping to identify and fix any bugs or errors in the calculation logic. By running these tests regularly, you can maintain high confidence in the accuracy of your cost calculations.
