/**
 * Property-Based Testing for Cost Calculations
 * 
 * This module implements property-based testing for the cost calculation system.
 * It generates random but valid input combinations and tests that the results
 * satisfy certain invariant properties that should always hold true.
 * 
 * Usage:
 * node propertyBasedTesting.mjs [--samples=1000] [--seed=123]
 */

// Import directly using relative path instead of path alias
import { CareCategory } from '../../../types/lifecare.js';
import costCalculator from '../costCalculator.js';
import frequencyParser from '../frequencyParser.js';
import Decimal from 'decimal.js';

// Mock functions for external services
const mockGeoFactorsService = {
  fetchGeoFactors: async (zipCode) => {
    if (zipCode === '00000') {
      return null; // Invalid ZIP
    }
    return {
      mfr_factor: 1.2,
      pfr_factor: 1.3
    };
  }
};

const mockCptCodeService = {
  lookupCPTCode: async (cptCode) => {
    if (!cptCode || cptCode === 'invalid') {
      return null;
    }
    return {
      code: cptCode,
      code_description: 'Test CPT Code',
      mfu_50th: 100,
      mfu_75th: 150,
      mfu_90th: 200,
      pfr_50th: 120,
      pfr_75th: 170,
      pfr_90th: 220
    };
  },
  hasMfuData: (cptCode) => {
    return cptCode !== 'no-mfu';
  },
  hasPfrData: (cptCode) => {
    return cptCode !== 'no-pfr';
  }
};

// Setup mocks
const setupMocks = () => {
  // Override the services in the costCalculator
  costCalculator.fetchGeoFactors = mockGeoFactorsService.fetchGeoFactors;
  costCalculator.lookupCPTCode = mockCptCodeService.lookupCPTCode;
  costCalculator.hasMfuData = mockCptCodeService.hasMfuData;
  costCalculator.hasPfrData = mockCptCodeService.hasPfrData;
};

/**
 * Random number generator with seed support
 */
class Random {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }

  // Simple LCG random number generator
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Random integer in range [min, max]
  integer(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random element from array
  pick(array) {
    return array[this.integer(0, array.length - 1)];
  }

  // Random boolean
  boolean() {
    return this.next() < 0.5;
  }

  // Random decimal number in range [min, max]
  decimal(min, max, precision = 2) {
    const value = this.next() * (max - min) + min;
    return new Decimal(value).toDecimalPlaces(precision);
  }
}

/**
 * Generate random test parameters
 */
const generateRandomParams = (random) => {
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

  // ZIP codes
  const ZIP_CODES = [
    '10001', // New York
    '90210', // Beverly Hills
    '60601', // Chicago
    '75001', // Dallas
    '00000', // Invalid
    null     // No ZIP
  ];

  // CPT codes
  const CPT_CODES = [
    '99213', // Standard office visit
    '97110', // Physical therapy
    'no-mfu', // No MFU data
    'no-pfr', // No PFR data
    'invalid', // Invalid CPT code
    null      // No CPT code
  ];

  // Generate random base rate (including edge cases)
  let baseRate;
  const baseRateType = random.integer(0, 10);
  if (baseRateType === 0) {
    baseRate = 0; // Zero base rate
  } else if (baseRateType === 1) {
    baseRate = random.decimal(0.01, 0.99); // Very small base rate
  } else if (baseRateType === 2) {
    baseRate = random.decimal(10000, 100000); // Very large base rate
  } else {
    baseRate = random.decimal(10, 1000); // Normal base rate
  }

  // Generate random age parameters
  const currentAge = random.integer(0, 100);
  const lifeExpectancy = random.integer(1, 50);
  
  // Randomly decide whether to use age range or current age + life expectancy
  const useAgeRange = random.boolean();
  let startAge, endAge;
  
  if (useAgeRange) {
    startAge = random.integer(0, 90);
    
    // Sometimes generate invalid age ranges for edge case testing
    if (random.integer(0, 10) === 0) {
      endAge = random.integer(0, startAge - 1); // End age before start age
    } else {
      endAge = random.integer(startAge, 100); // Valid end age
    }
  }

  // Generate random age increments (sometimes)
  let ageIncrements = null;
  if (random.integer(0, 5) === 0) { // 1 in 6 chance of having age increments
    const numIncrements = random.integer(1, 4);
    ageIncrements = [];
    
    let lastEndAge = 0;
    for (let i = 0; i < numIncrements; i++) {
      const incrementStartAge = lastEndAge + random.integer(0, 5);
      const incrementEndAge = incrementStartAge + random.integer(5, 20);
      lastEndAge = incrementEndAge;
      
      ageIncrements.push({
        startAge: incrementStartAge,
        endAge: incrementEndAge,
        adjustmentFactor: random.decimal(0.5, 2.0, 2),
        frequency: random.pick(FREQUENCY_PATTERNS),
        isOneTime: random.boolean()
      });
    }
  }

  // Build the parameters object
  const params = {
    baseRate: Number(baseRate),
    frequency: random.pick(FREQUENCY_PATTERNS),
    category: random.pick(CARE_CATEGORIES),
    zipCode: random.pick(ZIP_CODES),
    cptCode: random.pick(CPT_CODES)
  };

  // Add age parameters
  if (useAgeRange) {
    params.startAge = startAge;
    params.endAge = endAge;
  } else {
    params.currentAge = currentAge;
    params.lifeExpectancy = lifeExpectancy;
  }

  // Add age increments if generated
  if (ageIncrements) {
    params.ageIncrements = ageIncrements;
  }

  return params;
};

