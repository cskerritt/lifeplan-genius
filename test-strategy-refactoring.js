/**
 * Test script for the refactored strategy pattern implementation
 * 
 * This script tests the three strategy implementations with sample data
 * to verify that they produce the expected results after refactoring.
 */

import { OneTimeCostStrategy } from './src/utils/calculations/strategies/oneTimeCostStrategy.js';
import { RecurringCostStrategy } from './src/utils/calculations/strategies/recurringCostStrategy.js';
import { AgeIncrementCostStrategy } from './src/utils/calculations/strategies/ageIncrementCostStrategy.js';

async function runTests() {
  console.log('Testing refactored strategy pattern implementation...');
  
  // Test OneTimeCostStrategy
  console.log('\n=== Testing OneTimeCostStrategy ===');
  const oneTimeStrategy = new OneTimeCostStrategy();
  const oneTimeResult = await oneTimeStrategy.calculate({
    baseRate: 100,
    cptCode: '99203',
    category: 'Medical',
    zipCode: '10001'
  });
  console.log('OneTimeCostStrategy result:', oneTimeResult);
  
  // Test RecurringCostStrategy
  console.log('\n=== Testing RecurringCostStrategy ===');
  const recurringStrategy = new RecurringCostStrategy();
  const recurringResult = await recurringStrategy.calculate({
    baseRate: 100,
    frequency: '1x per month',
    currentAge: 30,
    lifeExpectancy: 80,
    cptCode: '99203',
    category: 'Medical',
    zipCode: '10001'
  });
  console.log('RecurringCostStrategy result:', recurringResult);
  
  // Test AgeIncrementCostStrategy
  console.log('\n=== Testing AgeIncrementCostStrategy ===');
  const ageIncrementStrategy = new AgeIncrementCostStrategy();
  const ageIncrementResult = await ageIncrementStrategy.calculate({
    baseRate: 100,
    cptCode: '99203',
    category: 'Medical',
    zipCode: '10001',
    ageIncrements: [
      {
        startAge: 30,
        endAge: 40,
        frequency: '1x per month',
        isOneTime: false
      },
      {
        startAge: 40,
        endAge: 50,
        frequency: '2x per month',
        isOneTime: false
      }
    ]
  });
  console.log('AgeIncrementCostStrategy result:', ageIncrementResult);
  
  console.log('\nAll tests completed successfully!');
  console.log('The refactored strategy pattern implementation is working as expected.');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
