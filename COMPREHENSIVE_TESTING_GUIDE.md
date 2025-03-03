# Comprehensive Testing Guide for LifePlan Genius Calculations

This guide explains the comprehensive testing approach implemented for the LifePlan Genius calculation system. The testing framework is designed to ensure the accuracy and reliability of all cost calculations across the full range of possible inputs and scenarios.

## Testing Approach

The testing framework consists of several complementary approaches:

1. **Property-Based Testing**: Generates thousands of random but valid input combinations to test boundary conditions and discover edge cases.
2. **Golden Master Testing**: Stores known good calculation results and compares future calculations against these golden masters to detect regressions.
3. **Cross-Strategy Validation**: Tests that different calculation strategies produce consistent results when they should, validating strategy selection logic.
4. **Comprehensive Test Combinations**: Tests a predefined set of combinations covering all major calculation scenarios.

## Running the Tests

A convenient shell script is provided to run the tests:

```bash
./run-calculation-tests.sh [options] [test-type]
```

### Options

- `-h, --help`: Show help message
- `-p, --property-samples N`: Number of property-based test samples (default: 500)
- `-s, --seed N`: Random seed for tests (default: current timestamp)
- `-g, --generate-golden`: Generate golden master data
- `-a, --all-combinations`: Use all combinations for comprehensive tests

### Test Types

- `all`: Run all tests (default)
- `property`: Run only property-based tests
- `golden`: Run only golden master tests
- `strategy`: Run only cross-strategy validation tests
- `comprehensive`: Run only comprehensive tests

### Examples

```bash
# Run all tests with default options
./run-calculation-tests.sh

# Run all tests with 1000 property samples and seed 12345
./run-calculation-tests.sh -p 1000 -s 12345

# Generate golden master data and run golden master tests
./run-calculation-tests.sh -g golden

# Run only property-based tests
./run-calculation-tests.sh property
```

## Test Files

The testing framework consists of the following files:

- `src/utils/calculations/__tests__/propertyBasedTesting.mjs`: Implements property-based testing
- `src/utils/calculations/__tests__/goldenMasterTesting.mjs`: Implements golden master testing
- `src/utils/calculations/__tests__/crossStrategyValidation.mjs`: Implements cross-strategy validation
- `src/utils/calculations/__tests__/runComprehensiveTests.mjs`: Implements comprehensive test combinations
- `src/utils/calculations/__tests__/runAllTests.mjs`: Runs all tests and aggregates results
- `run-calculation-tests.sh`: Shell script for running tests with various options
- `test-calculation-matrix.mjs`: Tests a matrix of different calculation scenarios with a mock implementation
- `test-actual-calculations.mjs`: Tests the actual cost calculator implementation with a matrix of different scenarios
- `test-specific-calculation.mjs`: Tests a specific calculation scenario for debugging purposes

## Property-Based Testing

Property-based testing generates random but valid input combinations and tests that the results satisfy certain invariant properties that should always hold true. This approach is particularly effective at finding edge cases and boundary conditions.

### Invariants Tested

- One-time frequency identification: Items with one-time frequency should be correctly identified
- Annual cost for one-time items: Annual cost should be 0 for one-time items
- Non-negative lifetime cost: Lifetime cost should be non-negative
- Cost range validity: Low cost should be <= average cost <= high cost
- Annual vs. lifetime cost: Annual cost should be <= lifetime cost for recurring items
- Decimal precision: All costs should have at most 2 decimal places

## Golden Master Testing

Golden master testing stores known good calculation results and compares future calculations against these golden masters to detect regressions. This approach is particularly effective at ensuring that changes to the calculation logic don't inadvertently change the results.

### Golden Master Data

The golden master data is stored in `src/utils/calculations/__tests__/goldenMasterData.json`. This file contains a set of test cases and their expected results. When running the golden master tests, the current calculation logic is used to calculate results for the same test cases, and these results are compared against the expected results.

To generate new golden master data (e.g., after intentionally changing the calculation logic), run:

```bash
./run-calculation-tests.sh -g golden
```

## Cross-Strategy Validation

Cross-strategy validation tests that different calculation strategies produce consistent results when they should. This approach is particularly effective at validating the strategy selection logic and ensuring that the different strategies are implemented correctly.

### Strategies Tested

- `OneTimeCostStrategy`: For one-time costs
- `RecurringCostStrategy`: For recurring costs
- `AgeIncrementCostStrategy`: For costs with age increments

## Comprehensive Test Combinations

Comprehensive test combinations test a predefined set of combinations covering all major calculation scenarios. This approach is particularly effective at ensuring that all important calculation scenarios are tested.

### Combinations Tested

- Care categories: Medical, Therapy, Equipment, etc.
- Frequency patterns: daily, weekly, monthly, one-time, etc.
- Duration scenarios: age ranges, life expectancy
- Geographic adjustment scenarios: ZIP codes
- CPT code scenarios: standard, invalid, no data
- Age increment scenarios: standard, with gaps, with overlaps

## Test Results

Test results are saved to `src/utils/calculations/__tests__/test-results/`. Each test run generates a JSON file with the results, including:

- Timestamp
- Seed
- Test results for each test type
- Summary statistics (total tests, passed, failed, duration)

## Extending the Tests

To add new test cases or invariants:

1. For property-based testing, modify `generateRandomParams()` or `testInvariants()` in `propertyBasedTesting.mjs`
2. For golden master testing, modify `getCriticalTestCases()` in `goldenMasterTesting.mjs`
3. For cross-strategy validation, modify `generateTestCases()` in `crossStrategyValidation.mjs`
4. For comprehensive test combinations, modify the constants in `testDataGenerator.mjs`

## Continuous Integration

It's recommended to run these tests as part of your continuous integration pipeline to ensure that changes to the calculation logic don't inadvertently change the results. For example, you could add a step to your CI workflow that runs:

```bash
./run-calculation-tests.sh
```

This will run all tests and exit with a non-zero status code if any tests fail.
