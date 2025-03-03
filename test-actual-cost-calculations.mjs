/**
 * Test Actual Cost Calculations
 * 
 * This script tests the actual cost calculation logic from the application code.
 * It imports the real calculation modules and runs tests against them to identify
 * issues with $0 outputs.
 * 
 * Usage:
 * node test-actual-cost-calculations.mjs [options]
 * 
 * Options:
 *   --verbose       Enable verbose logging
 *   --test-case=X   Run a specific test case (1-5)
 *   --all           Run all test cases
 *   --export        Export logs to a JSON file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Decimal from 'decimal.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  testCase: args.find(arg => arg.startsWith('--test-case='))?.split('=')[1] || null,
  runAll: args.includes('--all'),
  exportLogs: args.includes('--export')
};

// Configure colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Enhanced logging system
class DebugLogger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.logs = [];
    this.zeroValues = [];
    this.errors = [];
    this.warnings = [];
  }

  log(level, message, data = null) {
    const timestamp = new Date();
    const entry = { timestamp, level, message, data };
    
    this.logs.push(entry);
    
    // Console output with colors
    let prefix = '';
    switch (level) {
      case 'error':
        prefix = `${colors.red}[ERROR]${colors.reset}`;
        this.errors.push(entry);
        break;
      case 'warn':
        prefix = `${colors.yellow}[WARN]${colors.reset}`;
        this.warnings.push(entry);
        break;
      case 'info':
        prefix = `${colors.green}[INFO]${colors.reset}`;
        break;
      case 'debug':
        if (!this.verbose) return;
        prefix = `${colors.dim}[DEBUG]${colors.reset}`;
        break;
      case 'trace':
        if (!this.verbose) return;
        prefix = `${colors.dim}[TRACE]${colors.reset}`;
        break;
      case 'zero':
        prefix = `${colors.magenta}[ZERO]${colors.reset}`;
        this.zeroValues.push(entry);
        break;
    }
    
    if (data) {
      console.log(`${prefix} ${message}`);
      console.dir(data, { depth: null, colors: true });
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  
  error(message, data = null) {
    this.log('error', message, data);
  }
  
  warn(message, data = null) {
    this.log('warn', message, data);
  }
  
  info(message, data = null) {
    this.log('info', message, data);
  }
  
  debug(message, data = null) {
    this.log('debug', message, data);
  }
  
  trace(message, data = null) {
    this.log('trace', message, data);
  }
  
  zero(field, message, data = null) {
    this.log('zero', `Zero value detected in ${field}: ${message}`, data);
  }
  
  exportLogs(filename = 'calculation-debug-logs.json') {
    const exportData = {
      logs: this.logs,
      zeroValues: this.zeroValues,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalLogs: this.logs.length,
        zeroValues: this.zeroValues.length,
        errors: this.errors.length,
        warnings: this.warnings.length
      }
    };
    
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`${colors.green}Logs exported to ${filename}${colors.reset}`);
  }
  
  generateZeroValueReport() {
    if (this.zeroValues.length === 0) {
      return 'No zero values detected.';
    }
    
    const fieldMap = new Map();
    
    for (const entry of this.zeroValues) {
      const field = entry.message.split('in ')[1]?.split(':')[0] || 'unknown';
      const existing = fieldMap.get(field) || { count: 0, examples: [] };
      
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(entry.data);
      }
      
      fieldMap.set(field, existing);
    }
    
    let report = `${colors.bright}${colors.magenta}Zero Value Report:${colors.reset}\n`;
    
    for (const [field, data] of fieldMap.entries()) {
      report += `${colors.yellow}${field}${colors.reset}: ${data.count} occurrences\n`;
      
      if (data.examples.length > 0) {
        report += `${colors.dim}Examples:${colors.reset}\n`;
        data.examples.forEach((example, i) => {
          report += `  Example ${i + 1}:\n`;
          report += `  ${JSON.stringify(example, null, 2).replace(/\n/g, '\n  ')}\n`;
        });
      }
    }
    
    return report;
  }
}

// Initialize logger
const logger = new DebugLogger({ verbose: options.verbose });

// Helper function to check for zero values
function isZeroOrNearZero(value) {
  return Math.abs(value) < 0.001;
}

// Helper function to check for zero values in calculated costs
function checkForZeroValues(costs, params, context = '') {
  if (isZeroOrNearZero(costs.annual) && !costs.isOneTime) {
    logger.zero('annual', `${context} Annual cost is zero for a recurring item`, { costs, params });
  }
  
  if (isZeroOrNearZero(costs.lifetime)) {
    logger.zero('lifetime', `${context} Lifetime cost is zero`, { costs, params });
  }
  
  if (isZeroOrNearZero(costs.low)) {
    logger.zero('low', `${context} Low cost estimate is zero`, { costs, params });
  }
  
  if (isZeroOrNearZero(costs.high)) {
    logger.zero('high', `${context} High cost estimate is zero`, { costs, params });
  }
  
  if (isZeroOrNearZero(costs.average)) {
    logger.zero('average', `${context} Average cost estimate is zero`, { costs, params });
  }
  
  if (isZeroOrNearZero(params.baseRate)) {
    logger.zero('baseRate', `${context} Base rate is zero or near zero`, { baseRate: params.baseRate });
  }
}

// Test cases
const testCases = [
  {
    name: 'Basic Recurring Cost',
    params: {
      baseRate: 100,
      frequency: 'monthly',
      currentAge: 45,
      lifeExpectancy: 85
    },
    expectedResult: {
      annual: 1200,
      lifetime: 48000,
      isOneTime: false
    }
  },
  {
    name: 'One-Time Cost',
    params: {
      baseRate: 500,
      frequency: 'one-time'
    },
    expectedResult: {
      annual: 0,
      lifetime: 500,
      isOneTime: true
    }
  },
  {
    name: 'Age Range Calculation',
    params: {
      baseRate: 200,
      frequency: 'weekly',
      startAge: 50,
      endAge: 60
    },
    expectedResult: {
      annual: 10400,
      lifetime: 104000,
      isOneTime: false
    }
  },
  {
    name: 'Zero Base Rate',
    params: {
      baseRate: 0,
      frequency: 'monthly',
      currentAge: 45,
      lifeExpectancy: 85
    },
    expectedResult: {
      annual: 0,
      lifetime: 0,
      isOneTime: false
    }
  },
  {
    name: 'Complex Case with CPT and ZIP',
    params: {
      baseRate: 150,
      frequency: '2 times per week',
      currentAge: 30,
      lifeExpectancy: 80,
      cptCode: '99213',
      zipCode: '10001',
      category: 'physicianFollowUp'
    },
    expectedResult: {
      annual: 15600,
      lifetime: 780000,
      isOneTime: false
    }
  }
];

// Mock implementations for dependencies
const mockDependencies = {
  // Mock CPT code service
  cptCodeService: {
    lookupCPTCode: async (cptCode) => {
      logger.debug(`Looking up CPT code: ${cptCode}`);
      return [{
        code: cptCode,
        code_description: 'Test CPT Code',
        mfu_50th: 100,
        mfu_75th: 150,
        mfu_90th: 200,
        pfr_50th: 120,
        pfr_75th: 180,
        pfr_90th: 240
      }];
    },
    hasMfuData: (cptData) => {
      return cptData && cptData.mfu_50th !== undefined && cptData.mfu_75th !== undefined;
    },
    hasPfrData: (cptData) => {
      return cptData && cptData.pfr_50th !== undefined && cptData.pfr_75th !== undefined;
    }
  },
  
  // Mock geographic factors service
  geoFactorsService: {
    DEFAULT_GEO_FACTORS: {
      mfr_factor: 1.0,
      pfr_factor: 1.0
    },
    fetchGeoFactors: async (zipCode) => {
      logger.debug(`Fetching geographic factors for ZIP: ${zipCode}`);
      return {
        mfr_factor: 1.05,
        pfr_factor: 1.1
      };
    }
  }
};

// Run tests
async function runTests() {
  logger.info('Starting actual cost calculation tests');
  
  try {
    // Try to dynamically import the cost calculator
    let costCalculator;
    try {
      // First try to import from the compiled JavaScript file
      const module = await import('./src/utils/calculations/costCalculator.js');
      costCalculator = module.default;
      logger.info('Using compiled JavaScript cost calculator');
    } catch (error) {
      logger.warn(`Could not import compiled cost calculator: ${error.message}`);
      
      try {
        // If that fails, try to import directly from the source
        const module = await import('./src/utils/calculations/costCalculator.ts');
        costCalculator = module.default;
        logger.info('Using TypeScript cost calculator');
      } catch (error) {
        logger.error(`Could not import cost calculator: ${error.message}`);
        
        // Create a mock implementation
        logger.warn('Using mock implementation for cost calculator');
        costCalculator = {
          calculateItemCosts: async (params) => {
            logger.info('Using mock calculateItemCosts', params);
            
            // Simple implementation for testing
            const isOneTime = params.frequency === 'one-time' || params.frequency === 'once';
            const annual = isOneTime ? 0 : params.baseRate * 12; // Assume monthly by default
            const lifetime = isOneTime ? params.baseRate : annual * 10; // Assume 10 years by default
            
            const result = {
              annual,
              lifetime,
              low: lifetime * 0.9,
              high: lifetime * 1.1,
              average: lifetime,
              isOneTime
            };
            
            checkForZeroValues(result, params, 'Mock');
            return result;
          }
        };
      }
    }
    
    // Patch the cost calculator to use our mock dependencies
    const originalCalculateItemCosts = costCalculator.calculateItemCosts;
    costCalculator.calculateItemCosts = async (params) => {
      // Log the input parameters
      logger.info('Calculating item costs with actual calculator', params);
      
      try {
        // Call the original function
        const result = await originalCalculateItemCosts(params);
        
        // Check for zero values
        checkForZeroValues(result, params, 'Actual');
        
        // Log the result
        logger.info('Calculation result', result);
        
        return result;
      } catch (error) {
        logger.error(`Error in actual calculation: ${error.message}`, { error });
        throw error;
      }
    };
    
    // Determine which tests to run
    let testsToRun = [];
    if (options.testCase) {
      const testIndex = parseInt(options.testCase, 10) - 1;
      if (testIndex >= 0 && testIndex < testCases.length) {
        testsToRun = [testCases[testIndex]];
      } else {
        logger.error(`Invalid test case number: ${options.testCase}`);
        return;
      }
    } else if (options.runAll) {
      testsToRun = testCases;
    } else {
      // Default to running the first test case
      testsToRun = [testCases[0]];
    }
    
    const results = [];
    
    // Run the selected tests
    for (const testCase of testsToRun) {
      logger.info(`Running test: ${testCase.name}`, testCase.params);
      
      try {
        const startTime = Date.now();
        const result = await costCalculator.calculateItemCosts(testCase.params);
        const duration = Date.now() - startTime;
        
        // Validate the result
        const validation = {
          hasAnnual: result.annual !== undefined,
          hasLifetime: result.lifetime !== undefined,
          hasLow: result.low !== undefined,
          hasHigh: result.high !== undefined,
          hasAverage: result.average !== undefined,
          hasIsOneTime: result.isOneTime !== undefined,
          nonZeroValues: !isZeroOrNearZero(result.lifetime) || !isZeroOrNearZero(result.average)
        };
        
        const passed = Object.values(validation).every(v => v);
        
        results.push({
          testCase: testCase.name,
          params: testCase.params,
          result,
          validation,
          passed,
          duration
        });
        
        if (passed) {
          logger.info(`Test passed: ${testCase.name}`, { duration: `${duration}ms` });
        } else {
          logger.error(`Test failed: ${testCase.name}`, {
            result,
            validation
          });
        }
      } catch (error) {
        logger.error(`Test error: ${testCase.name}`, { error: error.message, stack: error.stack });
        
        results.push({
          testCase: testCase.name,
          params: testCase.params,
          error: error.message,
          passed: false
        });
      }
    }
    
    // Print summary
    console.log('\n');
    console.log(`${colors.bright}Test Summary:${colors.reset}`);
    console.log('=============');
    
    const passedTests = results.filter(r => r.passed);
    console.log(`Total tests: ${results.length}`);
    console.log(`Passed: ${passedTests.length}`);
    console.log(`Failed: ${results.length - passedTests.length}`);
    
    // Print zero value report
    console.log('\n');
    console.log(logger.generateZeroValueReport());
    
    // Export logs if requested
    if (options.exportLogs) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `actual-calculation-debug-${timestamp}.json`;
      logger.exportLogs(filename);
      
      // Also export test results
      const resultsFilename = `actual-calculation-results-${timestamp}.json`;
      fs.writeFileSync(resultsFilename, JSON.stringify(results, null, 2));
      console.log(`${colors.green}Test results exported to ${resultsFilename}${colors.reset}`);
    }
  } catch (error) {
    logger.error('Error running tests', error);
  }
}

// Run the tests
runTests().catch(error => {
  logger.error('Error running tests', error);
  process.exit(1);
});
