// Restart the application with the refactored components
import { exec } from 'child_process';

console.log('Restarting the application with refactored components...');

// Run the application
exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Application started: ${stdout}`);
});
