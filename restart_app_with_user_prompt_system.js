/**
 * Restart the application with the user prompt system
 * 
 * This script restarts the application with the new user prompt system
 * that prompts users for missing data instead of using default values.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Restarting application with user prompt system...');

// Kill any running processes on port 3000
const killPort = () => {
  return new Promise((resolve, reject) => {
    exec('lsof -ti:3000 | xargs kill -9', (error) => {
      // Ignore errors, as there might not be any processes running on port 3000
      resolve();
    });
  });
};

// Start the development server
const startDevServer = () => {
  return new Promise((resolve, reject) => {
    console.log('Starting development server...');
    
    const devServer = exec('npm run dev', (error) => {
      if (error) {
        console.error('Error starting development server:', error);
        reject(error);
        return;
      }
    });
    
    // Wait for the server to start
    devServer.stdout.on('data', (data) => {
      console.log(data);
      
      // Check if the server has started
      if (data.includes('Local:') || data.includes('ready in')) {
        console.log('Development server started successfully');
        resolve(devServer);
      }
    });
    
    devServer.stderr.on('data', (data) => {
      console.error(data);
    });
  });
};

// Open the browser to test the user prompt system
const openBrowser = () => {
  console.log('Opening browser to test the user prompt system...');
  
  // Run the test script
  exec('node test-user-prompt-system.js', (error) => {
    if (error) {
      console.error('Error opening browser:', error);
      return;
    }
    
    console.log('Browser opened successfully');
    console.log('\nUser Prompt System Test Instructions:');
    console.log('1. Click the "Calculate Costs" button');
    console.log('2. A dialog should appear asking for geographic adjustment factors');
    console.log('3. Enter a value (e.g., 1.2) and click Submit');
    console.log('4. The calculation should complete and display the result');
    console.log('\nPress Ctrl+C to stop the development server when done testing');
  });
};

// Main function to restart the app and open the browser
const main = async () => {
  try {
    // Kill any running processes on port 3000
    await killPort();
    
    // Start the development server
    await startDevServer();
    
    // Wait a moment for the server to fully initialize
    setTimeout(() => {
      // Open the browser to test the user prompt system
      openBrowser();
    }, 3000);
  } catch (error) {
    console.error('Error restarting application:', error);
  }
};

// Run the main function
main();
