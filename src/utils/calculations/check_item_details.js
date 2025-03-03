import Decimal from 'decimal.js';

// Mock the item data based on the console logs
const item = {
  id: 'mock-item',
  service: 'Mock Service',
  frequency: '1-1x per year',
  startAge: 0,
  endAge: 80.3,
  annualCost: 401.75,
  costRange: {
    low: 390,
    average: 401.75,
    high: 413.50
  }
};

console.log('Checking item details and duration calculation');
console.log('Item:', JSON.stringify(item, null, 2));

// Check if the frequency string contains a duration
const frequencyLower = item.frequency.toLowerCase();
const fullYearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)$/i);
console.log('Frequency year match:', fullYearMatch);

const yearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)/i);
console.log('Any year match:', yearMatch);

// Check duration from age range
const ageRangeDuration = item.endAge - item.startAge;
console.log('Age range duration:', ageRangeDuration);

// Check if the frequency string contains "for X years"
const forYearsMatch = frequencyLower.match(/for\s+(\d+)\s*(?:years?|yrs?)/i);
console.log('For years match:', forYearsMatch);

// Check if the frequency is "1-1x per year 29 years"
console.log('Is frequency "1-1x per year 29 years"?', item.frequency === '1-1x per year 29 years');

// Check if there's a default duration being used
console.log('Default duration (30 years) being used?', !fullYearMatch && !yearMatch && !forYearsMatch);

// Calculate lifetime cost with different durations
console.log('\nLifetime cost calculations:');
const durations = [29, 30, 80.3];
durations.forEach(duration => {
  const lifetimeCost = new Decimal(item.annualCost).times(duration).toNumber();
  console.log(`With duration ${duration} years: $${lifetimeCost.toFixed(2)}`);
  
  // Check if this matches the expected lifetime cost
  const expectedLifetimeCost = 11650.75;
  console.log(`Matches expected lifetime cost? ${Math.abs(lifetimeCost - expectedLifetimeCost) < 1}`);
}); 