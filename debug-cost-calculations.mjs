/**
 * Comprehensive Cost Calculation Debugging and Testing Script
 * 
 * This script provides a way to test and debug cost calculations without using the browser.
 * It includes detailed logging, zero value detection, and comprehensive test cases.
 * 
 * Usage:
 * node debug-cost-calculations.mjs [options]
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

// Mock implementation of the calculation system
class CostCalculator {
  constructor(logger) {
    this.logger = logger;
  }
  
  isZeroOrNearZero(value) {
    return Math.abs(value) < 0.001;
  }
  
  checkForZeroValues(costs, params, context = '') {
    if (this.isZeroOrNearZero(costs.annual) && !costs.isOneTime) {
      this.logger.zero('annual', `${context} Annual cost is zero for a recurring item`, { costs, params });
    }
    
    if (this.isZeroOrNearZero(costs.lifetime)) {
      this.logger.zero('lifetime', `${context} Lifetime cost is zero`, { costs, params });
    }
    
    if (this.isZeroOrNearZero(costs.low)) {
      this.logger.zero('low', `${context} Low cost estimate is zero`, { costs, params });
    }
    
    if (this.isZeroOrNearZero(costs.high)) {
      this.logger.zero('high', `${context} High cost estimate is zero`, { costs, params });
    }
    
    if (this.isZeroOrNearZero(costs.average)) {
      this.logger.zero('average', `${context} Average cost estimate is zero`, { costs, params });
    }
    
    if (this.isZeroOrNearZero(params.baseRate)) {
      this.logger.zero('baseRate', `${context} Base rate is zero or near zero`, { baseRate: params.baseRate });
    }
  }
  
  parseFrequency(frequencyStr) {
    this.logger.debug('Parsing frequency', { frequency: frequencyStr });
    
    // Default values
    const result = {
      lowFrequency: 0,
      highFrequency: 0,
      isOneTime: false,
      original: frequencyStr,
      valid: true
    };
    
    // Check for one-time frequencies
    if (['one-time', 'once', 'one time', 'single'].includes(frequencyStr.toLowerCase())) {
      result.isOneTime = true;
      return result;
    }
    
    // Parse recurring frequencies
    if (frequencyStr.includes('daily')) {
      result.lowFrequency = 365;
      result.highFrequency = 365;
    } else if (frequencyStr.includes('weekly')) {
      result.lowFrequency = 52;
      result.highFrequency = 52;
    } else if (frequencyStr.includes('monthly')) {
      result.lowFrequency = 12;
      result.highFrequency = 12;
    } else if (frequencyStr.includes('quarterly')) {
      result.lowFrequency = 4;
      result.highFrequency = 4;
    } else if (frequencyStr.includes('annually') || frequencyStr.includes('yearly')) {
      result.lowFrequency = 1;
      result.highFrequency = 1;
    } else {
      // Try to extract numbers
      const numbers = frequencyStr.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const num = parseInt(numbers[0], 10);
        if (!isNaN(num)) {
          if (frequencyStr.includes('per year') || frequencyStr.includes('yearly')) {
            result.lowFrequency = num;
            result.highFrequency = num;
          } else if (frequencyStr.includes('per month') || frequencyStr.includes('monthly')) {
            result.lowFrequency = num * 12;
            result.highFrequency = num * 12;
          } else if (frequencyStr.includes('per week') || frequencyStr.includes('weekly')) {
            result.lowFrequency = num * 52;
            result.highFrequency = num * 52;
          } else if (frequencyStr.includes('per day') || frequencyStr.includes('daily')) {
            result.lowFrequency = num * 365;
            result.highFrequency = num * 365;
          } else {
            // Default to per year if unit not specified
            result.lowFrequency = num;
            result.highFrequency = num;
          }
        }
      } else {
        result.valid = false;
        result.error = `Could not parse frequency: ${frequencyStr}`;
      }
    }
    
    this.logger.debug('Parsed frequency result', result);
    return result;
  }
  
  calculateDuration(params) {
    this.logger.debug('Calculating duration', params);
    
    let lowDuration = 0;
    let highDuration = 0;
    let source = 'default';
    
    // If start and end ages are provided, use those
    if (params.startAge !== undefined && params.endAge !== undefined) {
      lowDuration = params.endAge - params.startAge;
      highDuration = lowDuration;
      source = 'age-range';
    } 
    // Otherwise, use current age and life expectancy
    else if (params.currentAge !== undefined && params.lifeExpectancy !== undefined) {
      lowDuration = params.lifeExpectancy - params.currentAge;
      highDuration = lowDuration;
      source = 'frequency';
    }
    // Default to 30 years if no age information is provided
    else {
      lowDuration = 30;
      highDuration = 30;
    }
    
    // Ensure duration is not negative
    lowDuration = Math.max(0, lowDuration);
    highDuration = Math.max(0, highDuration);
    
    const result = {
      lowDuration,
      highDuration,
      source,
      valid: true
    };
    
    this.logger.debug('Duration calculation result', result);
    return result;
  }
  
  async calculateItemCosts(params) {
    this.logger.info('Calculating item costs', params);
    
    try {
      // Parse frequency
      const parsedFrequency = this.parseFrequency(params.frequency);
      if (!parsedFrequency.valid) {
        throw new Error(`Failed to parse frequency: ${parsedFrequency.error}`);
      }
      
      // Calculate duration
      const parsedDuration = this.calculateDuration(params);
      if (!parsedDuration.valid) {
        throw new Error(`Failed to parse duration: ${parsedDuration.error}`);
      }
      
      // Calculate costs
      let annual = 0;
      let lifetime = 0;
      let low = 0;
      let high = 0;
      let average = 0;
      
      if (parsedFrequency.isOneTime) {
        // One-time costs
        this.logger.debug('Calculating one-time costs');
        
        annual = 0; // One-time items have no annual cost
        lifetime = params.baseRate;
        low = params.baseRate * 0.9;
        high = params.baseRate * 1.1;
        average = params.baseRate;
      } else {
        // Recurring costs
        this.logger.debug('Calculating recurring costs');
        
        // Calculate annual cost
        annual = params.baseRate * parsedFrequency.lowFrequency;
        
        // Calculate lifetime cost
        lifetime = annual * parsedDuration.lowDuration;
        
        // Calculate cost range
        low = lifetime * 0.9;
        high = lifetime * 1.1;
        average = lifetime;
      }
      
      // Apply geographic factors if available
      if (params.zipCode) {
        this.logger.debug('Applying geographic factors', { zipCode: params.zipCode });
        // Mock implementation - in a real system, this would look up actual factors
        const geoFactor = 1.05; // 5% increase for this ZIP code
        low *= geoFactor;
        high *= geoFactor;
        average *= geoFactor;
        lifetime *= geoFactor;
      }
      
      // Apply CPT code adjustments if available
      if (params.cptCode) {
        this.logger.debug('Applying CPT code adjustments', { cptCode: params.cptCode });
        // Mock implementation - in a real system, this would look up actual CPT code data
        // For testing, we'll simulate a CPT code that reduces costs by 10%
        const cptFactor = 0.9;
        low *= cptFactor;
        high *= cptFactor;
        average *= cptFactor;
        lifetime *= cptFactor;
      }
      
      // Round to 2 decimal places
      const roundToTwoDecimals = (num) => {
        return new Decimal(num).toDP(2).toNumber();
      };
      
      const result = {
        annual: roundToTwoDecimals(annual),
        lifetime: roundToTwoDecimals(lifetime),
        low: roundToTwoDecimals(low),
        high: roundToTwoDecimals(high),
        average: roundToTwoDecimals(average),
        isOneTime: parsedFrequency.isOneTime
      };
      
      // Check for zero values
      this.checkForZeroValues(result, params);
      
      this.logger.info('Calculation completed successfully', result);
      return result;
    } catch (error) {
      this.logger.error(`Error in calculation: ${error.message}`, { error });
      
      // Return fallback values
      const fallback = {
        annual: 0,
        lifetime: 0,
        low: 0,
        high: 0,
        average: 0,
        isOneTime: false
      };
      
      this.logger.warn('Using fallback zero values due to error', fallback);
      return fallback;
    }
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
      zipCode: '10001'
    },
    expectedResult: {
      annual: 15600,
      lifetime: 780000,
      isOneTime: false
    }
  }
];

// Run tests
async function runTests() {
  const calculator = new CostCalculator(logger);
  const results = [];
  
  logger.info('Starting cost calculation tests');
  
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
  
  // Run the selected tests
  for (const testCase of testsToRun) {
    logger.info(`Running test: ${testCase.name}`, testCase.params);
    
    const startTime = Date.now();
    const result = await calculator.calculateItemCosts(testCase.params);
    const duration = Date.now() - startTime;
    
    // Validate the result
    const validation = {
      annual: Math.abs(result.annual - testCase.expectedResult.annual) < 0.01,
      lifetime: Math.abs(result.lifetime - testCase.expectedResult.lifetime) < 0.01,
      isOneTime: result.isOneTime === testCase.expectedResult.isOneTime
    };
    
    const passed = Object.values(validation).every(v => v);
    
    results.push({
      testCase: testCase.name,
      params: testCase.params,
      result,
      expected: testCase.expectedResult,
      validation,
      passed,
      duration
    });
    
    if (passed) {
      logger.info(`Test passed: ${testCase.name}`, { duration: `${duration}ms` });
    } else {
      logger.error(`Test failed: ${testCase.name}`, {
        expected: testCase.expectedResult,
        actual: result,
        validation
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
    const filename = `calculation-debug-${timestamp}.json`;
    logger.exportLogs(filename);
    
    // Also export test results
    const resultsFilename = `calculation-results-${timestamp}.json`;
    fs.writeFileSync(resultsFilename, JSON.stringify(results, null, 2));
    console.log(`${colors.green}Test results exported to ${resultsFilename}${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  logger.error('Error running tests', error);
  process.exit(1);
});
