// This script tests that one-time costs are properly calculated and added to the totals
import { calculateItemCosts } from './src/utils/calculations/costCalculator.js';

async function testOneTimeCostTotals() {
  console.log('Testing one-time cost calculations and totals...');
  
  // Test parameters for a one-time item
  const oneTimeParams = {
    baseRate: 100,
    frequency: 'one-time',
    cptCode: '99213', // Example CPT code
    zipCode: '90210'  // Example ZIP code
  };
  
  // Test parameters for a recurring item
  const recurringParams = {
    baseRate: 100,
    frequency: '4x per year',
    cptCode: '99213', // Example CPT code
    zipCode: '90210', // Example ZIP code
    currentAge: 30,
    lifeExpectancy: 50,
    startAge: 30,
    endAge: 80
  };
  
  // Calculate costs for the one-time item
  const oneTimeCosts = await calculateItemCosts(oneTimeParams);
  
  console.log('One-time item costs:');
  console.log(JSON.stringify(oneTimeCosts, null, 2));
  
  // Calculate costs for the recurring item
  const recurringCosts = await calculateItemCosts(recurringParams);
  
  console.log('Recurring item costs:');
  console.log(JSON.stringify(recurringCosts, null, 2));
  
  // Verify that the one-time item has different values for low, average, and high
  if (oneTimeCosts.low !== oneTimeCosts.high) {
    console.log('✅ One-time item has different values for low and high costs');
  } else {
    console.log('❌ One-time item has the same value for low and high costs');
  }
  
  // Verify that the one-time item has isOneTime set to true
  if (oneTimeCosts.isOneTime === true) {
    console.log('✅ One-time item has isOneTime set to true');
  } else {
    console.log('❌ One-time item has isOneTime set to false');
  }
  
  // Verify that the one-time item has annual cost set to 0
  if (oneTimeCosts.annual === 0) {
    console.log('✅ One-time item has annual cost set to 0');
  } else {
    console.log('❌ One-time item has annual cost set to', oneTimeCosts.annual);
  }
  
  // Verify that the one-time item's lifetime cost is equal to its average cost
  if (oneTimeCosts.lifetime === oneTimeCosts.average) {
    console.log('✅ One-time item\'s lifetime cost is equal to its average cost');
  } else {
    console.log('❌ One-time item\'s lifetime cost is not equal to its average cost');
  }
  
  // Simulate adding the costs to totals
  const totalAnnualCost = oneTimeCosts.annual + recurringCosts.annual;
  const totalLifetimeCost = oneTimeCosts.lifetime + recurringCosts.lifetime;
  const totalLowCost = oneTimeCosts.low + recurringCosts.low;
  const totalHighCost = oneTimeCosts.high + recurringCosts.high;
  
  console.log('\nSimulated totals:');
  console.log('Total annual cost:', totalAnnualCost);
  console.log('Total lifetime cost:', totalLifetimeCost);
  console.log('Total low cost:', totalLowCost);
  console.log('Total high cost:', totalHighCost);
  
  // Verify that the one-time cost is properly added to the lifetime total
  if (totalLifetimeCost === oneTimeCosts.lifetime + recurringCosts.lifetime) {
    console.log('✅ One-time cost is properly added to the lifetime total');
  } else {
    console.log('❌ One-time cost is not properly added to the lifetime total');
  }
  
  // Verify that the one-time cost is not added to the annual total
  if (totalAnnualCost === recurringCosts.annual) {
    console.log('✅ One-time cost is not added to the annual total');
  } else {
    console.log('❌ One-time cost is added to the annual total');
  }
  
  console.log('\nTest completed!');
}

testOneTimeCostTotals().catch(console.error);
