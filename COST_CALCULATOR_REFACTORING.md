# Cost Calculator Refactoring Documentation

## Overview

The cost calculator module has been refactored to improve maintainability, readability, and testability. The original monolithic `costCalculator.ts` file has been split into smaller, more focused service modules, each responsible for a specific aspect of the cost calculation process.

## Refactoring Goals

1. **Improved Maintainability**: Smaller, focused files are easier to maintain and update.
2. **Better Separation of Concerns**: Each service handles a specific aspect of the calculation process.
3. **Enhanced Testability**: Smaller, focused modules are easier to test in isolation.
4. **Clearer Code Organization**: The new structure makes it easier to understand the overall architecture.
5. **Reduced Cognitive Load**: Developers can focus on one aspect of the system at a time.

## New Structure

The cost calculator has been refactored into the following services:

### 1. Geographic Factors Service (`geoFactorsService.ts`)

Responsible for:
- Fetching geographic adjustment factors for ZIP codes
- Applying geographic factors to costs
- Providing default geographic factors

### 2. CPT Code Service (`cptCodeService.ts`)

Responsible for:
- Looking up CPT codes to get standard rates
- Checking if CPT code data has MFU values
- Checking if CPT code data has PFR values

### 3. Multi-Source Cost Service (`multiSourceCostService.ts`)

Responsible for:
- Calculating costs from multiple sources
- Providing statistical measures for cost ranges

### 4. Adjusted Cost Service (`adjustedCostService.ts`)

Responsible for:
- Calculating adjusted costs based on various factors
- Handling CPT code data and geographic factors
- Providing cost ranges with low, average, and high values

### 5. Item Cost Service (`itemCostService.ts`)

Responsible for:
- Calculating costs for items based on frequency, duration, and other factors
- Handling one-time items and recurring items
- Supporting age increments for more complex calculations

### 6. Main Cost Calculator (`costCalculator.ts`)

The main file now serves as a facade that:
- Imports and re-exports functionality from the service modules
- Provides a unified interface for the cost calculator
- Maintains backward compatibility with existing code

## Key Improvements

1. **MFU/PFR Terminology Consistency**: Updated terminology to consistently use MFU (Medicare Fee Units) and PFR (Provider Fee Rates) throughout the codebase.

2. **Better Error Handling**: Each service now has its own error handling, making it easier to diagnose and fix issues.

3. **Improved Logging**: More detailed and consistent logging across all services.

4. **Type Safety**: Added interfaces for parameters and results to improve type safety.

5. **Code Reuse**: Common functionality is now shared between services, reducing duplication.

## Testing

The refactored code maintains compatibility with existing tests. Each service can now be tested independently, making it easier to write focused unit tests.

## Usage

The main `costCalculator.ts` file maintains the same interface as before, so existing code that uses the cost calculator should continue to work without changes. New code can either use the main interface or import specific functionality directly from the service modules.

```typescript
// Using the main interface
import costCalculator from '@/utils/calculations/costCalculator';

// Or importing specific functionality
import { calculateItemCosts } from '@/utils/calculations/costCalculator';

// Or importing directly from a service
import { calculateItemCosts } from '@/utils/calculations/services/itemCostService';
```

## Future Improvements

1. **Additional Unit Tests**: Write more focused unit tests for each service.
2. **Performance Optimization**: Optimize critical paths for better performance.
3. **Caching**: Add caching for frequently used data like CPT codes and geographic factors.
4. **Documentation**: Add more detailed documentation for each service.
