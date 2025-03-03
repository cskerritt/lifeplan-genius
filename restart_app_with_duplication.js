// This script restarts the app with the new item duplication functionality
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Kill any existing processes on port 5173 (default Vite dev server port)
console.log('Stopping any running development servers...');
exec('npx kill-port 5173', (error) => {
  if (error) {
    console.log('No servers were running or could not be stopped.');
  } else {
    console.log('Successfully stopped running servers.');
  }
  
  // Start the development server
  console.log('Starting development server with item duplication functionality...');
  
  // Create a documentation file for the new feature
  const docPath = resolve(__dirname, 'ITEM_DUPLICATION_FEATURE.md');
  const docContent = `# Item Duplication Feature

## Overview
This feature allows users to duplicate existing care plan items and optionally modify them during duplication. This is useful for creating multiple similar items with slight variations, such as different frequencies or age ranges.

## Implementation Details
The implementation includes:

1. Added \`duplicatePlanItem\` function to \`usePlanItemsDb.ts\` to handle database operations
2. Added \`duplicateItem\` function to \`usePlanItems.ts\` to handle business logic and recalculations
3. Updated \`PlanTable.tsx\` to add the duplicate button and dialog UI
4. Updated \`PlanDetail.tsx\` to pass the duplication function to the table component

## How to Use
1. Navigate to a care plan's detail page
2. Find the item you want to duplicate in the table
3. Click the duplicate icon (copy icon) in the actions column
4. In the dialog that appears, you can:
   - Modify the service name (defaults to original name + "(Copy)")
   - Change the frequency
   - Adjust age ranges
5. Click "Duplicate Item" to create the copy

## Technical Notes
- The duplication process creates a completely new database record
- Cost calculations are automatically updated based on any modifications
- The UUID for the new item is generated using \`crypto.randomUUID()\`
- All numeric values are properly formatted to ensure decimal precision
`;

  fs.writeFileSync(docPath, docContent);
  console.log(`Created documentation at ${docPath}`);
  
  // Start the development server
  const devProcess = exec('npm run dev', { cwd: __dirname });
  
  devProcess.stdout.on('data', (data) => {
    console.log(data);
    
    // When the server is ready, open the browser
    if (data.includes('Local:') || data.includes('ready in')) {
      console.log('Development server is running. Opening browser...');
      exec('open http://localhost:5173');
    }
  });
  
  devProcess.stderr.on('data', (data) => {
    console.error(data);
  });
  
  devProcess.on('close', (code) => {
    console.log(`Development server process exited with code ${code}`);
  });
});
