# Evaluee Duplication Feature Documentation

## Overview

This update adds the ability to duplicate evaluees (patients) in the LifePlan Genius application. This feature allows users to:

1. Create copies of existing evaluees with all their care plan items
2. Modify demographic information during duplication
3. Build templates that can be customized for individual patients

## Feature Details

### Duplication Process

When duplicating an evaluee, the system:

1. Creates a new evaluee record with a unique ID
2. Copies all demographic information from the original evaluee
3. Allows modification of any demographic fields during duplication
4. Duplicates all care plan items associated with the original evaluee
5. Associates the duplicated care plan items with the new evaluee

### User Interface

The duplication feature is accessible via a "Duplicate" button in the evaluee form. When clicked, a dialog appears with:

- Pre-filled fields containing the original evaluee's information
- The ability to modify any field before creating the duplicate
- A clear indication that this is a copy (default name includes "(Copy)")
- A prominent "Duplicate Evaluee" button to confirm the action

### Implementation Details

The feature is implemented through:

1. A `DuplicateEvalueeDialog` component that provides the UI for duplication
2. A `duplicateEvaluee` function in the `useEvalueesDb` hook that handles:
   - Creating a copy of the evaluee record
   - Duplicating all associated care plan items
   - Applying any modifications specified by the user

## Use Cases

### Template Creation

Users can create template evaluees with standard care plans for specific conditions or scenarios, then duplicate and customize them for individual patients. This saves time when creating similar care plans for multiple patients.

### Scenario Comparison

By duplicating an evaluee and modifying specific aspects (e.g., different treatment approaches, geographic locations, or age-related factors), users can compare different scenarios for the same patient.

### Version Control

Users can create snapshots of care plans at different points in time by duplicating an evaluee before making significant changes.

## Technical Implementation

The duplication process involves:

1. Database operations to copy the evaluee record with a new UUID
2. Recursive duplication of all care plan entries associated with the evaluee
3. Preservation of all relationships and references between items
4. Proper handling of timestamps and system fields

## How to Use

To duplicate an evaluee:

1. Navigate to the evaluee's detail page
2. Click the "Duplicate" button in the top right corner
3. Modify any fields as needed in the dialog that appears
4. Click "Duplicate Evaluee" to create the copy
5. The system will navigate to the plans list where you can see the new evaluee

## Geographic Adjustment Factors

When duplicating an evaluee, the geographic adjustment factors are preserved if the ZIP code remains the same. If the ZIP code is changed during duplication, the system will automatically look up the appropriate geographic adjustment factors for the new location when the duplicated evaluee is saved.

This ensures that cost calculations for the duplicated care plan items will use the correct geographic adjustment factors based on the location specified for the new evaluee.
