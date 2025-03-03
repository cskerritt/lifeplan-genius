// This script tests the geographic adjustment for one-time fees
import { calculateItemCosts, fetchGeoFactors } from './src/utils/calculations/costCalculator.js';

async function testOneTimeGafAdjustment() {
  console.log('Testing geographic adjustment for one-time fees...');
  
  // Test parameters
  const baseRate = 100;
  const frequency = 'one-time';
  const zipCode = '90210'; // Beverly Hills ZIP code
  const cptCode = '99213'; // Example CPT code
  
  // First, calculate costs without geographic adjustment
  const costsWithoutGeo = await calculateItemCosts({
    baseRate,
    frequency,
    cptCode
  });
  
  console.log('Costs without geographic adjustment:');
  console.log(costsWithoutGeo);
  
  // Then, fetch geographic factors for the ZIP code
  const geoFactors = await fetchGeoFactors(zipCode);
  console.log('Geographic factors for ZIP code', zipCode, ':', geoFactors);
  
  // Finally, calculate costs with geographic adjustment
  const costsWithGeo = await calculateItemCosts({
    baseRate,
    frequency,
    zipCode,
    cptCode
  });
  
  console.log('Costs with geographic adjustment:');
  console.log(costsWithGeo);
  
  // Verify that the geographic adjustment was applied
  if (geoFactors) {
    console.log('\nVerifying GAF adjustments were applied correctly:');
    
    // Check if we have different values for low, average, and high
    if (costsWithGeo.low !== costsWithGeo.high) {
      console.log('✅ Low and high costs are different, indicating percentiles are being used');
    } else {
      console.log('❌ Low and high costs are the same, percentiles may not be applied correctly');
    }
    
    // Check if the values are different from the base rate
    if (costsWithGeo.average !== baseRate) {
      console.log('✅ Adjusted average cost differs from base rate, indicating GAF was applied');
    } else {
      console.log('❌ Adjusted average cost equals base rate, GAF may not be applied');
    }
    
    // Check if the values are different from the non-adjusted costs
    if (costsWithGeo.average !== costsWithoutGeo.average) {
      console.log('✅ Adjusted costs differ from non-adjusted costs, indicating GAF was applied');
    } else {
      console.log('❌ Adjusted costs equal non-adjusted costs, GAF may not be applied');
    }
    
    // Calculate expected values based on MFR and PFR factors
    if (costsWithoutGeo.mfrCosts && costsWithoutGeo.pfrCosts) {
      const expectedLow = ((costsWithoutGeo.mfrCosts.low * geoFactors.mfr_factor) + 
                          (costsWithoutGeo.pfrCosts.low * geoFactors.pfr_factor)) / 2;
      
      const expectedHigh = ((costsWithoutGeo.mfrCosts.high * geoFactors.mfr_factor) + 
                           (costsWithoutGeo.pfrCosts.high * geoFactors.pfr_factor)) / 2;
      
      const expectedAvg = (expectedLow + expectedHigh) / 2;
      
      console.log('\nExpected values after GAF adjustment:');
      console.log(`Low: ${expectedLow.toFixed(2)}`);
      console.log(`Average: ${expectedAvg.toFixed(2)}`);
      console.log(`High: ${expectedHigh.toFixed(2)}`);
      
      console.log('\nActual values after GAF adjustment:');
      console.log(`Low: ${costsWithGeo.low.toFixed(2)}`);
      console.log(`Average: ${costsWithGeo.average.toFixed(2)}`);
      console.log(`High: ${costsWithGeo.high.toFixed(2)}`);
      
      // Check if the values match within a small margin of error
      const isLowCorrect = Math.abs(costsWithGeo.low - expectedLow) < 0.01;
      const isAvgCorrect = Math.abs(costsWithGeo.average - expectedAvg) < 0.01;
      const isHighCorrect = Math.abs(costsWithGeo.high - expectedHigh) < 0.01;
      
      if (isLowCorrect && isAvgCorrect && isHighCorrect) {
        console.log('\n✅ All values match expected calculations, GAF is being applied correctly to one-time fees');
      } else {
        console.log('\n❌ Values do not match expected calculations:');
        if (!isLowCorrect) console.log(`  - Low value is incorrect: expected ${expectedLow.toFixed(2)}, got ${costsWithGeo.low.toFixed(2)}`);
        if (!isAvgCorrect) console.log(`  - Average value is incorrect: expected ${expectedAvg.toFixed(2)}, got ${costsWithGeo.average.toFixed(2)}`);
        if (!isHighCorrect) console.log(`  - High value is incorrect: expected ${expectedHigh.toFixed(2)}, got ${costsWithGeo.high.toFixed(2)}`);
      }
    } else {
      console.log('\n⚠️ Could not verify exact calculations because MFR or PFR costs are missing');
    }
  } else {
    console.log('⚠️ Could not verify geographic adjustment because no factors were found for ZIP code', zipCode);
  }
}

testOneTimeGafAdjustment().catch(console.error);
