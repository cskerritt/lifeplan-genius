// This script applies the migration to update cost columns from integer to numeric
const { exec } = require('child_process');

console.log('Applying migration to update cost columns from integer to numeric...');

// Run the migration using Supabase CLI
exec('npx supabase migration up', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error applying migration: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`Migration applied successfully: ${stdout}`);
  
  console.log('Restarting the application...');
  
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
});
