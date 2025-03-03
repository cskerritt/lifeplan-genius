import { CostCalculationParams } from '../types';
import { CareCategory, AgeIncrement } from '@/types/lifecare';

/**
 * Generates all combinations of test parameters
 */
export const generateTestCombinations = () => {
  const categories: CareCategory[] = [
    'physicianEvaluation', 'physicianFollowUp', 'therapyEvaluation', 
    'therapyFollowUp', 'medication', 'surgical', 'dme', 'supplies', 
    'homeCare', 'homeModification', 'transportation', 'interventional', 
    'diagnostics'
  ];
  
  const frequencies = [
    'one-time', 'once', 'annual', 'yearly', 'once a year',
    'semi-annual', 'twice a year', 'quarterly', 'monthly', 
    '2 times per month', 'twice a month', 'biweekly', 'every other week',
    'weekly', '2 times per week', 'twice a week', 'daily', 'every day',
    '3 times per day', '3-5 times per year', '4-4x per year 30 years'
  ];
  
  const durationScenarios = [
    { type: 'from-frequency', value: 'for 5-10 years' },
    { type: 'from-age-range', startAge: 45, endAge: 75 },
    { type: 'default', currentAge: 45, lifeExpectancy: 35 }
  ];
  
  const geoScenarios = [
    { type: 'with-zip', zipCode: '90210' },
    { type: 'without-zip' },
    { type: 'invalid-zip', zipCode: '00000' }
  ];
  
  const cptScenarios = [
    { type: 'with-cpt', cptCode: '99213' },
    { type: 'without-cpt', cptCode: null },
    { type: 'invalid-cpt', cptCode: 'invalid' },
    { type: 'no-mfu-data', cptCode: 'no-mfu' },
    { type: 'no-pfr-data', cptCode: 'no-pfr' }
  ];
  
  const ageIncrementScenarios = [
    { type: 'no-increments' },
    { type: 'with-increments', increments: [
      { startAge: 45, endAge: 55, frequency: 'monthly', isOneTime: false },
      { startAge: 55, endAge: 65, frequency: 'quarterly', isOneTime: false },
      { startAge: 65, endAge: 75, frequency: 'one-time', isOneTime: true }
    ]}
  ];
  
  // Generate representative combinations
  const testCases: Array<{
    name: string;
    params: CostCalculationParams & { ageIncrements?: AgeIncrement[] };
  }> = [];
  
  // Generate one test case for each category with a one-time frequency
  categories.forEach(category => {
    testCases.push({
      name: `One-time cost for ${category}`,
      params: {
        baseRate: 100,
        frequency: 'one-time',
        category,
        zipCode: '90210'
      }
    });
  });
  
  // Generate one test case for each category with a recurring frequency
  categories.forEach(category => {
    testCases.push({
      name: `Recurring cost for ${category}`,
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category,
        zipCode: '90210',
        currentAge: 45,
        lifeExpectancy: 85
      }
    });
  });
  
  // Generate one test case for each frequency pattern
  frequencies.forEach(frequency => {
    testCases.push({
      name: `Frequency pattern: ${frequency}`,
      params: {
        baseRate: 100,
        frequency,
        category: 'physicianFollowUp',
        zipCode: '90210',
        currentAge: 45,
        lifeExpectancy: 85
      }
    });
  });
  
  // Generate one test case for each duration scenario
  durationScenarios.forEach(scenario => {
    const params: CostCalculationParams = {
      baseRate: 100,
      frequency: scenario.type === 'from-frequency' 
        ? `monthly ${scenario.value}` 
        : 'monthly',
      category: 'physicianFollowUp',
      zipCode: '90210'
    };
    
    if (scenario.type === 'from-age-range') {
      params.startAge = scenario.startAge;
      params.endAge = scenario.endAge;
    } else if (scenario.type === 'default') {
      params.currentAge = scenario.currentAge;
      params.lifeExpectancy = scenario.lifeExpectancy;
    }
    
    testCases.push({
      name: `Duration scenario: ${scenario.type}`,
      params
    });
  });
  
  // Generate one test case for each geographic adjustment scenario
  geoScenarios.forEach(scenario => {
    testCases.push({
      name: `Geographic adjustment: ${scenario.type}`,
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'physicianFollowUp',
        zipCode: scenario.zipCode
      }
    });
  });
  
  // Generate one test case for each CPT code scenario
  cptScenarios.forEach(scenario => {
    testCases.push({
      name: `CPT code scenario: ${scenario.type}`,
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'physicianFollowUp',
        zipCode: '90210',
        cptCode: scenario.cptCode
      }
    });
  });
  
  // Generate one test case for each age increment scenario
  ageIncrementScenarios.forEach(scenario => {
    if (scenario.type === 'with-increments') {
      testCases.push({
        name: `Age increment scenario: ${scenario.type}`,
        params: {
          baseRate: 100,
          frequency: 'monthly',
          category: 'physicianFollowUp',
          zipCode: '90210',
          ageIncrements: scenario.increments
        }
      });
    } else {
      testCases.push({
        name: `Age increment scenario: ${scenario.type}`,
        params: {
          baseRate: 100,
          frequency: 'monthly',
          category: 'physicianFollowUp',
          zipCode: '90210'
        }
      });
    }
  });
  
  // Generate edge cases
  
  // Zero base rate
  testCases.push({
    name: 'Edge case: Zero base rate',
    params: {
      baseRate: 0,
      frequency: 'monthly',
      category: 'physicianFollowUp'
    }
  });
  
  // Invalid frequency
  testCases.push({
    name: 'Edge case: Invalid frequency',
    params: {
      baseRate: 100,
      frequency: 'invalid-frequency',
      category: 'physicianFollowUp'
    }
  });
  
  // Age increments with gaps
  testCases.push({
    name: 'Edge case: Age increments with gaps',
    params: {
      baseRate: 100,
      frequency: 'monthly',
      category: 'physicianFollowUp',
      zipCode: '90210',
      ageIncrements: [
        { startAge: 45, endAge: 55, frequency: 'monthly', isOneTime: false },
        // Gap between 55 and 65
        { startAge: 65, endAge: 75, frequency: 'quarterly', isOneTime: false }
      ]
    }
  });
  
  // Age increments with overlaps
  testCases.push({
    name: 'Edge case: Age increments with overlaps',
    params: {
      baseRate: 100,
      frequency: 'monthly',
      category: 'physicianFollowUp',
      zipCode: '90210',
      ageIncrements: [
        { startAge: 45, endAge: 60, frequency: 'monthly', isOneTime: false },
        // Overlap between 55 and 60
        { startAge: 55, endAge: 75, frequency: 'quarterly', isOneTime: false }
      ]
    }
  });
  
  // Negative durations
  testCases.push({
    name: 'Edge case: Negative durations',
    params: {
      baseRate: 100,
      frequency: 'monthly',
      category: 'physicianFollowUp',
      startAge: 75, // End age is less than start age
      endAge: 45
    }
  });
  
  return testCases;
};

/**
 * Generates a subset of test combinations to keep test runtime reasonable
 */
export const generateRepresentativeTestCombinations = () => {
  const allCombinations = generateTestCombinations();
  
  // Select a representative subset
  // For example, take every 10th combination
  const representativeCombinations = allCombinations.filter((_, index) => index % 10 === 0);
  
  return representativeCombinations;
};

/**
 * Utility to run a test for each combination
 */
export const runTestsForCombinations = (
  testCases: Array<{
    name: string;
    params: CostCalculationParams & { ageIncrements?: AgeIncrement[] };
  }>,
  testFn: (params: CostCalculationParams & { ageIncrements?: AgeIncrement[] }) => Promise<void>
) => {
  testCases.forEach(testCase => {
    it(`should handle ${testCase.name} correctly`, async () => {
      await testFn(testCase.params);
    });
  });
};
