# Manual Cost Override Feature Documentation

## Overview

This update adds two important features to the LifePlan Genius application:

1. **Manual Cost Override**: Allows users to manually set costs for care items, bypassing the automatic calculation system when needed.
2. **Notes/Rationale Field**: Provides a way to document the reasoning behind cost decisions, especially useful for manual overrides.

## Database Changes

The following columns have been added to the `care_plan_entries` table:

- `is_manual_cost` (BOOLEAN): Indicates whether the cost was manually set by the user
- `notes` (TEXT): General notes about the care item
- `rationale` (TEXT): Specific reasoning for cost decisions, especially useful for manual overrides

## Feature Usage

### Manual Cost Override

When adding or editing a care item, you can now toggle the "Manual Cost Override" switch in the Cost Details section. When enabled:

1. The CPT code lookup and standard cost range fields are hidden
2. A single cost input field appears
3. The value entered will be used for low, average, and high cost calculations
4. The system will not apply geographic adjustment factors to manually entered costs

This feature is particularly useful when:
- You have specific cost information from a provider
- Standard CPT codes don't accurately reflect the actual cost
- You need to account for special circumstances or discounts

### Notes/Rationale Field

Below the cost section, you'll find a new text area for entering notes or rationale. This field can be used to:

- Document the source of manual cost information
- Explain why a standard cost was overridden
- Provide context for unusual frequency or duration settings
- Include any other relevant information about the care item

## Implementation Details

### Geographic Adjustment Factors

When examining the code for geographic adjustment factors, we found that they are applied in the following components:

1. `src/utils/calculations/costCalculator.ts`: The main calculation engine
2. `src/utils/calculations/strategies/baseCostCalculationStrategy.ts`: The base strategy class
3. `src/utils/calculations/services/adjustedCostService.ts`: The service that applies GAF adjustments

The geographic adjustment factors are applied as follows:
- Medicare Fee Rates (MFR) are multiplied by the MFR factor
- Private Fee Rates (PFR) are multiplied by the PFR factor
- The final cost is an average of the adjusted MFR and PFR values

When manual cost override is enabled, these adjustment factors are not applied, as the user is directly specifying the final cost.

## How to Deploy

To deploy these changes:

1. Run the database migration script:
   ```
   node restart_app_with_manual_cost_feature.mjs
   ```

2. This script will:
   - Apply the necessary database schema changes
   - Verify the columns were added correctly
   - Restart the application with the new features

## Testing

To verify the feature is working correctly:

1. Create a new care item
2. Toggle the "Manual Cost Override" switch
3. Enter a cost value
4. Add some notes explaining the override
5. Save the item
6. Verify the cost appears correctly in the plan table and calculation summaries
