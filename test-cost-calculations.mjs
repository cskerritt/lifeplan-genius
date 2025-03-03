/**
 * Comprehensive test runner for cost calculations
 * 
 * This script runs a comprehensive test suite for cost calculations,
 * testing all combinations of service types and frequencies to ensure
 * there are no bugs or errors in the calculations.
 * 
 * Usage:
 * node test-cost-calculations.mjs [--all] [--report]
 * 
 * Options:
 *   --all     Test all combinations (may take longer)
 *   --report  Generate a detailed HTML report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runTests } from './src/utils/calculations/__tests__/runComprehensiveTests.mjs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const useAllCombinations = args.includes('--all');
const generateReport = args.includes('--report');

console.log('Starting comprehensive cost calculation tests...');
console.log(`Testing ${useAllCombinations ? 'all' : 'representative'} combinations`);

runTests(useAllCombinations)
  .then(results => {
    if (generateReport) {
      // Generate HTML report
      const reportPath = path.join(__dirname, 'cost-calculation-test-report.html');
      const reportContent = generateHtmlReport(results);
      fs.writeFileSync(reportPath, reportContent);
      console.log(`\nReport generated: ${reportPath}`);
    }
    
    process.exit(results.failedTests > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });

/**
 * Generate HTML report
 */
function generateHtmlReport(results) {
  const { passedTests, failedTests, total, failures } = results;
  
  const passPercentage = Math.round((passedTests / total) * 100);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cost Calculation Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #333;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .summary-box {
      padding: 20px;
      border-radius: 5px;
      text-align: center;
      flex: 1;
      margin: 0 10px;
    }
    .passed {
      background-color: #d4edda;
      color: #155724;
    }
    .failed {
      background-color: #f8d7da;
      color: #721c24;
    }
    .total {
      background-color: #e2e3e5;
      color: #383d41;
    }
    .progress-bar {
      height: 30px;
      background-color: #e9ecef;
      border-radius: 5px;
      margin-bottom: 30px;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background-color: #28a745;
      text-align: center;
      line-height: 30px;
      color: white;
    }
    .failure {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .failure h3 {
      margin-top: 0;
    }
    .params {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    .timestamp {
      color: #6c757d;
      font-size: 0.9em;
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <h1>Cost Calculation Test Report</h1>
  
  <div class="summary">
    <div class="summary-box passed">
      <h2>${passedTests}</h2>
      <p>Passed Tests</p>
    </div>
    <div class="summary-box failed">
      <h2>${failedTests}</h2>
      <p>Failed Tests</p>
    </div>
    <div class="summary-box total">
      <h2>${total}</h2>
      <p>Total Tests</p>
    </div>
  </div>
  
  <div class="progress-bar">
    <div class="progress" style="width: ${passPercentage}%">
      ${passPercentage}% Passed
    </div>
  </div>
  
  ${failures.length > 0 ? `
  <h2>Failures (${failures.length})</h2>
  
  ${failures.map((failure, index) => `
  <div class="failure">
    <h3>${index + 1}. ${failure.testCase.name}</h3>
    <p><strong>Error:</strong> ${failure.error}</p>
    <div class="params">
      <pre>${JSON.stringify(failure.testCase.params, null, 2)}</pre>
    </div>
  </div>
  `).join('')}
  ` : `
  <h2>All tests passed successfully!</h2>
  <p>No failures were detected in the test suite.</p>
  `}
  
  <p class="timestamp">Report generated on ${new Date().toLocaleString()}</p>
</body>
</html>`;
}
