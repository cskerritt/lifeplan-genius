# Life Expectancy Validation

This document explains the changes made to ensure that no yearly values exceed the life expectancy of 55 years, and that output and totals are consistent and accurate.

## Changes Implemented

### 1. Added Validation Function

Added a new validation function in `src/utils/calculations/validation.ts`:

```typescript
export const validateEndAge = (
  endAge: number,
  currentAge: number,
  lifeExpectancy: number
): ValidationResult => {
  const logger = calculationLogger.createContext('validateEndAge');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Calculate maximum allowed age
  const maxAge = currentAge + lifeExpectancy;
  
  // Check if end age exceeds maximum age
  if (endAge > maxAge) {
    result.valid = false;
    result.errors.push(`End age (${endAge}) exceeds maximum allowed age (${maxAge}) based on life expectancy`);
    logger.error(`End age (${endAge}) exceeds maximum allowed age (${maxAge}) based on life expectancy`);
  }
  
  return result;
};
```

This function is used to validate that the end age does not exceed the maximum allowed age based on life expectancy.

### 2. Updated Duration Calculator

Modified the `calculateEndAge` function in `src/utils/calculations/durationCalculator.ts` to cap the end age at the maximum allowed by life expectancy:

```typescript
export const calculateEndAge = (
  startAge: number,
  duration: number,
  lifeExpectancy?: number,
  currentAge?: number
): number => {
  // ... existing code ...
  
  let endAge = startAge + duration;
  
  // Cap end age at maximum allowed by life expectancy if provided
  if (lifeExpectancy !== undefined && currentAge !== undefined) {
    const maxAge = currentAge + lifeExpectancy;
    if (endAge > maxAge) {
      logger.warn(`End age (${endAge}) exceeds maximum allowed age (${maxAge}), capping at maximum`);
      endAge = maxAge;
    }
  }
  
  logger.info(`Calculated end age: ${endAge}`);
  return endAge;
};
```

### 3. Updated AgeRangeForm Component

Enhanced the `AgeRangeForm` component to display the maximum allowed age based on life expectancy and provide visual feedback when the end age exceeds the maximum:

```tsx
export function AgeRangeForm({
  startAge,
  endAge,
  onStartAgeChange,
  onEndAgeChange,
  maxAge,
  currentAge
}: AgeRangeFormProps) {
  // Calculate the maximum allowed end age
  const maxEndAge = maxAge !== undefined ? maxAge : 100;
  
  return (
    <div className="space-y-4">
      {/* ... existing code ... */}
      <div>
        <label className="block text-sm font-medium text-gray-700">End Age</label>
        <input
          type="number"
          value={endAge}
          onChange={(e) => onEndAgeChange(e.target.value)}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            parseFloat(endAge) > maxEndAge ? "border-red-500" : ""
          }`}
          required
          min="0"
          max={maxEndAge}
          step="0.1"
          placeholder={maxEndAge.toString()}
        />
        {maxAge !== undefined && (
          <p className={`text-xs mt-1 ${parseFloat(endAge) > maxEndAge ? "text-red-500" : "text-gray-500"}`}>
            Maximum allowed age: {maxEndAge} (based on life expectancy)
            {parseFloat(endAge) > maxEndAge && " - Current value exceeds maximum!"}
          </p>
        )}
      </div>
    </div>
  );
}
```

### 4. Updated AgeIncrementManager Component

Modified the `AgeIncrementManager` component to ensure that age increments respect the life expectancy limit:

```tsx
const updateIncrement = (index: number, field: keyof AgeIncrement, value: any) => {
  const updatedIncrements = [...ageIncrements];
  
  // If updating end age, ensure it doesn't exceed maxAge
  if (field === 'endAge' && typeof value === 'number' && maxAge !== undefined && value > maxAge) {
    value = maxAge;
  }
  
  updatedIncrements[index] = {
    ...updatedIncrements[index],
    [field]: value
  };
  
  onAgeIncrementsChange(updatedIncrements);
};

