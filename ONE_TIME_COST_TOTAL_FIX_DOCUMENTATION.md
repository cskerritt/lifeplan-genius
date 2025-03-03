# One-Time Cost Total Fix Documentation

## Issue Description

The Life Care Plan application was not correctly including one-time costs in the lifetime total calculation. Specifically, the one-time cost of $265.50 for the PhysicianEvaluation service was not being added to the lifetime total of $21,750.00 (which only included the recurring costs).

## Root Cause

In the `PlanTable.tsx` component, the lifetime total was being calculated as:

```jsx
{formatCurrency(grandTotal * 29)}
```

This calculation only multiplied the annual total by the duration (29 years), but did not add the one-time costs. One-time costs should be added directly to the lifetime total, not multiplied by the duration.

## Fix Implementation

The fix modifies the lifetime total calculation in `PlanTable.tsx` to include one-time costs:

```jsx
{formatCurrency((grandTotal * 29) + 
  // Add one-time costs (like the $265.50 PhysicianEvaluation)
  items.filter(item => isOneTimeItem(item))
    .reduce((sum, item) => sum + (item.costRange.average || 0), 0)
)}
```

This change:
1. Keeps the original calculation for recurring costs (`grandTotal * 29`)
2. Adds the sum of all one-time costs by:
   - Filtering items to only include one-time items
   - Summing up their average costs

## Testing

To test this fix:
1. Run the application with `node restart_app_with_one_time_cost_total_fix.js`
2. Create a life care plan with both one-time and recurring items
3. Verify that the lifetime total correctly includes both:
   - The recurring costs multiplied by the duration
   - The one-time costs added directly (without multiplication)

## Expected Result

For the specific case mentioned in the issue:
- PhysicianEvaluation (one-time): $265.50
- PhysicianFollowUp (recurring): $21,750.00 (annual cost * 29 years)
- Lifetime Total: $22,015.50 ($21,750.00 + $265.50)

## Additional Notes

- The fix ensures that one-time costs are properly reflected in the lifetime total without being multiplied by the duration.
- The tooltip that explains the calculation has also been updated to clarify that one-time costs are added to the lifetime total.
