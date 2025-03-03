/**
 * Restart script to test the CPT code lookup fix
 * 
 * This script restarts the application with the updated CPT code service
 * that uses direct database connection instead of Supabase.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Kill any running processes on port 5173 (Vite dev server)
console.log('Killing any processes on port 5173...');
const killProcess = spawn('npx', ['kill-port', '5173']);

killProcess.stdout.on('data', (data) => {
  console.log(`Kill process output: ${data}`);
});

killProcess.stderr.on('data', (data) => {
  console.error(`Kill process error: ${data}`);
});

killProcess.on('close', (code) => {
  console.log(`Kill process exited with code ${code}`);
  
  // Start the API server
  console.log('Starting API server...');
  const apiServer = spawn('node', ['api-server.js'], {
    detached: true,
    stdio: 'ignore'
  });
  
  // Don't wait for the API server to exit
  apiServer.unref();
  
  // Wait a moment for the API server to start
  setTimeout(() => {
    // Start the Vite dev server
    console.log('Starting Vite dev server...');
    const viteServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit'
    });
    
    viteServer.on('close', (code) => {
      console.log(`Vite server exited with code ${code}`);
    });
  }, 2000);
});
