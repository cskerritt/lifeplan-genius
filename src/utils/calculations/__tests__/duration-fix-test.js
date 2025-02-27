// Test file to verify the duration parsing fix
import { parseDuration } from '../frequencyParser';

// Test the fix for parsing duration from frequency strings like "4-4x per year 30 years"
console.log('Testing duration parsing fix...');

// Test case 1: Original problematic string
const frequency1 = '4-4x per year 30 years';
const result1 = parseDuration(frequency1);
console.log(`Test 1: "${frequency1}" => Duration: ${result1.lowDuration} years, Source: ${result1.source}`);

// Test case 2: Another variation
const frequency2 = '2-2x per year 20 years';
const result2 = parseDuration(frequency2);
console.log(`Test 2: "${frequency2}" => Duration: ${result2.lowDuration} years, Source: ${result2.source}`);

// Test case 3: Original format that already worked
const frequency3 = 'for 15 years';
const result3 = parseDuration(frequency3);
console.log(`Test 3: "${frequency3}" => Duration: ${result3.lowDuration} years, Source: ${result3.source}`);

// Test case 4: Another format that already worked
const frequency4 = '3-5 years';
const result4 = parseDuration(frequency4);
console.log(`Test 4: "${frequency4}" => Duration: ${result4.lowDuration}-${result4.highDuration} years, Source: ${result4.source}`);

console.log('All tests completed.');
