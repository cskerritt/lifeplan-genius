#!/usr/bin/env node

/**
 * This script starts a local HTTP server and opens the interactive calculation debugger in the browser.
 * It allows for testing and debugging calculations in a visual, step-by-step manner.
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = 3000;
const HOST = 'localhost';

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
    
    // Default to the debugger HTML file if no path is specified
    let filePath = req.url === '/' ? '/interactive-calculation-debugger.html' : req.url;
    
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
