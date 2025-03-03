# Comprehensive Testing Guide for LifePlan Genius Calculations

This guide explains the comprehensive testing approach implemented for the LifePlan Genius calculation system. The testing framework is designed to ensure the accuracy and reliability of all cost calculations across the full range of possible inputs and scenarios.

## Testing Approach

The testing framework consists of several complementary approaches:

1. **Property-Based Testing**: Generates thousands of random but valid input combinations to test boundary conditions and discover edge cases.
2. **Golden Master Testing**: Stores known good calculation results and compares future calculations against these golden masters to detect regressions.
3. **Cross-Strategy Validation**: Tests that different calculation strategies produce consistent results when they should, validating strategy selection logic.
4. **Comprehensive Test Combinations**: Tests a predefined set of combinations covering all major calculation scenarios.
5. **Matrix Testing**: Tests a matrix of different calculation scenarios to ensure that all combinations of inputs produce correct results.
6. **Specific Scenario Testing**: Tests specific calculation scenarios for debugging purposes.

## Running the Tests

Several scripts are provided to run the tests:

### Main Test Runner

```bash
./run-calculation-tests.sh [options] [test-type]
```

#### Options

- `-h, --help`: Show help message
- `-p, --property-samples N`: Number of property-based test samples (default: 500)
- `-s, --seed N`: Random seed for tests (default: current timestamp)
- `-g, --generate-golden`: Generate golden master data
- `-a, --all-combinations`: Use all combinations for comprehensive tests

#### Test Types

- `all`: Run all tests (default)
- `property`: Run only property-based tests
- `golden`: Run only golden master tests
- `strategy`: Run only cross-strategy validation tests
- `comprehensive`: Run only comprehensive tests

#### Examples

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

### Quick Test Runner

```bash
./run-quick-test.sh
```

This script runs a quick test with a small number of samples (10 by default) to quickly verify that the calculation logic is working correctly.

### Matrix Test Runner

```bash
node test-calculation-matrix.mjs
```

This script tests a matrix of different calculation scenarios with a mock implementation to ensure that all combinations of inputs produce correct results.

### Actual Calculation Test Runner

```bash
node test-actual-calculations.mjs [--samples=100] [--seed=123]
```

This script tests the actual cost calculator implementation with a matrix of different scenarios to ensure that all combinations of inputs produce correct results.

#### Options

- `--samples=N`: Number of test samples (default: 100)
- `--seed=N`: Random seed for tests (default: current timestamp)

#### Examples

```bash
# Run with default options
node test-actual-calculations.mjs

# Run with 50 samples and seed 12345
node test-actual-calculations.mjs --samples=50 --seed=12345
```

### Specific Calculation Test Runner

```bash
node test-specific-calculation.mjs
```

This script tests a specific calculation scenario for debugging purposes. You can modify the `TEST_CASE` constant in the script to test different scenarios.

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
- `run-quick-test.sh`: Shell script for running a quick test with a small number of samples

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

## Matrix Testing

Matrix testing tests a matrix of different calculation scenarios to ensure that all combinations of inputs produce correct results. This approach is particularly effective at finding edge cases and boundary conditions.

### Parameters Tested

- Frequencies: daily, weekly, monthly, quarterly, annually, one-time
- Categories: Medical, Therapy, Equipment, Supplies
- Base rates: 0, 0.01, 100, 10000
- Age scenarios: young with long life expectancy, middle-aged, age range - long, age range - short
- ZIP codes: New York, Beverly Hills, no ZIP
- CPT codes: standard office visit, no CPT code
- Age increments: various combinations of start age, end age, and adjustment factor

## Specific Scenario Testing

Specific scenario testing tests specific calculation scenarios for debugging purposes. This approach is particularly effective at debugging issues with specific combinations of inputs.

### Test Case

The test case is defined in the `TEST_CASE` constant in the `test-specific-calculation.mjs` script. You can modify this constant to test different scenarios.

## Test Results

Test results are saved to JSON files with timestamps in the filename. Each test run generates a JSON file with the results, including:

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
5. For matrix testing, modify the constants in `test-calculation-matrix.mjs` or `test-actual-calculations.mjs`
6. For specific scenario testing, modify the `TEST_CASE` constant in `test-specific-calculation.mjs`

## Continuous Integration

It's recommended to run these tests as part of your continuous integration pipeline to ensure that changes to the calculation logic don't inadvertently change the results. For example, you could add a step to your CI workflow that runs:

```bash
./run-calculation-tests.sh
```

This will run all tests and exit with a non-zero status code if any tests fail.

## Troubleshooting

If you encounter issues with the tests, here are some common problems and solutions:

### Module Not Found Errors

If you see errors like `Cannot find module '/path/to/module'`, it may be because the tests are trying to import TypeScript files directly. There are a few ways to fix this:

1. Use the compiled JavaScript files instead of the TypeScript files. The tests will try to import from `./dist/utils/calculations/costCalculator.js` first, and if that fails, they will try to import from `./src/utils/calculations/costCalculator.ts`.
2. Use ts-node to run the tests. The tests will try to use ts-node if available.
3. If both of the above fail, the tests will use a mock implementation.

### Path Alias Errors

If you see errors related to path aliases (e.g., `@/types/lifecare`), it may be because the tests are running in a different environment than the application. To fix this, update the imports to use relative paths instead of path aliases.

For example, change:

```typescript
import { AgeIncrement } from '@/types/lifecare';
```

To:

```typescript
import { AgeIncrement } from '../../../types/lifecare';
```

### Test Failures

If tests are failing, check the test results JSON file for details on which tests failed and why. The test results include the test case, the result, and the validation details.

If you need to debug a specific test case, you can use the `test-specific-calculation.mjs` script to test that specific case in isolation.
