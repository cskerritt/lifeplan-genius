import { executeQuery } from './src/utils/browserDbConnection.js';
import geoFactorsService from './src/utils/calculations/services/geoFactorsService.js';
import adjustedCostService from './src/utils/calculations/services/adjustedCostService.js';

/**
 * Test script to verify geographic adjustment factors are being applied correctly
 */
async function testGeographicAdjustmentFactors() {
  console.log('=== Testing Geographic Adjustment Factors ===\n');
  
  try {
    // Test 1: Fetch geographic factors for a specific ZIP code
    const zipCode = '90210'; // Beverly Hills
    console.log(`Test 1: Fetching geographic factors for ZIP code ${zipCode}`);
    
    const geoFactors = await geoFactorsService.fetchGeoFactors(zipCode);
    console.log('Geographic factors:', geoFactors);
    
    if (!geoFactors || !geoFactors.mfr_factor || !geoFactors.pfr_factor) {
      console.error('❌ Failed to fetch geographic factors');
      return;
    }
    
    console.log('✅ Successfully fetched geographic factors');
    console.log(`   MFR Factor: ${geoFactors.mfr_factor}`);
    console.log(`   PFR Factor: ${geoFactors.pfr_factor}`);
    
    // Test 2: Apply geographic factors to costs
    console.log('\nTest 2: Applying geographic factors to costs');
    
    const mfuCost = 100;
    const pfrCost = 150;
    
    const { adjustedMfu, adjustedPfr } = geoFactorsService.applyGeoFactors(
      mfuCost,
      pfrCost,
      geoFactors
    );
    
    console.log('Original costs:');
    console.log(`   MFU Cost: $${mfuCost}`);
    console.log(`   PFR Cost: $${pfrCost}`);
    
    console.log('Adjusted costs:');
    console.log(`   Adjusted MFU Cost: $${adjustedMfu}`);
    console.log(`   Adjusted PFR Cost: $${adjustedPfr}`);
    
    // Verify the calculations
    const expectedMfu = mfuCost * geoFactors.mfr_factor;
    const expectedPfr = pfrCost * geoFactors.pfr_factor;
    
    if (Math.abs(adjustedMfu - expectedMfu) < 0.01 && Math.abs(adjustedPfr - expectedPfr) < 0.01) {
      console.log('✅ Geographic factors applied correctly');
    } else {
      console.error('❌ Geographic factors not applied correctly');
      console.error(`   Expected MFU: $${expectedMfu}, Got: $${adjustedMfu}`);
      console.error(`   Expected PFR: $${expectedPfr}, Got: $${adjustedPfr}`);
    }
    
    // Test 3: Calculate adjusted costs using the service
    console.log('\nTest 3: Calculate adjusted costs using the service');
    
    const cptCode = '99213'; // Common office visit code
    const baseRate = 100;
    
    const result = await adjustedCostService.calculateAdjustedCosts({
      baseRate,
      cptCode,
      zipCode
    });
    
    console.log('Calculation result:');
    console.log('Cost Range:', result.costRange);
    
    if (result.mfrCosts) {
      console.log('Raw MFR Costs:', result.mfrCosts);
    }
    
    if (result.pfrCosts) {
      console.log('Raw PFR Costs:', result.pfrCosts);
    }
    
    if (result.adjustedMfrCosts) {
      console.log('Adjusted MFR Costs:', result.adjustedMfrCosts);
    }
    
    if (result.adjustedPfrCosts) {
      console.log('Adjusted PFR Costs:', result.adjustedPfrCosts);
    }
    
    // Verify that the adjusted costs are different from the raw costs
    if (
      result.mfrCosts && 
      result.adjustedMfrCosts && 
      Math.abs(result.mfrCosts.average - result.adjustedMfrCosts.average) > 0.01
    ) {
      console.log('✅ MFR costs were adjusted by geographic factors');
    } else if (result.mfrCosts && result.adjustedMfrCosts) {
      console.error('❌ MFR costs were not adjusted by geographic factors');
    }
    
    if (
      result.pfrCosts && 
      result.adjustedPfrCosts && 
      Math.abs(result.pfrCosts.average - result.adjustedPfrCosts.average) > 0.01
    ) {
      console.log('✅ PFR costs were adjusted by geographic factors');
    } else if (result.pfrCosts && result.adjustedPfrCosts) {
      console.error('❌ PFR costs were not adjusted by geographic factors');
    }
    
    // Test 4: Verify that manual cost override bypasses geographic adjustment
    console.log('\nTest 4: Verify that manual cost override bypasses geographic adjustment');
    
    // First, get a CPT code from the database
    const cptQuery = `SELECT * FROM cpt_codes WHERE code = $1 LIMIT 1;`;
    const cptResult = await executeQuery(cptQuery, [cptCode]);
    
    if (cptResult.rows.length === 0) {
      console.error(`❌ No CPT code found for ${cptCode}`);
      return;
    }
    
    const cptData = cptResult.rows[0];
    console.log('CPT code data:', cptData);
    
    // Calculate the expected costs with and without geographic adjustment
    const manualCost = 200;
    
    // Insert a test care plan entry with manual cost override
    const insertQuery = `
      INSERT INTO care_plan_entries (
        id, plan_id, category, item, frequency, cpt_code, cpt_description,
        min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
        start_age, end_age, is_one_time, is_manual_cost, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *;
    `;
    
    const entryId = crypto.randomUUID();
    const planId = 'test-plan-id';
    
    const insertParams = [
      entryId,
      planId,
      'physicianEvaluation',
      'Test Manual Cost Item',
      '1x per year',
      cptCode,
      cptData.code_description,
      manualCost,
      manualCost,
      manualCost,
      manualCost,
      manualCost * 10, // 10 years
      30,
      40,
      false,
      true, // is_manual_cost = true
      'Test entry for manual cost override'
    ];
    
    try {
      const insertResult = await executeQuery(insertQuery, insertParams);
      console.log('Inserted test entry with manual cost override:', insertResult.rows[0]);
      
      // Now fetch the entry to verify the costs
      const fetchQuery = `SELECT * FROM care_plan_entries WHERE id = $1;`;
      const fetchResult = await executeQuery(fetchQuery, [entryId]);
      
      if (fetchResult.rows.length === 0) {
        console.error('❌ Failed to fetch the inserted entry');
      } else {
        const entry = fetchResult.rows[0];
        console.log('Fetched entry:', entry);
        
        // Verify that the costs match the manual cost
        if (
          entry.min_cost === manualCost &&
          entry.avg_cost === manualCost &&
          entry.max_cost === manualCost
        ) {
          console.log('✅ Manual cost override works correctly');
        } else {
          console.error('❌ Manual cost override does not work correctly');
          console.error(`   Expected: $${manualCost}, Got: min=$${entry.min_cost}, avg=$${entry.avg_cost}, max=$${entry.max_cost}`);
        }
      }
      
      // Clean up the test entry
      const deleteQuery = `DELETE FROM care_plan_entries WHERE id = $1;`;
      await executeQuery(deleteQuery, [entryId]);
      console.log('Test entry deleted');
    } catch (error) {
      console.error('Error during test:', error);
    }
    
    console.log('\n=== Geographic Adjustment Factor Testing Complete ===');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testGeographicAdjustmentFactors().catch(console.error);
