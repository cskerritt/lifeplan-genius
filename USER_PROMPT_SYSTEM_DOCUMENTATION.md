# User Prompt System for Missing Data

## Overview

This document describes the implementation of a new system for handling missing data in the LifePlan Genius application. Instead of using default fallback values when data is missing, the system now prompts the user to provide the missing data, ensuring more accurate calculations.

## Motivation

Previously, the application would use default values when data was missing, such as:
- Default geographic adjustment factors when a ZIP code wasn't found
- Base rates when CPT code data wasn't available
- Estimated values for missing percentiles

This approach could lead to inaccurate calculations and potentially misleading results. The new system ensures that all calculations are based on accurate data by prompting the user to provide the missing information.

## Implementation

The implementation consists of several components:

1. **MissingDataError Class**: A custom error class that includes information about the missing data and options for prompting the user.
2. **UserPromptUtils**: Utility functions for creating and handling missing data errors.
3. **DataPromptDialog Component**: A UI component that displays a dialog to prompt the user for missing data.
4. **UseDataPrompt Hook**: A React hook that handles the display of the dialog and the execution of operations that might throw missing data errors.
5. **Enhanced Services**: Updated service functions that throw MissingDataError instead of using default values.
6. **UseEnhancedCostCalculations Hook**: An enhanced version of the useCostCalculations hook that uses the useDataPrompt hook to handle missing data errors.

### Files Created/Modified

- `src/utils/calculations/utilities/userPromptUtils.ts`: Utility functions for handling user prompts
- `src/components/ui/DataPromptDialog.tsx`: Dialog component for prompting the user
- `src/hooks/useDataPrompt.tsx`: Hook for handling missing data errors
- `src/hooks/useEnhancedCostCalculations.ts`: Enhanced version of useCostCalculations
- `src/utils/calculations/services/geoFactorsService.ts`: Updated to throw MissingDataError
- `src/utils/calculations/services/adjustedCostService.ts`: Updated to handle MissingDataError
- `src/utils/calculations/services/index.ts`: Index file for services

## How It Works

1. When a calculation service encounters missing data, it throws a `MissingDataError` with information about the missing data and options for prompting the user.
2. The `useDataPrompt` hook catches this error and displays the `DataPromptDialog` component to prompt the user for the missing data.
3. When the user provides the missing data, the operation is retried with the new data.
4. If the operation succeeds, the result is returned. If it fails again with another missing data error, the process repeats.

## Example Usage

Here's an example of how to use the new system:

```tsx
import React from 'react';
import useEnhancedCostCalculations from '@/hooks/useEnhancedCostCalculations';

const CostCalculator: React.FC = () => {
  const { 
    calculateAdjustedCosts, 
    promptDialog, 
    isPrompting 
  } = useEnhancedCostCalculations();

  const handleCalculate = async () => {
    try {
      const result = await calculateAdjustedCosts(
        100, // baseRate
        '99203', // cptCode
        'medical', // category
        undefined, // costResources
        undefined, // vehicleModifications
        '12345' // zipCode
      );
      
      console.log('Calculation result:', result);
    } catch (error) {
      console.error('Error calculating costs:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={isPrompting}>
        Calculate Costs
      </button>
      
      {/* Render the prompt dialog if needed */}
      {promptDialog}
    </div>
  );
};
```

## Benefits

1. **Improved Accuracy**: Calculations are based on accurate data provided by the user, not default values.
2. **Better User Experience**: Users are informed when data is missing and can provide the correct values.
3. **Transparency**: The system clearly communicates when data is missing and why it's needed.
4. **Flexibility**: The system can handle various types of missing data and prompt the user appropriately.

## Future Improvements

1. **Data Persistence**: Store user-provided values for future use.
2. **Batch Prompting**: Collect all missing data at once instead of prompting for each item separately.
3. **Alternative Data Sources**: Provide options to fetch data from alternative sources when primary sources fail.
4. **Offline Support**: Handle missing data gracefully when the application is offline.
5. **User Preferences**: Allow users to configure how they want to be prompted for missing data.
