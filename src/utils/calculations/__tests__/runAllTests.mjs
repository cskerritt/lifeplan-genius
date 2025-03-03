/**
 * Comprehensive Test Runner for Cost Calculations
 * 
 * This script runs all the different types of tests for the cost calculation system:
 * - Property-based testing
 * - Golden master testing
 * - Cross-strategy validation
 * - Comprehensive test combinations
 * 
 * Usage:
 * node runAllTests.mjs [--property-samples=500] [--seed=123] [--generate-golden]
 */

import { runPropertyBasedTests } from './propertyBasedTesting.mjs';
import { generateGoldenMasterData, verifyAgainstGoldenMaster } from './goldenMasterTesting.mjs';
import { runCrossStrategyValidationTests } from './crossStrategyValidation.mjs';
import { runTests as runComprehensiveTests } from './runComprehensiveTests.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the test results directory
const TEST_RESULTS_DIR = path.join(__dirname, 'test-results');

// Ensure the test results directory exists
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

/**
 * Parse command line arguments
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    propertySamples: 500,
    seed: Date.now(),
    generateGolden: false,
    useAllCombinations: false
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--property-samples=')) {
      options.propertySamples = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--seed=')) {
      options.seed = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--generate-golden') {
      options.generateGolden = true;
    } else if (arg === '--all-combinations') {
      options.useAllCombinations = true;
    }
  });
  
  return options;
};

/**
 * Save test results to a file
 */
const saveTestResults = (testName, results) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `${testName}-${timestamp}.json`;
  const filePath = path.join(TEST_RESULTS_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Test results saved to ${filePath}`);
};

/**
 * Run all tests
 */
const runAllTests = async () => {
  const options = parseArgs();
  console.log('Running all cost calculation tests with options:', options);
  
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    seed: options.seed,
    tests: {}
  };
  
  let allTestsPassed = true;
  
  try {
    // Run property-based tests
    console.log('\n=== Running Property-Based Tests ===\n');
    const propertyResults = await runPropertyBasedTests(options.propertySamples, options.seed);
    results.tests.propertyBased = propertyResults;
    allTestsPassed = allTestsPassed && propertyResults.failedTests === 0;
    
    // Run golden master tests
    console.log('\n=== Running Golden Master Tests ===\n');
    if (options.generateGolden) {
      await generateGoldenMasterData();
    }
    const goldenResults = await verifyAgainstGoldenMaster();
    results.tests.goldenMaster = goldenResults;
    allTestsPassed = allTestsPassed && (goldenResults.success !== false);
    
    // Run cross-strategy validation tests
    console.log('\n=== Running Cross-Strategy Validation Tests ===\n');
    const strategyResults = await runCrossStrategyValidationTests();
    results.tests.crossStrategy = strategyResults;
    allTestsPassed = allTestsPassed && strategyResults.success;
    
    // Run comprehensive tests
    console.log('\n=== Running Comprehensive Tests ===\n');
    const comprehensiveResults = await runComprehensiveTests(options.useAllCombinations);
    results.tests.comprehensive = comprehensiveResults;
    allTestsPassed = allTestsPassed && comprehensiveResults.failedTests === 0;
    
  } catch (error) {
    console.error('Error running tests:', error);
    results.error = error.message;
    allTestsPassed = false;
  }
  
  // Calculate total test statistics
  const totalTests = Object.values(results.tests).reduce((sum, result) => {
    return sum + (result.total || 0);
  }, 0);
  
  const totalPassed = Object.values(results.tests).reduce((sum, result) => {
    return sum + (result.passedTests || 0);
  }, 0);
  
  const totalFailed = Object.values(results.tests).reduce((sum, result) => {
    return sum + (result.failedTests || 0);
  }, 0);
  
  results.summary = {
    totalTests,
    totalPassed,
    totalFailed,
    allTestsPassed,
    duration: Date.now() - startTime
  };
  
  // Print summary
  console.log('\n=== Test Summary ===\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Duration: ${results.summary.duration}ms`);
  console.log(`All Tests Passed: ${allTestsPassed ? 'YES' : 'NO'}`);
  
  // Save results
  saveTestResults('all-tests', results);
  
  return {
    success: allTestsPassed,
    results
  };
};

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(({ success }) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

export default runAllTests;
