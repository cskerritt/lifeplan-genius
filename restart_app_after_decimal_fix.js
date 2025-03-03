// Script to restart the application after applying the decimal cost columns fix
import { exec } from 'child_process';

console.log('Restarting the application after applying the decimal cost columns fix...');

// Kill any running instances of the application
exec('pkill -f "node.*vite"', (error, stdout, stderr) => {
  if (error) {
    console.log('No running instances found or error killing processes:', error);
  } else {
    console.log('Killed running instances of the application');
  }
  
  // Start the application in development mode
  console.log('Starting the application in development mode...');
  
  const child = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error('Error starting the application:', error);
      return;
    }
  });
  
  // Forward stdout and stderr to the console
  child.stdout.on('data', (data) => {
    console.log(data);
  });
  
  child.stderr.on('data', (data) => {
    console.error(data);
  });
  
  console.log('Application restart initiated. You can access it at http://localhost:3000');
  console.log('Press Ctrl+C to stop the application');
});
