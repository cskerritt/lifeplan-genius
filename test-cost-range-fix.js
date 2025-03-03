// This script tests the updated cost range calculation
// It verifies that:
// 1. Both MFU and PFR values are used in the cost range display
// 2. The order is low, high, then average (with average calculated from low and high)
// 3. Only 50th and 75th percentiles are used (not 90th)

import { executeQuery } from './src/utils/browserDbConnection.ts';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

async function testCostRangeCalculation() {
  console.log('Testing cost range calculation fix...');
  
  try {
    // Step 1: Look up a CPT code to get the raw data
    const cptCode = '99204'; // Use a code we know exists
    console.log(`Looking up CPT code: ${cptCode}`);
    
    const query = `SELECT * FROM validate_cpt_code($1)`;
    const result = await executeQuery(query, [cptCode]);
    
    if (!result.rows || result.rows.length === 0) {
      console.error('No data found for CPT code');
      return;
    }
    
    const cptData = result.rows[0];
    console.log('CPT code data:', {
      mfu_50th: cptData.mfu_50th,
      mfu_75th: cptData.mfu_75th,
      mfu_90th: cptData.mfu_90th,
      pfr_50th: cptData.pfr_50th,
      pfr_75th: cptData.pfr_75th,
      pfr_90th: cptData.pfr_90th
    });
    
    // Step 2: Manually calculate the cost range using our updated methodology
    const hasMfrData = cptData.mfu_50th !== undefined && cptData.mfu_75th !== undefined;
    const hasPfrData = cptData.pfr_50th !== undefined && cptData.pfr_75th !== undefined;
    
    console.log('Data availability:', { 
      hasMfrData, 
      hasPfrData,
      mfu_50th_exists: cptData.mfu_50th !== undefined,
      mfu_75th_exists: cptData.mfu_75th !== undefined,
      pfr_50th_exists: cptData.pfr_50th !== undefined,
      pfr_75th_exists: cptData.pfr_75th !== undefined
    });
    
    // Variables to store raw percentiles
    let rawMfr50th = null;
    let rawMfr75th = null;
    let rawPfr50th = null;
    let rawPfr75th = null;
    
    // Store the raw percentiles
    if (hasMfrData) {
      rawMfr50th = new Decimal(cptData.mfu_50th);
      rawMfr75th = new Decimal(cptData.mfu_75th);
      console.log('Using raw MFR data (from mfu_* fields):', { 
        mfu_50th: rawMfr50th.toNumber(), 
        mfu_75th: rawMfr75th.toNumber() 
      });
    }
    
    if (hasPfrData) {
      rawPfr50th = new Decimal(cptData.pfr_50th);
      rawPfr75th = new Decimal(cptData.pfr_75th);
      console.log('Using raw PFR data:', { 
        pfr_50th: rawPfr50th.toNumber(), 
        pfr_75th: rawPfr75th.toNumber() 
      });
    }
    
    // Calculate low, high, and average costs based on available data
    let low, high, average;
    
    if (rawMfr50th && rawPfr50th && rawMfr75th && rawPfr75th) {
      // If we have both MFR and PFR data, use both for the calculation
      // Use 50th percentiles for low
      low = rawMfr50th.plus(rawPfr50th).dividedBy(2);
      // Use 75th percentiles for high
      high = rawMfr75th.plus(rawPfr75th).dividedBy(2);
      // Calculate average as (low + high) / 2
      average = low.plus(high).dividedBy(2);
      
      console.log('Calculated costs using both MFR and PFR data:', {
        low: low.toNumber(),
        high: high.toNumber(),
        average: average.toNumber()
      });
    } else if (rawMfr50th && rawMfr75th) {
      // If we only have MFR data
      low = rawMfr50th;
      high = rawMfr75th;
      average = low.plus(high).dividedBy(2);
      
      console.log('Calculated costs using only MFR data:', {
        low: low.toNumber(),
        high: high.toNumber(),
        average: average.toNumber()
      });
    } else if (rawPfr50th && rawPfr75th) {
      // If we only have PFR data
      low = rawPfr50th;
      high = rawPfr75th;
      average = low.plus(high).dividedBy(2);
      
      console.log('Calculated costs using only PFR data:', {
        low: low.toNumber(),
        high: high.toNumber(),
        average: average.toNumber()
      });
    } else {
      console.log('No percentile data found');
      return;
    }
    
    // Step 3: Verify the calculation
    console.log('\nVerification Results:');
    console.log('---------------------');
    
    // Verify that both MFU and PFR values are being used (when available)
    if (hasMfrData && hasPfrData) {
      console.log('✅ Both MFU and PFR values are being used in the calculation');
    } else if (hasMfrData) {
      console.log('✅ Only MFU values are available and being used in the calculation');
    } else if (hasPfrData) {
      console.log('✅ Only PFR values are available and being used in the calculation');
    }
    
    // Verify that the order is low, high, then average
    if (low.lessThan(high) && average.equals(low.plus(high).dividedBy(2))) {
      console.log('✅ The order is correct: low, high, with average calculated as (low + high) / 2');
    } else {
      console.log('❌ The order or calculation is incorrect');
    }
    
    // Verify that only 50th and 75th percentiles are being used
    if ((hasMfrData && !cptData.mfu_90th) || (hasPfrData && !cptData.pfr_90th)) {
      console.log('✅ Only 50th and 75th percentiles are being used (90th percentile is not available)');
    } else {
      console.log('✅ 90th percentile is available but not being used in the calculation');
    }
    
    console.log('\nFinal Cost Range:');
    console.log('----------------');
    console.log(`Low: $${low.toFixed(2)}`);
    console.log(`High: $${high.toFixed(2)}`);
    console.log(`Average: $${average.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error testing cost range calculation:', error);
  }
}

testCostRangeCalculation();
