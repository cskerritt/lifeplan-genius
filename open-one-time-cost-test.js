// This script opens the one-time cost test HTML file in the browser
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function openTestFile() {
  console.log('Opening one-time cost test HTML file in browser...');
  
  try {
    await execAsync('open test-one-time-cost-totals.html');
    console.log('Test file opened successfully!');
  } catch (error) {
    console.error('Error opening test file:', error);
  }
}

openTestFile().catch(console.error);
