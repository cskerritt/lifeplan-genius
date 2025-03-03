// This script restarts the application with the one-time cost calculation fixes
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function restartApp() {
  console.log('Restarting application with one-time cost calculation fixes...');
  
  try {
    // Stop any running processes
    console.log('Stopping any running processes...');
    await execAsync('pkill -f "node.*vite"').catch(() => {
      // Ignore errors if no processes are running
    });
    
    // Start the application
    console.log('Starting the application...');
    const { stdout, stderr } = await execAsync('npm run dev', { 
      detached: true,
      stdio: 'ignore'
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Application restarted successfully!');
    console.log('You can now test the one-time cost calculation fixes.');
    console.log('The application should be available at http://localhost:5173');
  } catch (error) {
    console.error('Error restarting application:', error);
  }
}

restartApp().catch(console.error);
