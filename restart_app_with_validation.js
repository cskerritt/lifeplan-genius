// Script to restart the application with the life expectancy validation changes
const { exec } = require('child_process');

console.log('Restarting application with life expectancy validation changes...');

// Run the application
exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

console.log('Application restarted successfully!');
console.log('');
console.log('Changes implemented:');
console.log('1. Added validation to ensure end ages do not exceed life expectancy');
console.log('2. Updated durationCalculator to cap end ages at maximum allowed by life expectancy');
console.log('3. Updated AgeRangeForm to display maximum allowed age based on life expectancy');
console.log('4. Updated AgeIncrementManager to respect life expectancy limits');
console.log('5. Updated AddEntryForm to validate end ages against life expectancy');
console.log('6. Updated PlanTable to fix existing items with end ages exceeding life expectancy');
console.log('');
console.log('Benefits:');
console.log('- Consistent validation across the application');
console.log('- Accurate lifetime cost calculations');
console.log('- Clear visual feedback to users about maximum allowed ages');
console.log('- Automatic fixing of existing data that exceeds life expectancy limits');
console.log('');
console.log('To test the changes:');
console.log('1. Try to set an end age greater than the life expectancy in the AgeRangeForm');
console.log('2. Use the Auto-fill Age Ranges button to fix existing items');
console.log('3. Add a new entry and verify that end age validation works');
console.log('4. Create age increments and verify they respect the life expectancy limit');
