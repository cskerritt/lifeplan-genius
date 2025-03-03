# Cost Calculation Debugging Guide

This guide explains how to use the new debugging and testing tools to identify and fix issues with cost calculations, particularly the $0 output problem.

## Overview

We've implemented a comprehensive debugging and testing system that allows you to:

1. Add verbose debugging to track calculation steps
2. Detect zero values in calculations
3. Run automated tests without browser interaction
4. Generate detailed reports to identify patterns

## Available Tools

### 1. Enhanced Logger

The calculation logger has been enhanced with:

- More detailed logging levels (trace, debug, info, warn, error)
- Zero value detection and reporting
- Calculation tracing with step-by-step tracking
- Structured logging for easier analysis

### 2. Standalone Test Scripts

Three main test scripts are available:

- `debug-cost-calculations.mjs`: Tests with a mock implementation
- `test-actual-cost-calculations.mjs`: Tests with the actual application code
- `run-cost-tests.mjs`: Runs all tests and generates a comprehensive report

## How to Use

### Running Tests

To run all tests and generate a comprehensive report:

```bash
node run-cost-tests.mjs --export --verbose
```

Options:
- `--verbose`: Enable detailed logging
- `--export`: Export logs to JSON files
- `--mock-only`: Only run the mock tests
- `--actual-only`: Only run the actual tests

### Running Individual Tests

To run a specific test case:

```bash
node debug-cost-calculations.mjs --test-case=1 --verbose
```

Or for actual code:

```bash
node test-actual-cost-calculations.mjs --test-case=2 --verbose
```

### Analyzing Results

Test results are stored in the `test-results` directory, organized by test run. Each run includes:

- JSON files with detailed logs
- Zero value reports
- Test results
- A summary markdown file

## Debugging Zero Values

The system automatically detects and reports zero values in calculations. When a zero value is detected:

1. It's logged with detailed context
2. The calculation path is traced
3. The input parameters are recorded

This helps identify where and why zero values are occurring.

## Common Issues and Solutions

### 1. Zero Base Rate

**Issue**: The base rate is zero or not provided.
**Solution**: Ensure a valid base rate is provided for all calculations.

### 2. Invalid Frequency

**Issue**: The frequency string can't be parsed correctly.
**Solution**: Use standard frequency formats like "monthly", "weekly", etc.

### 3. Missing Age Information

**Issue**: Current age or life expectancy is missing.
**Solution**: Provide both current age and life expectancy, or start and end ages.

### 4. CPT Code Issues

**Issue**: CPT code lookup fails or returns invalid data.
**Solution**: Verify CPT codes exist in the database and have valid cost data.

### 5. Geographic Factor Issues

**Issue**: Geographic factors can't be retrieved for a ZIP code.
**Solution**: Ensure ZIP codes are valid and have corresponding geographic factors.

## Adding More Tests

To add more test cases, edit the `testCases` array in either test script:

```javascript
const testCases = [
  {
    name: 'Your Test Case',
    params: {
      baseRate: 100,
      frequency: 'monthly',
      // Add other parameters
    },
    expectedResult: {
      annual: 1200,
      lifetime: 48000,
      isOneTime: false
    }
  },
  // Add more test cases
];
```

## Extending the System

### Adding More Debugging Points

To add more debugging points in the calculation code:

```javascript
// In any calculation function
const { logger, calculationId, logStep, end } = calculationLogger.createCalculationContext(
  'functionName',
  params
);

// Log a step
logStep('Doing something important', { someData });

// Log a zero value
if (isZeroOrNearZero(someValue)) {
  calculationLogger.logZeroValue(calculationId, 'fieldName', { 
    someValue,
    message: 'Value is zero'
  });
}

// End the calculation
end(result);
```

### Creating Custom Tests

You can create custom test scripts by copying and modifying the existing ones. The key components are:

1. The `DebugLogger` class for logging
2. The `checkForZeroValues` function for zero detection
3. The test cases array
4. The test runner function

## Best Practices

1. **Always run with `--verbose` when debugging**: This provides the most detailed information.
2. **Use `--export` to save logs**: This allows for post-run analysis.
3. **Check zero value reports**: These highlight where calculations are failing.
4. **Add specific test cases**: When you find a bug, add a test case for it.
5. **Run tests after changes**: Verify that your changes fixed the issue without breaking other cases.

## Troubleshooting

If you encounter issues with the test scripts:

1. **Import errors**: Make sure all dependencies are installed.
2. **Path errors**: Verify file paths in the scripts.
3. **Runtime errors**: Check the error message and stack trace for clues.
4. **Zero values**: Look for patterns in the zero value reports.

## Conclusion

These tools provide a comprehensive way to debug and test cost calculations without relying on browser interaction. By using them consistently, you can identify and fix issues more efficiently.
