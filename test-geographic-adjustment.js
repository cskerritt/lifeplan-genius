// This script tests the geographic adjustment for one-time fees
import { calculateItemCosts, fetchGeoFactors } from './src/utils/calculations/costCalculator.js';

async function testGeographicAdjustment() {
  console.log('Testing geographic adjustment for one-time fees...');
  
  // Test parameters
  const baseRate = 100;
  const frequency = 'one-time';
  const zipCode = '90210'; // Beverly Hills ZIP code
  
  // First, calculate costs without geographic adjustment
  const costsWithoutGeo = await calculateItemCosts({
    baseRate,
    frequency,
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
  });
  
  console.log('Costs with geographic adjustment:');
  console.log(costsWithGeo);
  
  // Verify that the geographic adjustment was applied
  if (geoFactors) {
    const expectedAverage = baseRate * geoFactors.pfr_factor;
    console.log('Expected average cost with geographic adjustment:', expectedAverage);
    console.log('Actual average cost with geographic adjustment:', costsWithGeo.average);
    
    if (Math.abs(costsWithGeo.average - expectedAverage) < 0.01) {
      console.log('✅ Geographic adjustment is being applied correctly to one-time fees');
    } else {
      console.log('❌ Geographic adjustment is NOT being applied correctly to one-time fees');
    }
  } else {
    console.log('⚠️ Could not verify geographic adjustment because no factors were found for ZIP code', zipCode);
  }
}

testGeographicAdjustment().catch(console.error);
