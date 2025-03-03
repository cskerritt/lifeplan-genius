/**
 * Cross-Strategy Validation for Cost Calculations
 * 
 * This module implements cross-strategy validation for the cost calculation system.
 * It tests that different calculation strategies produce consistent results when
 * they should, helping to validate that strategy selection logic is correct.
 * 
 * Usage:
 * node crossStrategyValidation.mjs
 */

import { CostCalculationStrategy } from '../strategies/costCalculationStrategy.js';
import { OneTimeCostStrategy } from '../strategies/oneTimeCostStrategy.js';
import { RecurringCostStrategy } from '../strategies/recurringCostStrategy.js';
import { AgeIncrementCostStrategy } from '../strategies/ageIncrementCostStrategy.js';
import { CostCalculationStrategyFactory } from '../strategies/costCalculationStrategyFactory.js';
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

/**
 * Compare two numeric values with a tolerance for floating-point differences
 */
const areNumbersEqual = (a, b, tolerance = 0.001) => {
  if (a === b) return true;
  if (a === 0) return Math.abs(b) < tolerance;
  if (b === 0) return Math.abs(a) < tolerance;
  return Math.abs((a - b) / Math.max(Math.abs(a), Math.abs(b))) < tolerance;
};

/**
 * Compare two calculation results
 */
const areResultsEqual = (result1, result2) => {
  if (result1.isOneTime !== result2.isOneTime) {
    return {
      equal: false,
      differences: ['isOneTime']
    };
  }
  
  const differences = [];
  
  // Compare numeric values with tolerance
  if (!areNumbersEqual(result1.annual, result2.annual)) {
    differences.push('annual');
  }
  
  if (!areNumbersEqual(result1.lifetime, result2.lifetime)) {
    differences.push('lifetime');
  }
  
  if (!areNumbersEqual(result1.low, result2.low)) {
    differences.push('low');
  }
  
  if (!areNumbersEqual(result1.average, result2.average)) {
    differences.push('average');
  }
  
  if (!areNumbersEqual(result1.high, result2.high)) {
    differences.push('high');
  }
  
  // Compare nested objects if they exist
  const compareNestedObject = (obj1, obj2, prefix) => {
    if (obj1 && obj2) {
      if (!areNumbersEqual(obj1.low, obj2.low)) {
        differences.push(`${prefix}.low`);
      }
      
      if (!areNumbersEqual(obj1.average, obj2.average)) {
        differences.push(`${prefix}.average`);
      }
      
      if (!areNumbersEqual(obj1.high, obj2.high)) {
        differences.push(`${prefix}.high`);
      }
    } else if (obj1 && !obj2) {
      differences.push(`${prefix} missing in result2`);
    } else if (!obj1 && obj2) {
      differences.push(`${prefix} missing in result1`);
    }
  };
  
  compareNestedObject(result1.mfrCosts, result2.mfrCosts, 'mfrCosts');
  compareNestedObject(result1.pfrCosts, result2.pfrCosts, 'pfrCosts');
  compareNestedObject(result1.adjustedMfrCosts, result2.adjustedMfrCosts, 'adjustedMfrCosts');
  compareNestedObject(result1.adjustedPfrCosts, result2.adjustedPfrCosts, 'adjustedPfrCosts');
  
  return {
    equal: differences.length === 0,
    differences
  };
};

/**
 * Setup a strategy with mocked services
 */
const setupStrategy = (strategy) => {
  // Mock the external service methods
  strategy.fetchGeoFactors = mockGeoFactorsService.fetchGeoFactors;
  strategy.lookupCPTCode = mockCptCodeService.lookupCPTCode;
  strategy.hasMfuData = mockCptCodeService.hasMfuData;
  strategy.hasPfrData = mockCptCodeService.hasPfrData;
  
  return strategy;
};

/**
 * Generate test cases for cross-strategy validation
 */
const generateTestCases = () => {
  return [
    // Test case 1: One-time cost - should be handled by OneTimeCostStrategy
    {
      name: 'One-time medical expense',
      params: {
        baseRate: 1000,
        frequency: 'one-time',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85
      },
      expectedStrategy: 'OneTimeCostStrategy'
    },
    
    // Test case 2: Recurring cost - should be handled by RecurringCostStrategy
    {
      name: 'Monthly doctor visit',
      params: {
        baseRate: 200,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '90210',
        currentAge: 60,
        lifeExpectancy: 85
      },
      expectedStrategy: 'RecurringCostStrategy'
    },
    
    // Test case 3: Age increments - should be handled by AgeIncrementCostStrategy
    {
      name: 'Age increments - standard',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        ageIncrements: [
          { startAge: 30, endAge: 50, adjustmentFactor: 1.0 },
          { startAge: 51, endAge: 70, adjustmentFactor: 1.2 },
          { startAge: 71, endAge: 85, adjustmentFactor: 1.5 }
        ]
      },
      expectedStrategy: 'AgeIncrementCostStrategy'
    },
    
    // Test case 4: Edge case - frequency with duration
    {
      name: 'Monthly visits for 10 years',
      params: {
        baseRate: 150,
        frequency: 'monthly for 10 years',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85
      },
      expectedStrategy: 'RecurringCostStrategy'
    },
    
    // Test case 5: Edge case - zero base rate
    {
      name: 'Zero base rate',
      params: {
        baseRate: 0,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85
      },
      expectedStrategy: 'RecurringCostStrategy'
    }
  ];
};