/**
 * Test invariants that should always hold true for calculation results
 */
const testInvariants = (params, result) => {
  const invariantViolations = [];
  
  // Check if one-time is correctly identified
  const parsedFrequency = frequencyParser.parseFrequency(params.frequency);
  if (parsedFrequency.valid && parsedFrequency.isOneTime !== result.isOneTime) {
    invariantViolations.push({
      invariant: 'One-time frequency identification',
      expected: parsedFrequency.isOneTime,
      actual: result.isOneTime,
      message: 'One-time frequency not correctly identified'
    });
  }
  
  // Check if annual cost is 0 for one-time items
  if (result.isOneTime && result.annual !== 0) {
    invariantViolations.push({
      invariant: 'Annual cost for one-time items',
      expected: 0,
      actual: result.annual,
      message: 'Annual cost should be 0 for one-time items'
    });
  }
  
  // Check if lifetime cost is greater than or equal to 0
  if (result.lifetime < 0) {
    invariantViolations.push({
      invariant: 'Non-negative lifetime cost',
      expected: '≥ 0',
      actual: result.lifetime,
      message: 'Lifetime cost should be non-negative'
    });
  }
  
  // Check if low is less than or equal to average and high is greater than or equal to average
  if (result.low > result.average) {
    invariantViolations.push({
      invariant: 'Low ≤ Average',
      expected: '≤',
      actual: `${result.low} > ${result.average}`,
      message: 'Low cost should be less than or equal to average cost'
    });
  }
  
  if (result.high < result.average) {
    invariantViolations.push({
      invariant: 'High ≥ Average',
      expected: '≥',
      actual: `${result.high} < ${result.average}`,
      message: 'High cost should be greater than or equal to average cost'
    });
  }
  
  // Check if annual cost is less than or equal to lifetime cost for recurring items
  if (!result.isOneTime && result.annual > result.lifetime) {
    invariantViolations.push({
      invariant: 'Annual ≤ Lifetime for recurring items',
      expected: '≤',
      actual: `${result.annual} > ${result.lifetime}`,
      message: 'Annual cost should be less than or equal to lifetime cost for recurring items'
    });
  }
  
  // Check decimal precision - all values should have at most 2 decimal places
  const checkDecimalPrecision = (value, name) => {
    const decimalStr = value.toString();
    const decimalParts = decimalStr.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      invariantViolations.push({
        invariant: `Decimal precision for ${name}`,
        expected: '≤ 2 decimal places',
        actual: `${decimalParts[1].length} decimal places`,
        message: `${name} should have at most 2 decimal places`
      });
    }
  };
  
  checkDecimalPrecision(result.annual, 'annual');
  checkDecimalPrecision(result.lifetime, 'lifetime');
  checkDecimalPrecision(result.low, 'low');
  checkDecimalPrecision(result.average, 'average');
  checkDecimalPrecision(result.high, 'high');
  
  return invariantViolations;
};

/**
 * Run property-based tests
 */
export const runPropertyBasedTests = async (numSamples = 1000, seed = Date.now()) => {
  setupMocks();
  
  console.log(`Running property-based tests with ${numSamples} samples (seed: ${seed})...`);
  
  const random = new Random(seed);
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];
  
  for (let i = 0; i < numSamples; i++) {
    try {
      // Generate random parameters
      const params = generateRandomParams(random);
      
      // Determine which function to call based on whether ageIncrements is present
      let result;
      if (params.ageIncrements) {
        result = await costCalculator.calculateItemCostsWithAgeIncrements(params);
      } else {
        result = await costCalculator.calculateItemCosts(params);
      }
      
      // Test invariants
      const invariantViolations = testInvariants(params, result);
      
      if (invariantViolations.length === 0) {
        passedTests++;
      } else {
        failedTests++;
        failures.push({
          params,
          result,
          invariantViolations
        });
        
        console.error(`Test ${i + 1} failed:`);
        console.error(`  Params: ${JSON.stringify(params, null, 2)}`);
        console.error(`  Result: ${JSON.stringify(result, null, 2)}`);
        console.error(`  Invariant violations:`);
        invariantViolations.forEach(violation => {
          console.error(`    - ${violation.invariant}: ${violation.message}`);
          console.error(`      Expected: ${violation.expected}, Actual: ${violation.actual}`);
        });
      }
    } catch (error) {
      failedTests++;
      failures.push({
        params: generateRandomParams(random),
        error: error.message
      });
      console.error(`Test ${i + 1} failed with error: ${error.message}`);
    }
    
    // Print progress every 100 tests
    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${numSamples} tests completed`);
    }
  }
  
  // Print results
  console.log('\nTest Results:');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Total: ${numSamples}`);
  
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. Test case:`);
      console.log(`   Params: ${JSON.stringify(failure.params, null, 2)}`);
      
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      } else {
        console.log(`   Result: ${JSON.stringify(failure.result, null, 2)}`);
        console.log(`   Invariant violations:`);
        failure.invariantViolations.forEach(violation => {
          console.log(`     - ${violation.invariant}: ${violation.message}`);
          console.log(`       Expected: ${violation.expected}, Actual: ${violation.actual}`);
        });
      }
    });
  }
  
  return {
    passedTests,
    failedTests,
    total: numSamples,
    failures
  };
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    samples: 1000,
    seed: Date.now()
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--samples=')) {
      options.samples = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--seed=')) {
      options.seed = parseInt(arg.split('=')[1], 10);
    }
  });
  
  return options;
};

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  runPropertyBasedTests(options.samples, options.seed)
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}
