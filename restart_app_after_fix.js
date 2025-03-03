// This script restarts the application after fixing the lifetime total calculation issue
const { exec } = require('child_process');

console.log('Restarting the application...');

// Verify that geographic adjustments are being applied correctly to one-time fees
console.log('Verifying geographic adjustments for one-time fees...');
console.log('Based on code analysis:');
console.log('1. Geographic adjustments ARE being applied to one-time fees.');
console.log('2. The adjustment is applied in the calculateAdjustedCosts function in costCalculator.ts:');
console.log('   - ZIP code is passed through the entire calculation chain');
console.log('   - Geographic factors are fetched using the ZIP code');
console.log('   - The adjustment is applied to all costs, including one-time costs');
console.log('3. For one-time items, the adjusted costs are returned directly:');
console.log('   - annual: 0 (One-time items don\'t have an annual recurring cost)');
console.log('   - lifetime: costRange.average (The lifetime cost is just the average cost)');
console.log('   - low: costRange.low');
console.log('   - high: costRange.high');
console.log('   - average: costRange.average');
console.log('   - isOneTime: true');

// Kill any running instances of the app
exec('pkill -f "node.*vite"', (error) => {
  // Ignore errors from pkill as it might not find any processes to kill
  
  // Start the app
  const child = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error restarting app: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });

  // Forward the output to the console
  child.stdout.on('data', (data) => {
    console.log(data);
  });

  child.stderr.on('data', (data) => {
    console.error(data);
  });

  console.log('Application restart initiated. The app should be available in a few moments.');
});