const addIncrement = () => {
  // ... existing code ...
  
  // Default new increment to start at the last end age and extend 5 years
  // But ensure it doesn't exceed maxAge
  let endAge = lastEndAge + 5;
  if (endAge > maxAge) {
    endAge = maxAge;
  }
  
  // Only add a new increment if there's room for it
  if (lastEndAge < maxAge) {
    const newIncrement: AgeIncrement = {
      startAge: lastEndAge,
      endAge: endAge,
      frequency: baseFrequency,
      isOneTime: false
    };
    
    onAgeIncrementsChange([...ageIncrements, newIncrement]);
  }
};
```

### 5. Updated Form Validation

Added validation in the form submission handlers to ensure that end ages do not exceed the life expectancy:

```tsx
// In saveAgeRanges function
// Validate against life expectancy
if (endAgeNum !== undefined && lifeExpectancyValue > 0) {
  const maxAllowedAge = (currentAge || 0) + lifeExpectancyValue;
  if (endAgeNum > maxAllowedAge) {
    setAgeRangeError(`End age cannot exceed maximum allowed age (${maxAllowedAge}) based on life expectancy`);
    return;
  }
}

// In saveCategoryAgeRanges function
// Validate against life expectancy
if (endAgeNum !== undefined && lifeExpectancyValue > 0) {
  const maxAllowedAge = (currentAge || 0) + lifeExpectancyValue;
  if (endAgeNum > maxAllowedAge) {
    setCategoryAgeRangeError(`End age cannot exceed maximum allowed age (${maxAllowedAge}) based on life expectancy`);
    return;
  }
}

// In handleSubmit function of AddEntryForm
// Validate end age against life expectancy
if (!frequencyDetails.isOneTime && endAge) {
  const endAgeNum = parseFloat(endAge);
  const currentAgeNum = calculateAgeFromDOB(dateOfBirth);
  const maxAllowedAge = currentAgeNum + lifeExpectancy;
  
  if (endAgeNum > maxAllowedAge) {
    setError(`End age (${endAgeNum}) cannot exceed maximum allowed age (${maxAllowedAge}) based on life expectancy`);
    return;
  }
}
```

### 6. Added Auto-Fix for Existing Data

Enhanced the `autoFillAllAgeRanges` function to fix existing items with end ages that exceed the life expectancy:

```tsx
const autoFillAllAgeRanges = () => {
  if (!onUpdateItem) return;
  
  const startAgeValue = currentAge || 0;
  const endAgeValue = maxAge || 30.5;
  const updatedItemIds: string[] = [];
  
  items.forEach(item => {
    if (!isOneTimeItem(item)) {
      const updates: Partial<CareItem> = {};
      let shouldUpdate = false;
      
      if (item.startAge === undefined) {
        updates.startAge = startAgeValue;
        shouldUpdate = true;
      }
      
      if (item.endAge === undefined) {
        updates.endAge = endAgeValue;
        shouldUpdate = true;
      }
      
      // If item has an end age that exceeds the life expectancy, update it
      if (item.endAge !== undefined && lifeExpectancyValue > 0) {
        const maxAllowedAge = (currentAge || 0) + lifeExpectancyValue;
        if (item.endAge > maxAllowedAge) {
          updates.endAge = maxAllowedAge;
          shouldUpdate = true;
        }
      }
      
      if (shouldUpdate) {
        onUpdateItem(item.id, updates);
        updatedItemIds.push(item.id);
      }
    }
  });
  
  // ... existing code ...
};
```

## Benefits

1. **Consistent Validation**: The application now consistently validates end ages against life expectancy across all components.

2. **Accurate Calculations**: Lifetime cost calculations are now accurate because they respect the life expectancy limit.

3. **Visual Feedback**: Users receive clear visual feedback when they try to set an end age that exceeds the life expectancy.

4. **Auto-Fix**: The application can automatically fix existing data that exceeds the life expectancy limit.

## Testing

To test these changes:

1. Try to set an end age greater than the life expectancy in the AgeRangeForm.
2. Use the Auto-fill Age Ranges button to fix existing items.
3. Add a new entry and verify that end age validation works.
4. Create age increments and verify they respect the life expectancy limit.

You can also run the test script `test-life-expectancy-validation.js` to verify the validation functions.
