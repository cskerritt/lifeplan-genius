/**
 * Test Foreign Key Bypass
 * 
 * This script tests the foreign key bypass by attempting to insert a record
 * with an invalid foreign key and verifying that it succeeds in development mode.
 * This version uses ES module syntax.
 */

import { executeQueryViaApi } from './src/utils/syncDatabaseData.js';
import { generateUUID } from './src/utils/authService.js';

// Function to generate a random UUID
function generateRandomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Test inserting a record with an invalid foreign key
async function testInsertWithInvalidForeignKey() {
  console.log('Testing insert with invalid foreign key...');
  
  try {
    // Generate a random UUID that doesn't exist in the database
    const randomUUID = generateRandomUUID();
    
    // Create test data with the random UUID as the user_id
    const testData = {
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '1990-01-01',
      date_of_injury: '2020-01-01',
      gender: 'male',
      zip_code: '12345',
      city: 'Test City',
      state: 'Test State',
      life_expectancy: 45.3,
      projected_age_at_death: 77.3,
      user_id: 'mock-user-id' // This should be replaced by the foreign key bypass
    };
    
    // Construct the SQL query
    const query = `
      INSERT INTO life_care_plans (
        first_name, last_name, date_of_birth, date_of_injury, gender, 
        zip_code, city, state, life_expectancy, projected_age_at_death, user_id
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;
    
    // Execute the query
    const result = await executeQueryViaApi(query, [
      testData.first_name,
      testData.last_name,
      testData.date_of_birth,
      testData.date_of_injury,
      testData.gender,
      testData.zip_code,
      testData.city,
      testData.state,
      testData.life_expectancy,
      testData.projected_age_at_death,
      testData.user_id
    ]);
    
    // Check if the query succeeded
    if (result && result.rows && result.rows.length > 0) {
      console.log('✅ SUCCESS: Insert with invalid foreign key succeeded');
      console.log('Inserted record:', result.rows[0]);
      return true;
    } else {
      console.error('❌ ERROR: Insert with invalid foreign key failed');
      console.error('Result:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR: Insert with invalid foreign key failed with an exception');
    console.error('Error:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('=== Foreign Key Bypass Test ===\n');
  
  const insertSuccess = await testInsertWithInvalidForeignKey();
  
  console.log('\n=== Test Results ===');
  console.log(`Insert with invalid foreign key: ${insertSuccess ? 'PASSED' : 'FAILED'}`);
  
  if (insertSuccess) {
    console.log('\n✅ All tests passed! The foreign key bypass is working correctly.');
    console.log('You can now create care plans without foreign key constraint errors.');
  } else {
    console.log('\n❌ Some tests failed. Please check the error messages above.');
    console.log('Make sure the application is running in development mode.');
  }
}

// Execute the tests
runTests().catch(error => {
  console.error('Unexpected error during tests:', error);
});
