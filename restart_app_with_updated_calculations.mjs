import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Restarting application with updated calculation logic...');

// Kill any running instances of the app
exec('pkill -f "vite"', (error, stdout, stderr) => {
  // Start the app in development mode
  const child = exec('npm run dev', {
    cwd: __dirname
  });

  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    
    // If the app has started successfully, open it in the browser
    if (data.includes('Local:') || data.includes('ready in')) {
      console.log('Application started successfully!');
      
      // Open the app in the default browser
      exec('open http://localhost:5173', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error opening browser: ${error}`);
          return;
        }
        console.log('Opened application in browser');
      });
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
});
