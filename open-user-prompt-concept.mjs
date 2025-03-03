/**
 * Open the User Prompt System Concept demo in a browser
 * 
 * This script opens the User Prompt System Concept demo in a browser
 * to demonstrate how the system works without relying on the application code.
 */

import { exec } from 'child_process';

console.log('Opening User Prompt System Concept demo...');

// Open the HTML file in the browser
exec('open test-user-prompt-concept.html', (error) => {
  if (error) {
    console.error('Error opening browser:', error);
    return;
  }
  
  console.log('Browser opened successfully. Follow these steps:');
  console.log('1. Click the "Calculate Costs" button');
  console.log('2. A dialog will appear asking for geographic adjustment factors');
  console.log('3. Enter a value (e.g., 1.2) and click Submit');
  console.log('4. The calculation will complete and display the result');
  console.log('\nThis demo shows how the User Prompt System works:');
  console.log('- When data is missing, a dialog prompts the user for input');
  console.log('- The input is validated to ensure it meets requirements');
  console.log('- The calculation continues with the user-provided data');
  console.log('- The result is displayed with the user-provided data incorporated');
});
