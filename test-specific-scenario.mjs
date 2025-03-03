#!/usr/bin/env node

/**
 * This script demonstrates how to test a specific calculation scenario
 * using the interactive calculation debugger.
 * 
 * It opens the debugger with pre-configured parameters for a common scenario
 * that has been problematic in the past.
 */

import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = 3001; // Using a different port to avoid conflicts
const HOST = 'localhost';

// Scenario parameters
const scenarioParams = {
  name: "One-time CPT code with geographic adjustment",
  description: "Tests a one-time medical service with CPT code and ZIP code adjustment",
  params: {
    baseRate: 500,
    frequency: "one-time",
    currentAge: 45,
    lifeExpectancy: 85,
    category: "Medical",
    cptCode: "99213",
    zipCode: "90210"
  }
};

// Create a temporary HTML file with pre-filled parameters
async function createTempHtml() {
  try {
    // Read the original HTML file
    const htmlPath = join(__dirname, 'interactive-calculation-debugger.html');
    let htmlContent = await readFile(htmlPath, 'utf8');
    
    // Add script to pre-fill the form
    const script = `
    <script>
      // Pre-fill form with scenario parameters when the page loads
      document.addEventListener('DOMContentLoaded', () => {
        // Wait for the form to be initialized
        setTimeout(() => {
          // Set values
          document.getElementById('baseRate').value = ${scenarioParams.params.baseRate};
          document.getElementById('frequency').value = "${scenarioParams.params.frequency}";
          document.getElementById('currentAge').value = ${scenarioParams.params.currentAge};
          document.getElementById('lifeExpectancy').value = ${scenarioParams.params.lifeExpectancy};
          document.getElementById('category').value = "${scenarioParams.params.category}";
          document.getElementById('cptCode').value = "${scenarioParams.params.cptCode}";
          document.getElementById('zipCode').value = "${scenarioParams.params.zipCode}";
          
          // Add scenario info at the top
          const container = document.querySelector('.container');
          const scenarioInfo = document.createElement('div');
          scenarioInfo.className = 'card';
          scenarioInfo.innerHTML = \`
            <h2>Test Scenario: ${scenarioParams.name}</h2>
            <p>${scenarioParams.description}</p>
            <p>This scenario has been pre-configured with the following parameters:</p>
            <ul>
              <li><strong>Base Rate:</strong> $${scenarioParams.params.baseRate}</li>
              <li><strong>Frequency:</strong> ${scenarioParams.params.frequency}</li>
              <li><strong>Current Age:</strong> ${scenarioParams.params.currentAge}</li>
              <li><strong>Life Expectancy:</strong> ${scenarioParams.params.lifeExpectancy}</li>
              <li><strong>Category:</strong> ${scenarioParams.params.category}</li>
              <li><strong>CPT Code:</strong> ${scenarioParams.params.cptCode}</li>
              <li><strong>ZIP Code:</strong> ${scenarioParams.params.zipCode}</li>
            </ul>
            <p>Click "Run Calculation" to see the calculation steps and results.</p>
          \`;
          container.insertBefore(scenarioInfo, container.firstChild);
          
          // Enable step-by-step execution
          document.getElementById('stepByStep').checked = true;
          document.getElementById('stepByStep').dispatchEvent(new Event('change'));
          
          // Run the calculation automatically
          document.getElementById('runCalculation').click();
        }, 500);
      });
    </script>
    `;
    
    // Insert the script before the closing body tag
    htmlContent = htmlContent.replace('</body>', `${script}\n</body>`);
    
    // Write the modified HTML to a temporary file
    const tempHtmlPath = join(__dirname, 'temp-scenario.html');
    await writeFile(tempHtmlPath, htmlContent);
    
    return tempHtmlPath;
  } catch (error) {
    console.error('Error creating temporary HTML file:', error);
    throw error;
  }
}

// Create HTTP server
const server = createServer(async (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  try {
    // Determine content type based on file extension
    const contentTypeMap = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.mjs': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    // Special case for the root path - serve the temp HTML
    if (req.url === '/') {
      const tempHtmlPath = await createTempHtml();
      const content = await readFile(tempHtmlPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
    
    // For other paths, serve the requested file
    let filePath = req.url;
    
    // Remove query parameters if present
    filePath = filePath.split('?')[0];
    
    // Get file extension
    const extname = String(filePath.match(/\.[^.]*$/) || '').toLowerCase();
    
    // Set content type
    const contentType = contentTypeMap[extname] || 'text/plain';
    
    // Read file
    const content = await readFile(join(__dirname, filePath));
    
    // Send response
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    console.error(`Error serving ${req.url}:`, error);
    
    // If file not found, try to serve from src directory
    if (error.code === 'ENOENT' && req.url.startsWith('/src/')) {
      try {
        const content = await readFile(join(__dirname, req.url));
        const extname = String(req.url.match(/\.[^.]*$/) || '').toLowerCase();
        const contentType = contentTypeMap[extname] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      } catch (srcError) {
        console.error(`Error serving from src directory:`, srcError);
      }
    }
    
    // Send 404 response
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
});

// Start server
server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`Server running at ${url}`);
  console.log(`Testing scenario: ${scenarioParams.name}`);
  
  // Open browser
  const openCommand = process.platform === 'win32' ? 'start' :
                      process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  exec(`${openCommand} ${url}`, (error) => {
    if (error) {
      console.error('Error opening browser:', error);
      console.log(`Please open your browser and navigate to ${url}`);
    } else {
      console.log(`Browser opened to ${url}`);
    }
  });
  
  console.log('Press Ctrl+C to stop the server');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Server stopped');
  server.close();
  process.exit(0);
});
