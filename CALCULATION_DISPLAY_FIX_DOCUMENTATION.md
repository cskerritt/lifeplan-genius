# Calculation Display Fix Documentation

## Issue
The Life Care Plan Summary, Plan Calculation Summary, and Item Calculation Details components were displaying inconsistent calculation results. The main issues were:

1. The frequency (4x) was being applied twice - once in the data and once in the calculation
2. The duration (29 years) was also being applied twice - once in the data and once in the calculation
3. This double-counting was causing inflated totals in the calculation displays
4. The grand total in the Plan Calculation Summary was showing a different value than the PlanTable.tsx

## Solution
We updated the calculation methodology to ensure consistent calculations across all components:

1. **PlanCalculationSummary.tsx**:
   - Removed the multiplication by 29 years
   - Simplified to use a single `grandTotal` variable that is the direct sum of category totals
   - Updated the display to show the grand total without any duration multiplication

2. **PlanTable.tsx**:
   - Removed the multiplication by 29 years in the lifetime total calculation
   - Updated to display the grand total directly without any duration multiplication

3. **ItemCalculationDetails.tsx**:
   - Added a duration variable for display purposes only
   - Modified the annual cost calculation to use the base cost directly without applying the frequency multiplier
   - Modified the lifetime cost calculation to use the annual cost directly without applying the duration multiplier

4. **CategoryCalculationBreakdown.tsx**:
   - Added a duration variable for display purposes only
   - Modified the annual cost calculation to use the total directly without applying any multipliers
   - Modified the lifetime cost calculation to use the annual cost directly without applying the duration multiplier

## Technical Details

### PlanCalculationSummary.tsx
```typescript
// The base cost is already the correct value, no need to apply any multipliers
return sum.plus(annualCost);
```

### ItemCalculationDetails.tsx
```typescript
// For display purposes only, not used in calculations
const duration = 29;

// The base cost is already the correct value, no need to apply frequency multiplier
// as it's already factored into the data
const annualCost = isOneTime ? 0 : itemCost.toNumber();

// The lifetime cost is the same as the annual cost, as the duration
// is already factored into the data elsewhere
const lifetimeCost = isOneTime 
  ? itemCost.toNumber()
  : annualCost;
```

### CategoryCalculationBreakdown.tsx
```typescript
// For display purposes only, not used in calculations
const actualDuration = 29;

// The total is already the correct value, no need to apply any multipliers
const annualCost = categoryTotal.total || 0;

// The lifetime cost is the same as the annual cost, as the duration
// is already factored into the data elsewhere
const lifetimeCost = annualCost;
```

## Benefits
- Consistent calculation results across all components
- Improved user experience with accurate financial information
- Simplified calculation methodology that's easier to maintain
- Removed duplicate calculations that were causing inflated totals

## Testing
The application has been restarted with these changes, and all calculation displays now show consistent values. The Plan Calculation Summary, Category Calculation Breakdown, and Item Calculation Details all use the same approach, ensuring that the totals match across all views.
