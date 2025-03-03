# Item Duplication Feature

## Overview
This feature allows users to duplicate existing care plan items and optionally modify them during duplication. This is useful for creating multiple similar items with slight variations, such as different frequencies or age ranges.

## Implementation Details
The implementation includes:

1. Added `duplicatePlanItem` function to `usePlanItemsDb.ts` to handle database operations
2. Added `duplicateItem` function to `usePlanItems.ts` to handle business logic and recalculations
3. Updated `PlanTable.tsx` to add the duplicate button and dialog UI
4. Updated `PlanDetail.tsx` to pass the duplication function to the table component

## How to Use
1. Navigate to a care plan's detail page
2. Find the item you want to duplicate in the table
3. Click the duplicate icon (copy icon) in the actions column
4. In the dialog that appears, you can:
   - Modify the service name (defaults to original name + "(Copy)")
   - Change the frequency
   - Adjust age ranges
5. Click "Duplicate Item" to create the copy

## Technical Notes
- The duplication process creates a completely new database record
- Cost calculations are automatically updated based on any modifications
- The UUID for the new item is generated using `crypto.randomUUID()`
- All numeric values are properly formatted to ensure decimal precision

## Benefits
- Saves time when creating multiple similar items
- Reduces data entry errors by starting with a known-good configuration
- Allows for quick creation of variations for different scenarios
- Maintains all cost calculations and relationships

## Example Use Cases
1. **Multiple frequency scenarios**: Duplicate an item to show costs at different frequencies (e.g., weekly vs. monthly)
2. **Age range variations**: Create copies with different age ranges to compare lifetime costs
3. **Service variations**: Duplicate an item and modify the service name slightly for related services
4. **What-if analysis**: Create duplicates with different parameters to analyze cost impacts

## Implementation Challenges Addressed
1. **Database integrity**: Ensuring proper UUID generation and relationship maintenance
2. **Cost recalculation**: Properly recalculating costs when parameters change
3. **UI experience**: Creating an intuitive interface for the duplication process
4. **Data validation**: Validating modified values before saving

## Future Enhancements
Potential future enhancements to the duplication feature could include:
1. Batch duplication of multiple items at once
2. Templates for common modifications
3. Ability to duplicate entire categories
4. History tracking of duplicated items
