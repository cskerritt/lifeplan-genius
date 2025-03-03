/**
 * Restart the application with the user prompt system
 * 
 * This script restarts the application with the new user prompt system
 * that prompts users for missing data instead of using default values.
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const openBrowser = async () => {
  console.log('Opening browser to test the user prompt system...');
  
  // Create a simple HTML file that imports the necessary components
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Prompt System Test</title>
  <script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import useEnhancedCostCalculations from '/src/hooks/useEnhancedCostCalculations';

    // Simple test component
    const TestComponent = () => {
      const { 
        calculateAdjustedCosts, 
        promptDialog, 
        isPrompting 
      } = useEnhancedCostCalculations();

      const handleCalculate = async () => {
        try {
          // Use a ZIP code that doesn't exist to trigger the prompt
          const result = await calculateAdjustedCosts(
            100, // baseRate
            '99203', // cptCode
            'medical', // category
            undefined, // costResources
            undefined, // vehicleModifications
            '00000' // Invalid ZIP code to trigger the prompt
          );
          
          console.log('Calculation result:', result);
          document.getElementById('result').textContent = JSON.stringify(result, null, 2);
        } catch (error) {
          console.error('Error calculating costs:', error);
          document.getElementById('result').textContent = 'Error: ' + error.message;
        }
      };

      return React.createElement(
        'div',
        null,
        React.createElement(
          'h1',
          null,
          'User Prompt System Test'
        ),
        React.createElement(
          'p',
          null,
          'This page tests the user prompt system by attempting to calculate costs with an invalid ZIP code.'
        ),
        React.createElement(
          'button',
          { 
            onClick: handleCalculate,
            disabled: isPrompting,
            style: { padding: '10px 20px', fontSize: '16px', margin: '20px 0' }
          },
          isPrompting ? 'Waiting for input...' : 'Calculate Costs'
        ),
        React.createElement(
          'div',
          { id: 'result', style: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }
        ),
        promptDialog
      );
    };

    // Render the test component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(TestComponent));
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
  `;
  
  // Write the HTML to a file
  await fs.writeFile('test-user-prompt-system.html', html);
  
  // Open the file in the browser
  exec('open test-user-prompt-system.html', (error) => {
    if (error) {
      console.error('Error opening browser:', error);
      return;
    }
    console.log('Browser opened successfully. Follow these steps:');
    console.log('1. Click the "Calculate Costs" button');
    console.log('2. A dialog should appear asking for geographic adjustment factors');
    console.log('3. Enter a value (e.g., 1.2) and click Submit');
    console.log('4. The calculation should complete and display the result');
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