/**
 * Run cross-strategy validation tests
 */
export const runCrossStrategyValidationTests = async () => {
  console.log('Running cross-strategy validation tests...');
  
  const testCases = generateTestCases();
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      // Get the strategy from the factory
      const factoryStrategy = CostCalculationStrategyFactory.createStrategy(testCase.params);
      setupStrategy(factoryStrategy);
      
      // Verify the factory selected the expected strategy
      const factoryStrategyName = factoryStrategy.constructor.name;
      if (factoryStrategyName !== testCase.expectedStrategy) {
        failedTests++;
        failures.push({
          testCase,
          error: `Factory selected wrong strategy: expected ${testCase.expectedStrategy}, got ${factoryStrategyName}`
        });
        console.error(`  Failed: Factory selected wrong strategy: expected ${testCase.expectedStrategy}, got ${factoryStrategyName}`);
        continue;
      }
      
      // Calculate using the factory-selected strategy
      const factoryResult = await factoryStrategy.calculate(testCase.params);
      
      // Now calculate using each strategy directly
      const strategies = [
        setupStrategy(new OneTimeCostStrategy()),
        setupStrategy(new RecurringCostStrategy()),
        setupStrategy(new AgeIncrementCostStrategy())
      ];
      
      let strategyResults = [];
      for (const strategy of strategies) {
        try {
          const result = await strategy.calculate(testCase.params);
          strategyResults.push({
            strategy: strategy.constructor.name,
            result
          });
        } catch (error) {
          // Some strategies might throw errors for incompatible params, which is expected
          strategyResults.push({
            strategy: strategy.constructor.name,
            error: error.message
          });
        }
      }
      
      // Find the result from the expected strategy
      const expectedStrategyResult = strategyResults.find(sr => sr.strategy === testCase.expectedStrategy);
      
      if (!expectedStrategyResult || expectedStrategyResult.error) {
        failedTests++;
        failures.push({
          testCase,
          error: `Expected strategy ${testCase.expectedStrategy} failed: ${expectedStrategyResult?.error || 'No result'}`
        });
        console.error(`  Failed: Expected strategy ${testCase.expectedStrategy} failed: ${expectedStrategyResult?.error || 'No result'}`);
        continue;
      }
      
      // Compare factory result with expected strategy result
      const comparison = areResultsEqual(factoryResult, expectedStrategyResult.result);
      
      if (comparison.equal) {
        passedTests++;
        console.log(`  Passed: Factory result matches ${testCase.expectedStrategy} result`);
      } else {
        failedTests++;
        failures.push({
          testCase,
          factoryResult,
          expectedStrategyResult: expectedStrategyResult.result,
          differences: comparison.differences
        });
        console.error(`  Failed: Differences in ${comparison.differences.join(', ')}`);
      }
      
      // Additional check: For strategies that should be compatible, verify results match
      // For example, a one-time cost should give the same result with OneTimeCostStrategy and AgeIncrementCostStrategy
      if (testCase.expectedStrategy === 'OneTimeCostStrategy') {
        // One-time costs should also work with AgeIncrementCostStrategy
        const ageIncrementResult = strategyResults.find(sr => sr.strategy === 'AgeIncrementCostStrategy');
        if (ageIncrementResult && !ageIncrementResult.error) {
          const comparison = areResultsEqual(factoryResult, ageIncrementResult.result);
          if (!comparison.equal) {
            console.warn(`  Warning: OneTimeCostStrategy and AgeIncrementCostStrategy results differ for one-time cost`);
            console.warn(`    Differences in: ${comparison.differences.join(', ')}`);
          }
        }
      }
      
    } catch (error) {
      failedTests++;
      failures.push({
        testCase,
        error: error.message
      });
      console.error(`  Failed with error: ${error.message}`);
    }
  }
  
  // Print results
  console.log('\nTest Results:');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Total: ${testCases.length}`);
  
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.testCase.name}`);
      
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      } else {
        console.log(`   Differences in: ${failure.differences.join(', ')}`);
        console.log(`   Factory result: ${JSON.stringify(failure.factoryResult, null, 2)}`);
        console.log(`   Expected strategy result: ${JSON.stringify(failure.expectedStrategyResult, null, 2)}`);
      }
    });
  }
  
  return {
    success: failedTests === 0,
    passedTests,
    failedTests,
    total: testCases.length,
    failures
  };
};

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCrossStrategyValidationTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}
