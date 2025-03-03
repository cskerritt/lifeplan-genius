// Script to run migrations with password prompt
const readline = require('readline');
const { applyMigrations } = require('./apply-migrations-with-pg.js');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for password
console.log('This script will apply the following migrations to your Supabase database:');
console.log('1. 20250227152832_add_age_increments_columns.sql - Add use_age_increments and age_increments columns');
console.log('2. 20250227173300_update_cost_columns_to_numeric.sql - Update cost columns from INTEGER to NUMERIC');
console.log('\nPlease enter your Supabase PostgreSQL database password:');

// Hide password input (note: this is a simple implementation, not fully secure)
rl.stdoutMuted = true;
rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted && stringToWrite.trim() !== '') {
    rl.output.write('*');
  } else {
    rl.output.write(stringToWrite);
  }
};

let password = '';
rl.question('Password: ', (input) => {
  password = input;
  console.log('\n');
  rl.close();
  
  // Run migrations with the provided password
  applyMigrations(password);
});
