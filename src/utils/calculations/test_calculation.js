// Test script to verify the calculation of annual costs with the average geographic factor
import Decimal from 'decimal.js';

// Mock the geographic factors
const geoFactors = {
  mfr_factor: 0.982,
  pfr_factor: 1.0
};

// Calculate the average geographic factor
const avgGeoFactor = new Decimal(geoFactors.mfr_factor).plus(geoFactors.pfr_factor).dividedBy(2);
console.log('Average Geographic Factor:', avgGeoFactor.toNumber());

// Mock the base cost
const baseCost = 405.4;

// Apply the average geographic factor to the base cost
const adjustedCost = new Decimal(baseCost).times(avgGeoFactor).toDP(2).toNumber();
console.log('Base Cost:', baseCost);
console.log('Adjusted Cost with Average Factor:', adjustedCost);

// Calculate annual cost with frequency of 1x per year
const frequency = 1;
const annualCost = new Decimal(adjustedCost).times(frequency).toDP(2).toNumber();
console.log('Annual Cost (1x per year):', annualCost);

// Expected annual cost calculation
console.log('Expected Annual Cost:', new Decimal(baseCost).times(avgGeoFactor).times(frequency).toDP(2).toNumber()); 