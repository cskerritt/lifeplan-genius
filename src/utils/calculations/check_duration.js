import Decimal from 'decimal.js';

console.log('Checking duration calculation for item with annual cost $401.75 and lifetime cost $11,650.75');

// Given values from the screenshot
const annualCost = 401.75;
const lifetimeCost = 11650.75;

// Calculate what duration would result in this lifetime cost
const calculatedDuration = new Decimal(lifetimeCost).dividedBy(annualCost);
console.log(`Calculated duration: ${calculatedDuration.toNumber()} years`);

// Check if the duration is close to 29 years
console.log(`Is duration close to 29 years? ${Math.abs(calculatedDuration.toNumber() - 29) < 0.1}`);

// Check if the duration is close to 30 years
console.log(`Is duration close to 30 years? ${Math.abs(calculatedDuration.toNumber() - 30) < 0.1}`);

// Calculate lifetime cost with different durations
console.log(`Lifetime cost with 29 years: $${new Decimal(annualCost).times(29).toNumber().toFixed(2)}`);
console.log(`Lifetime cost with 30 years: $${new Decimal(annualCost).times(30).toNumber().toFixed(2)}`);

// Check if the item has a specific duration in the frequency string
// This is a simulation of what might be happening
console.log('\nPossible duration calculations:');
const possibleDurations = [29, 30, 80.3];
possibleDurations.forEach(duration => {
  const calculatedLifetimeCost = new Decimal(annualCost).times(duration).toNumber().toFixed(2);
  console.log(`With duration ${duration} years: $${calculatedLifetimeCost}`);
  console.log(`Matches screenshot? ${Math.abs(parseFloat(calculatedLifetimeCost) - lifetimeCost) < 1}`);
}); 