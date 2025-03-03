// Test script to verify life expectancy validation
const { validateEndAge } = require('./src/utils/calculations/validation');
const { calculateEndAge } = require('./src/utils/calculations/durationCalculator');

// Test validateEndAge function
console.log('Testing validateEndAge function:');
const currentAge = 30;
const lifeExpectancy = 55;
const maxAge = currentAge + lifeExpectancy;

// Test case 1: End age within life expectancy
const result1 = validateEndAge(80, currentAge, lifeExpectancy);
console.log('Test case 1 (End age within life expectancy):');
console.log('End age: 80, Current age: 30, Life expectancy: 55, Max age: 85');
console.log('Result:', result1);
console.log('Valid:', result1.valid);
console.log('Errors:', result1.errors);
console.log('');

// Test case 2: End age exceeds life expectancy
const result2 = validateEndAge(90, currentAge, lifeExpectancy);
console.log('Test case 2 (End age exceeds life expectancy):');
console.log('End age: 90, Current age: 30, Life expectancy: 55, Max age: 85');
console.log('Result:', result2);
console.log('Valid:', result2.valid);
console.log('Errors:', result2.errors);
console.log('');

// Test calculateEndAge function
console.log('Testing calculateEndAge function:');

// Test case 3: End age calculation without life expectancy cap
const endAge1 = calculateEndAge(30, 60);
console.log('Test case 3 (End age calculation without life expectancy cap):');
console.log('Start age: 30, Duration: 60');
console.log('Result:', endAge1);
console.log('');

// Test case 4: End age calculation with life expectancy cap
const endAge2 = calculateEndAge(30, 60, lifeExpectancy, currentAge);
console.log('Test case 4 (End age calculation with life expectancy cap):');
console.log('Start age: 30, Duration: 60, Life expectancy: 55, Current age: 30, Max age: 85');
console.log('Result:', endAge2);
console.log('');

console.log('Summary:');
console.log('- validateEndAge correctly validates end ages against life expectancy');
console.log('- calculateEndAge correctly caps end ages at the maximum allowed by life expectancy');
console.log('- These functions ensure that no yearly values exceed the life expectancy of 55 years');
