/**
 * Test data generator for cost calculations
 * 
 * This module provides functions to generate test combinations for cost calculations.
 * It can generate all possible combinations or a representative subset.
 */

// Care categories
const CARE_CATEGORIES = [
  'Medical',
  'Therapy',
  'Nursing',
  'Personal Care',
  'Home Health',
  'Equipment',
  'Supplies',
  'Medications',
  'Transportation',
  'Housing',
  'Nutrition',
  'Recreation',
  'Education'
];

// Frequency patterns
const FREQUENCY_PATTERNS = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annually',
  'one-time',
  'once',
  '2x daily',
  '3x daily',
  '2x weekly',
  '3x weekly',
  '2x monthly',
  '3x monthly',
  '2x annually',
  '3x annually',
  'every 2 days',
  'every 3 days',
  'every 2 weeks',
  'every 3 weeks',
  'every 2 months',
  'every 3 months'
];

// Duration scenarios
const DURATION_SCENARIOS = [
  { startAge: 30, endAge: 80, lifeExpectancy: 85 },
  { startAge: 40, endAge: null, lifeExpectancy: 85 },
  { startAge: 50, endAge: 60, lifeExpectancy: 85 }
];

// Geographic adjustment scenarios
const GEO_ADJUSTMENT_SCENARIOS = [
  { zipCode: '10001', description: 'New York (high cost)' },
  { zipCode: '60601', description: 'Chicago (medium cost)' },
  { zipCode: '00000', description: 'Invalid ZIP (no adjustment)' }
];

// CPT code scenarios
const CPT_CODE_SCENARIOS = [
  { cptCode: '99213', description: 'Standard office visit' },
  { cptCode: '97110', description: 'Physical therapy' },
  { cptCode: 'no-mfu', description: 'No MFU data' },
  { cptCode: 'no-pfr', description: 'No PFR data' },
  { cptCode: 'invalid', description: 'Invalid CPT code' }
];

// Age increment scenarios
const AGE_INCREMENT_SCENARIOS = [
  null, // No age increments
  [
    { startAge: 30, endAge: 50, adjustmentFactor: 1.0 },
    { startAge: 51, endAge: 70, adjustmentFactor: 1.2 },
    { startAge: 71, endAge: 85, adjustmentFactor: 1.5 }
  ]
];

/**
 * Generate all possible test combinations
 */
export function generateTestCombinations() {
  const combinations = [];
  
  // Generate combinations
  for (const category of CARE_CATEGORIES) {
    for (const frequency of FREQUENCY_PATTERNS) {
      for (const duration of DURATION_SCENARIOS) {
        for (const geoAdjustment of GEO_ADJUSTMENT_SCENARIOS) {
          for (const cptCode of CPT_CODE_SCENARIOS) {
            for (const ageIncrements of AGE_INCREMENT_SCENARIOS) {
              // Base test case
              const baseCase = {
                name: `${category} - ${frequency} - ${cptCode.description}`,
                params: {
                  category,
                  frequency,
                  baseRate: 100,
                  startAge: duration.startAge,
                  endAge: duration.endAge,
                  lifeExpectancy: duration.lifeExpectancy,
                  zipCode: geoAdjustment.zipCode,
                  cptCode: cptCode.cptCode,
                  ageIncrements
                }
              };
              
              combinations.push(baseCase);
              
              // Edge case: zero base rate
              combinations.push({
                name: `${category} - ${frequency} - Zero base rate`,
                params: {
                  ...baseCase.params,
                  baseRate: 0
                }
              });
              
              // Edge case: very high base rate
              combinations.push({
                name: `${category} - ${frequency} - High base rate`,
                params: {
                  ...baseCase.params,
                  baseRate: 10000
                }
              });
              
              // Edge case: start age equals end age
              if (duration.endAge !== null) {
                combinations.push({
                  name: `${category} - ${frequency} - Start age equals end age`,
                  params: {
                    ...baseCase.params,
                    startAge: duration.startAge,
                    endAge: duration.startAge
                  }
                });
              }
              
              // Edge case: start age greater than life expectancy
              combinations.push({
                name: `${category} - ${frequency} - Start age > life expectancy`,
                params: {
                  ...baseCase.params,
                  startAge: duration.lifeExpectancy + 5
                }
              });
            }
          }
        }
      }
    }
  }
  
  return combinations;
}

