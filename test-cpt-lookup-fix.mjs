/**
 * Test script to diagnose CPT code lookup issues
 * 
 * This script tests the CPT code lookup functionality to identify why
 * the fallback mechanism isn't working correctly.
 */

import { executeQuery } from './src/utils/browserDbConnection.js';

// Mock the browser environment
global.isBrowser = () => true;

// Test CPT code lookup directly
async function testCptCodeLookup() {
  console.log('=== Testing CPT Code Lookup ===');
  
  try {
    // Test with a known CPT code (99214)
    const cptCode = '99214';
    console.log(`Looking up CPT code: ${cptCode}`);
    
    // Execute the query directly
    const query = `SELECT * FROM validate_cpt_code($1)`;
    console.log('Query:', query);
    console.log('Parameters:', [cptCode]);
    
    const result = await executeQuery(query, [cptCode]);
    
    console.log('Query result:', {
      hasRows: !!result.rows,
      rowCount: result.rowCount,
      rowsLength: result.rows ? result.rows.length : 0
    });
    
    if (result.rows && result.rows.length > 0) {
      console.log('CPT code data found:', result.rows[0]);
      console.log('CPT code data fields:', Object.keys(result.rows[0]));
      console.log('CPT code data values:', {
        mfr_50th: result.rows[0].mfr_50th,
        mfr_75th: result.rows[0].mfr_75th,
        mfr_90th: result.rows[0].mfr_90th,
        pfr_50th: result.rows[0].pfr_50th,
        pfr_75th: result.rows[0].pfr_75th,
        pfr_90th: result.rows[0].pfr_90th,
        mfu_50th: result.rows[0].mfu_50th,
        mfu_75th: result.rows[0].mfu_75th,
        mfu_90th: result.rows[0].mfu_90th
      });
      
      // Check if any of the percentile values are null or undefined
      const hasValidData = 
        result.rows[0].mfu_50th != null || 
        result.rows[0].mfu_75th != null || 
        result.rows[0].pfr_50th != null || 
        result.rows[0].pfr_75th != null;
      
      console.log('CPT code has valid percentile data:', hasValidData);
      
      // If we don't have valid data for this CPT code, log a warning
      if (!hasValidData) {
        console.warn('CPT code lookup returned no valid percentile data for code:', cptCode);
        
        // Test the fallback mechanism
        console.log('Testing fallback mechanism for CPT code 99214');
        
        // Create sample data based on CPT code
        const sampleData = {
          code: cptCode,
          code_description: "Office/outpatient visit, established patient",
          mfu_50th: 125.00,
          mfu_75th: 175.00,
          pfr_50th: 150.00,
          pfr_75th: 200.00
        };
        
        console.log('Sample data that should be used:', sampleData);
      }
    } else {
      console.warn('No data found for CPT code:', cptCode);
      
      // Test the fallback mechanism
      console.log('Testing fallback mechanism for CPT code 99214');
      
      // Create sample data based on CPT code
      const sampleData = {
        code: cptCode,
        code_description: "Office/outpatient visit, established patient",
        mfu_50th: 125.00,
        mfu_75th: 175.00,
        pfr_50th: 150.00,
        pfr_75th: 200.00
      };
      
      console.log('Sample data that should be used:', sampleData);
    }
  } catch (error) {
    console.error('Error testing CPT code lookup:', error);
  }
}

// Test the cptCodeService directly
async function testCptCodeService() {
  console.log('\n=== Testing CPT Code Service ===');
  
  try {
    // Import the cptCodeService
    const { lookupCPTCode } = await import('./src/utils/calculations/services/cptCodeService.js');
    
    // Test with a known CPT code (99214)
    const cptCode = '99214';
    console.log(`Looking up CPT code using service: ${cptCode}`);
    
    const result = await lookupCPTCode(cptCode);
    
    console.log('Service result:', {
      hasData: !!result,
      isArray: Array.isArray(result),
      length: result ? result.length : 0
    });
    
    if (result && Array.isArray(result) && result.length > 0) {
      console.log('CPT code data found:', result[0]);
      console.log('CPT code data fields:', Object.keys(result[0]));
      console.log('CPT code data values:', {
        mfu_50th: result[0].mfu_50th,
        mfu_75th: result[0].mfu_75th,
        mfu_90th: result[0].mfu_90th,
        pfr_50th: result[0].pfr_50th,
        pfr_75th: result[0].pfr_75th,
        pfr_90th: result[0].pfr_90th
      });
      
      // Check if any of the percentile values are null or undefined
      const hasValidData = 
        result[0].mfu_50th != null || 
        result[0].mfu_75th != null || 
        result[0].pfr_50th != null || 
        result[0].pfr_75th != null;
      
      console.log('CPT code has valid percentile data:', hasValidData);
    } else {
      console.warn('No data found for CPT code:', cptCode);
    }
  } catch (error) {
    console.error('Error testing CPT code service:', error);
  }
}

// Test the cost calculation flow
async function testCostCalculation() {
  console.log('\n=== Testing Cost Calculation Flow ===');
  
  try {
    // Import the necessary modules
    const { calculateAdjustedCosts } = await import('./src/hooks/useCostCalculations.js');
    
    // Test parameters
    const params = {
      baseRate: 100,
      cptCode: '99214',
      category: 'physicianEvaluation',
      zipCode: '02917'
    };
    
    console.log('Calculating adjusted costs with parameters:', params);
    
    const result = await calculateAdjustedCosts(
      params.baseRate,
      params.cptCode,
      params.category,
      undefined,
      undefined,
      params.zipCode
    );
    
    console.log('Adjusted costs result:', result);
    
    if (result.costRange) {
      console.log('Cost range:', result.costRange);
      
      // Check if the cost range has valid values
      const hasValidCosts = 
        result.costRange.low > 0 || 
        result.costRange.average > 0 || 
        result.costRange.high > 0;
      
      console.log('Cost range has valid values:', hasValidCosts);
    } else {
      console.warn('No cost range found in result');
    }
    
    if (result.mfrValues) {
      console.log('MFR values:', result.mfrValues);
    }
    
    if (result.pfrValues) {
      console.log('PFR values:', result.pfrValues);
    }
  } catch (error) {
    console.error('Error testing cost calculation:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    await testCptCodeLookup();
    await testCptCodeService();
    await testCostCalculation();
    
    console.log('\n=== Tests completed ===');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();
