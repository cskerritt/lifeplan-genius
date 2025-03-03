// Open the application in a browser
import { exec } from 'child_process';

console.log('Opening the application in a browser...');

// Open the application in the default browser
// Using the correct port from vite.config.ts
exec('open http://localhost:8080', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Browser opened: ${stdout}`);
});