/**
 * Generate a representative subset of test combinations
 */
export function generateRepresentativeTestCombinations() {
  const combinations = [];
  
  // Select representative categories
  const repCategories = ['Medical', 'Therapy', 'Equipment', 'Medications', 'Transportation'];
  
  // Select representative frequencies
  const repFrequencies = ['daily', 'weekly', 'monthly', 'annually', 'one-time', '2x daily', '3x weekly', 'every 2 months'];
  
  // Select representative durations
  const repDurations = [
    { startAge: 30, endAge: 80, lifeExpectancy: 85 },
    { startAge: 40, endAge: null, lifeExpectancy: 85 }
  ];
  
  // Select representative geographic adjustments
  const repGeoAdjustments = [
    { zipCode: '10001', description: 'New York (high cost)' },
    { zipCode: '00000', description: 'Invalid ZIP (no adjustment)' }
  ];
  
  // Select representative CPT codes
  const repCptCodes = [
    { cptCode: '99213', description: 'Standard office visit' },
    { cptCode: 'invalid', description: 'Invalid CPT code' }
  ];
  
  // Select representative age increments
  const repAgeIncrements = [
    null,
    [
      { startAge: 30, endAge: 50, adjustmentFactor: 1.0 },
      { startAge: 51, endAge: 70, adjustmentFactor: 1.2 },
      { startAge: 71, endAge: 85, adjustmentFactor: 1.5 }
    ]
  ];
  
  // Generate combinations
  for (const category of repCategories) {
    for (const frequency of repFrequencies) {
      for (const duration of repDurations) {
        for (const geoAdjustment of repGeoAdjustments) {
          for (const cptCode of repCptCodes) {
            for (const ageIncrements of repAgeIncrements) {
              // Base test case
              const baseCase = {
                name: `${category} - ${frequency} - ${cptCode.description}`,
                params: {
                  category,
                  frequency,
                  baseRate: 100,
                  startAge: duration.startAge,
                  endAge: duration.endAge,
                  lifeExpectancy: duration.lifeExpectancy,
                  zipCode: geoAdjustment.zipCode,
                  cptCode: cptCode.cptCode,
                  ageIncrements
                }
              };
              
              combinations.push(baseCase);
              
              // Add a few edge cases
              if (category === 'Medical' && frequency === 'daily') {
                // Edge case: zero base rate
                combinations.push({
                  name: `${category} - ${frequency} - Zero base rate`,
                  params: {
                    ...baseCase.params,
                    baseRate: 0
                  }
                });
                
                // Edge case: very high base rate
                combinations.push({
                  name: `${category} - ${frequency} - High base rate`,
                  params: {
                    ...baseCase.params,
                    baseRate: 10000
                  }
                });
              }
              
              // Edge case: start age equals end age
              if (category === 'Therapy' && frequency === 'weekly' && duration.endAge !== null) {
                combinations.push({
                  name: `${category} - ${frequency} - Start age equals end age`,
                  params: {
                    ...baseCase.params,
                    startAge: duration.startAge,
                    endAge: duration.startAge
                  }
                });
              }
              
              // Edge case: start age greater than life expectancy
              if (category === 'Equipment' && frequency === 'one-time') {
                combinations.push({
                  name: `${category} - ${frequency} - Start age > life expectancy`,
                  params: {
                    ...baseCase.params,
                    startAge: duration.lifeExpectancy + 5
                  }
                });
              }
            }
          }
        }
      }
    }
  }
  
  return combinations;
}
