/**
 * Simple test script to verify cost calculations
 */

import costCalculator from './src/utils/calculations/costCalculator.ts';

// Define a simple test case
const testCase = {
  baseRate: 100,
  frequency: 'monthly',
  category: 'Medical',
  currentAge: 45,
  lifeExpectancy: 85
};

console.log('Running simple test...');
console.log('Test case:', testCase);

// Run the calculation
costCalculator.calculateItemCosts(testCase)
  .then(result => {
    console.log('Result:', result);
    console.log('Test completed successfully.');
  })
  .catch(error => {
    console.error('Error:', error);
  });
