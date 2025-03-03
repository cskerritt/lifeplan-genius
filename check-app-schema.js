import fs from 'fs';
import path from 'path';

// Path to the Supabase types file
const typesFilePath = path.join(process.cwd(), 'src', 'integrations', 'supabase', 'types.ts');

function checkSchemaTypes() {
  console.log('Checking Supabase schema types in the application...');
  
  try {
    // Read the types.ts file
    const typesContent = fs.readFileSync(typesFilePath, 'utf8');
    
    // Check for cost-related fields in care_plan_entries
    console.log('Searching for cost fields in care_plan_entries...');
    
    // Extract the care_plan_entries Row type definition
    const rowTypeMatch = typesContent.match(/care_plan_entries:\s*{\s*Row:\s*{([^}]*)}/s);
    
    if (!rowTypeMatch) {
      console.log('❌ Could not find care_plan_entries Row type definition');
      return;
    }
    
    const rowTypeDefinition = rowTypeMatch[1];
    
    // Check the types of cost fields
    const costFields = [
      'annual_cost',
      'lifetime_cost',
      'avg_cost',
      'min_cost',
      'max_cost',
      'mfr_adjusted',
      'pfr_adjusted'
    ];
    
    console.log('\nCost field types:');
    let allFieldsNumeric = true;
    
    for (const field of costFields) {
      // Look for field definition like "annual_cost: number" or "annual_cost: number | null"
      const fieldRegex = new RegExp(`${field}:\\s*(number|string|boolean|null|\\|\\s*)+`, 'i');
      const fieldMatch = rowTypeDefinition.match(fieldRegex);
      
      if (fieldMatch) {
        const fieldType = fieldMatch[0];
        console.log(`${field}: ${fieldType}`);
        
        // Check if the type is "number" (which could be integer or numeric in the DB)
        if (!fieldType.includes('number')) {
          allFieldsNumeric = false;
          console.log(`❌ Field ${field} is not defined as a number type`);
        }
      } else {
        console.log(`❓ Could not find type definition for ${field}`);
      }
    }
    
    if (allFieldsNumeric) {
      console.log('\n✅ All cost fields are defined as number types in the application');
      console.log('This is consistent with both INTEGER and NUMERIC database types');
      console.log('The application should handle decimal values correctly if the database columns are NUMERIC');
    } else {
      console.log('\n❌ Some cost fields are not defined as number types in the application');
      console.log('This may cause issues when handling decimal values');
    }
    
    // Check if there are any comments about the migration
    const migrationCommentMatch = typesContent.match(/numeric to support decimal values/i);
    if (migrationCommentMatch) {
      console.log('\n✅ Found comments about the migration to numeric types');
      console.log('This suggests the types.ts file has been updated after the migration');
    } else {
      console.log('\n⚠️ No comments found about the migration to numeric types');
      console.log('The types.ts file may not have been updated after the migration');
    }
    
  } catch (error) {
    console.error('Error reading types file:', error);
  }
}

// Execute the check
checkSchemaTypes(); 