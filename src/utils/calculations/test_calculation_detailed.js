// Detailed test script to verify the calculation of annual costs with the average geographic factor
import Decimal from 'decimal.js';

// Mock the geographic factors
const geoFactors = {
  mfr_factor: 0.982,
  pfr_factor: 1.0
};

// Calculate the average geographic factor
const avgGeoFactor = new Decimal(geoFactors.mfr_factor).plus(geoFactors.pfr_factor).dividedBy(2);
console.log('Average Geographic Factor:', avgGeoFactor.toNumber());

// Test with different base costs
const testCases = [
  { baseCost: 405.4, description: "Current base cost" },
  { baseCost: 401.75, description: "Current annual cost" },
  { baseCost: 398.13, description: "User's expected annual cost" }
];

// Run tests for each base cost
testCases.forEach(testCase => {
  console.log(`\nTest case: ${testCase.description}`);
  console.log('Base Cost:', testCase.baseCost);
  
  // Apply the average geographic factor to the base cost
  const adjustedCost = new Decimal(testCase.baseCost).times(avgGeoFactor).toDP(2).toNumber();
  console.log('Adjusted Cost with Average Factor:', adjustedCost);
  
  // Calculate what the base cost would be if the adjusted cost is the expected value
  const reverseCalculatedBase = new Decimal(testCase.baseCost).dividedBy(avgGeoFactor).toDP(2).toNumber();
  console.log('Reverse-calculated Base Cost (if this was the adjusted cost):', reverseCalculatedBase);
});

// Calculate what base cost would result in the user's expected annual cost
const userExpectedAnnualCost = 398.13;
const baseForUserExpected = new Decimal(userExpectedAnnualCost).dividedBy(avgGeoFactor).toDP(2).toNumber();
console.log('\nTo get the user\'s expected annual cost of $398.13:');
console.log('Required Base Cost:', baseForUserExpected);
console.log('Verification:', new Decimal(baseForUserExpected).times(avgGeoFactor).toDP(2).toNumber()); 