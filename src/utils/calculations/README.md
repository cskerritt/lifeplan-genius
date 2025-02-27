# Centralized Calculation Utilities

This module provides a set of utilities for performing calculations in the Life Care Plan application. It centralizes all calculation logic to ensure consistency, accuracy, and reliability.

## Key Features

- **Standardized frequency parsing** with comprehensive regex patterns and better validation
- **Decimal.js for all financial calculations** to avoid floating-point errors
- **Robust error handling** with appropriate fallbacks for all calculations
- **Comprehensive validation** for all inputs to calculation functions
- **Standardized duration calculations** with clear rules for default values
- **Detailed logging** for calculation steps to aid debugging
- **Unit tests** for edge cases in calculations

## Directory Structure

```
src/utils/calculations/
├── README.md                 # This file
├── index.ts                  # Main entry point
├── types.ts                  # Type definitions
├── logger.ts                 # Logging utilities
├── validation.ts             # Input validation utilities
├── frequencyParser.ts        # Frequency parsing utilities
├── costCalculator.ts         # Cost calculation utilities
├── durationCalculator.ts     # Duration calculation utilities
└── __tests__/                # Unit tests
    ├── frequencyParser.test.ts
    ├── costCalculator.test.ts
    ├── durationCalculator.test.ts
    └── validation.test.ts
```

## Usage

### Frequency Parsing

```typescript
import { parseFrequency, parseDuration, isOneTimeFrequency } from '@/utils/calculations';

// Parse a frequency string
const frequency = parseFrequency('twice monthly');
console.log(frequency);
// {
//   lowFrequency: 24,
//   highFrequency: 24,
//   isOneTime: false,
//   original: 'twice monthly',
//   valid: true
// }

// Parse duration from a frequency string
const duration = parseDuration('4x/year for 10 years', 45, 35);
console.log(duration);
// {
//   lowDuration: 10,
//   highDuration: 10,
//   source: 'frequency',
//   valid: true
// }

// Check if a frequency string represents a one-time occurrence
const isOneTime = isOneTimeFrequency('one-time');
console.log(isOneTime); // true
```

### Cost Calculations

```typescript
import { calculateItemCosts, calculateAdjustedCosts } from '@/utils/calculations';

// Calculate costs for an item
const costs = await calculateItemCosts({
  baseRate: 100,
  frequency: '3 times per week',
  currentAge: 45,
  lifeExpectancy: 35,
});
console.log(costs);
// {
//   annual: 15642.87,
//   lifetime: 547500.45,
//   low: 468000.00,
//   high: 627000.90,
//   average: 547500.45,
//   isOneTime: false
// }

// Calculate adjusted costs based on various factors
const adjustedCosts = await calculateAdjustedCosts({
  baseRate: 100,
  cptCode: '12345',
  category: 'medical',
  zipCode: '12345',
});
console.log(adjustedCosts);
// {
//   low: 80.00,
//   average: 100.00,
//   high: 120.00
// }
```

### Duration Calculations

```typescript
import { 
  determineDuration, 
  calculateDurationFromAgeRange,
  calculateAgeFromDOB 
} from '@/utils/calculations';

// Determine duration based on available information
const duration = determineDuration('4x/year for 10 years', 45, 35);
console.log(duration);
// {
//   lowDuration: 10,
//   highDuration: 10,
//   source: 'frequency',
//   valid: true
// }

// Calculate duration from age range
const durationFromAges = calculateDurationFromAgeRange(45, 75);
console.log(durationFromAges); // 30

// Calculate age from date of birth
const age = calculateAgeFromDOB('1980-01-01');
console.log(age); // 45 (in 2025)
```

## Validation

All calculation functions include comprehensive validation to ensure inputs are valid and to provide meaningful error messages when they are not. For example:

```typescript
import { calculateItemCosts } from '@/utils/calculations';

try {
  const costs = await calculateItemCosts({
    baseRate: -100, // Invalid: negative base rate
    frequency: '',  // Invalid: empty frequency
  });
} catch (error) {
  console.error(error.message);
  // "Invalid calculation parameters: Base rate cannot be negative, Frequency is required"
}
```

## Logging

The calculation utilities include detailed logging to aid debugging. By default, logs are output to the console in development mode but not in production. You can configure the logger to change this behavior:

```typescript
import { calculationLogger } from '@/utils/calculations';

// Configure the logger
calculationLogger.configure({
  enabled: true,
  minLevel: 'debug',
  maxEntries: 200,
  consoleOutput: true,
});

// Get all logs
const logs = calculationLogger.getAll();

// Get logs by level
const errorLogs = calculationLogger.getByLevel('error');
```

## Extending the Utilities

When adding new calculation functionality, follow these guidelines:

1. Add new types to `types.ts`
2. Add validation functions to `validation.ts`
3. Implement the core logic in an appropriate file
4. Export the function from `index.ts`
5. Add unit tests in the `__tests__` directory

## Why This Approach?

This centralized approach to calculations offers several benefits:

- **Consistency**: All calculations use the same logic and validation
- **Reliability**: Decimal.js ensures accurate financial calculations
- **Maintainability**: Changes to calculation logic only need to be made in one place
- **Testability**: Unit tests ensure calculations work as expected
- **Debuggability**: Detailed logging helps identify issues
