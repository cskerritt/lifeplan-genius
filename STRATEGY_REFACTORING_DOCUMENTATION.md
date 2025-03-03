# Strategy Pattern Refactoring

## Overview

This document outlines the refactoring of the cost calculation strategies to reduce code duplication and improve maintainability. The refactoring introduces a base strategy class that encapsulates common functionality used by all concrete strategy implementations.

## Changes Made

1. Created a new `BaseCostCalculationStrategy` abstract class that:
   - Provides common methods for geographic factor application
   - Handles cost range adjustments
   - Manages MFR/PFR data processing

2. Refactored the three concrete strategy implementations to extend the base class:
   - `OneTimeCostStrategy`
   - `RecurringCostStrategy`
   - `AgeIncrementCostStrategy`

3. Removed duplicated code from each strategy implementation, resulting in:
   - Reduced code size (approximately 50% reduction in each strategy)
   - Improved maintainability
   - Centralized logic for common operations

## Benefits

### 1. Reduced Code Duplication

Before the refactoring, each strategy contained nearly identical code for:
- Fetching and applying geographic factors
- Processing MFR and PFR data
- Creating artificial ranges when needed

This duplication has been eliminated by moving these common operations to the base class.

### 2. Improved Maintainability

With common functionality centralized in the base class:
- Bug fixes only need to be applied in one place
- New features can be added to all strategies by updating the base class
- Strategy implementations are more focused on their specific calculation logic

### 3. Better Separation of Concerns

Each strategy now focuses solely on its specific calculation logic:
- `OneTimeCostStrategy`: Handles one-time cost calculations
- `RecurringCostStrategy`: Handles recurring cost calculations with frequency and duration
- `AgeIncrementCostStrategy`: Handles age-based incremental cost calculations

### 4. Enhanced Extensibility

Adding new strategies is now simpler:
1. Create a new class that extends `BaseCostCalculationStrategy`
2. Implement the `calculate` method with strategy-specific logic
3. Leverage base class methods for common operations

## Architecture

The refactored architecture follows the Strategy Pattern with inheritance:

```
CostCalculationStrategy (interface)
↑
BaseCostCalculationStrategy (abstract class)
↑
├── OneTimeCostStrategy
├── RecurringCostStrategy
└── AgeIncrementCostStrategy
```

## Base Strategy Methods

The `BaseCostCalculationStrategy` provides the following protected methods:

### `getAdjustedCostsWithGeoFactors`

```typescript
protected async getAdjustedCostsWithGeoFactors(params: CostCalculationParams)
```

Fetches and applies geographic factors to costs based on the provided parameters.

### `createArtificialRange`

```typescript
protected createArtificialRange(value: number): CostRange
```

Creates an artificial range around a value when low and high values are the same.

### `applyMfrPfrFactors`

```typescript
protected applyMfrPfrFactors(mfrCosts: CostRange, pfrCosts: CostRange, geoFactors: GeoFactors): CostRange
```

Applies MFR and PFR factors to costs to calculate a combined cost range.

## Usage Example

To create a new strategy:

```typescript
import { BaseCostCalculationStrategy } from './baseCostCalculationStrategy';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts } from '../types';

export class NewCostStrategy extends BaseCostCalculationStrategy implements CostCalculationStrategy {
  async calculate(params: CostCalculationParams): Promise<CalculatedCosts> {
    // Get adjusted costs with geographic factors applied
    const { adjustedCostRange } = await this.getAdjustedCostsWithGeoFactors(params);
    
    // Strategy-specific calculation logic
    // ...
    
    // Return calculated costs
    return {
      annual: /* annual cost */,
      lifetime: /* lifetime cost */,
      low: /* low cost */,
      high: /* high cost */,
      average: /* average cost */,
      isOneTime: /* boolean */
    };
  }
}
```

## Testing and Running

To test and run the refactored code, use the following scripts:

### Test Script

The `test-strategy-refactoring.mjs` script verifies that the refactored code is properly implemented:

```bash
node test-strategy-refactoring.mjs
```

This script:
- Verifies that all refactored files exist
- Checks that the strategy classes correctly extend the base class
- Provides instructions for manual testing

### Restart Script

The `restart_app_with_strategy_refactoring.mjs` script restarts the application with the refactored code:

```bash
node restart_app_with_strategy_refactoring.mjs
```

This script:
- Verifies that all refactored files exist
- Kills any running instances of the app
- Starts the development server
- Provides information about the refactoring

## Future Improvements

Potential future improvements to the strategy pattern implementation:

1. Add more specialized methods to the base class for common calculations
2. Implement caching for expensive operations
3. Add more comprehensive error handling and recovery mechanisms
4. Create a strategy registry for dynamic strategy selection
