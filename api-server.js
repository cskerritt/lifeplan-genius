/**
 * API Server for Database Access
 * 
 * This server provides API endpoints for accessing the PostgreSQL database
 * from the browser environment.
 */

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const { Pool } = pg;

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();
// Load .env.local if it exists
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

// Create Express app
const app = express();
const port = process.env.API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Create a connection pool for PostgreSQL
const connectionString = process.env.VITE_DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/supabase_local_db';

console.log(`Connecting to database with connection string: ${connectionString.replace(
  /(postgresql:\/\/\w+:)([^@]+)(@.+)/,
  '$1*****$3'
)}`);

const pool = new Pool({ connectionString });

// Test database connection
pool.query('SELECT NOW()')
  .then(result => {
    console.log('Database connection successful:', result.rows[0]);
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// API endpoint to fetch data from a table
app.get('/api/data/:table', async (req, res) => {
  try {
    const tableName = req.params.table;
    
    // Validate table name to prevent SQL injection
    const validTables = ['gaf_lookup', 'life_care_plans', 'care_plan_entries'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    
    // Execute query
    const result = await pool.query(`SELECT * FROM ${tableName} LIMIT 1000`);
    
    // Return data as JSON
    res.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to execute a custom query
app.post('/api/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    
    console.log('Received query request:', { 
      query, 
      params: params ? params.map(p => typeof p === 'object' ? '[Object]' : p) : [] 
    });
    
    // Execute query
    const result = await pool.query(query, params);
    
    console.log('Query executed successfully, returned', result.rowCount, 'rows');
    
    // Return data as JSON
    res.json({ 
      rows: result.rows,
      rowCount: result.rowCount
    });
  } catch (error) {
    console.error('Query error:', error);
    console.error('Query error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const startServer = (attemptPort) => {
  const server = app.listen(attemptPort)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${attemptPort} is in use, trying another one...`);
        startServer(attemptPort + 1);
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`API server listening at http://localhost:${attemptPort}`);
    });
};

startServer(port);
