// Verification script for annual and lifetime cost calculations
import Decimal from 'decimal.js';

// Values from the screenshot
const baseRate = 405.4; // Assuming this is the base rate before GAF adjustment
const geoFactors = {
  mfr_factor: 0.982,
  pfr_factor: 1.0
};
const duration = 80.3; // Years
const frequency = 1; // 1x per year

// Calculate the average geographic factor
const avgGeoFactor = new Decimal(geoFactors.mfr_factor).plus(geoFactors.pfr_factor).dividedBy(2);
console.log('Average Geographic Factor:', avgGeoFactor.toNumber());

// Calculate the adjusted base rate
const adjustedBaseRate = new Decimal(baseRate).times(avgGeoFactor).toDP(2);
console.log('Base Rate:', baseRate);
console.log('Adjusted Base Rate:', adjustedBaseRate.toNumber());

// Calculate annual cost
const annualCost = adjustedBaseRate.times(frequency).toDP(2);
console.log('Annual Cost:', annualCost.toNumber());

// Calculate lifetime cost
const lifetimeCost = annualCost.times(duration).toDP(2);
console.log('Lifetime Cost:', lifetimeCost.toNumber());

// Expected lifetime cost from screenshot
const expectedLifetimeCost = 11650.75;
console.log('Expected Lifetime Cost from screenshot:', expectedLifetimeCost);
console.log('Difference:', new Decimal(lifetimeCost).minus(expectedLifetimeCost).toNumber());

// Alternative calculation: Check if the lifetime cost is calculated with rounded annual cost
const roundedAnnualCost = new Decimal(401.75);
const altLifetimeCost = roundedAnnualCost.times(duration).toDP(2);
console.log('\nAlternative calculation with rounded annual cost:');
console.log('Rounded Annual Cost:', roundedAnnualCost.toNumber());
console.log('Alternative Lifetime Cost:', altLifetimeCost.toNumber());

// Check if the lifetime cost matches when using integer duration
const integerDuration = 30; // Default duration if not using age range
const integerLifetimeCost = annualCost.times(integerDuration).toDP(2);
console.log('\nCalculation with default integer duration (30 years):');
console.log('Lifetime Cost with 30 years:', integerLifetimeCost.toNumber()); 