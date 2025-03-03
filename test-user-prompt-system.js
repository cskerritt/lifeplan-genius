/**
 * Test script for the User Prompt System
 * 
 * This script demonstrates how the user prompt system works by simulating
 * a scenario where geographic factors are missing for a ZIP code.
 * 
 * To run this script:
 * 1. Start the development server: npm run dev
 * 2. Open the browser: node test-user-prompt-system.js
 */

const { exec } = require('child_process');

// Open the browser to a test page that will trigger the user prompt
const openBrowser = () => {
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
  const fs = require('fs');
  fs.writeFileSync('test-user-prompt-system.html', html);
  
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

// Run the test
openBrowser();
