# Interactive Calculation Debugger

## Overview

The Interactive Calculation Debugger is a browser-based tool designed to help you visualize, debug, and understand the calculation process in the LifePlan Genius application. Unlike Playwright tests which run headlessly, this tool provides a real-time, interactive interface where you can:

- See each step of the calculation process
- Inspect intermediate values
- Set breakpoints at specific calculation steps
- Compare expected vs. actual results
- Modify input parameters and see how they affect the calculation

This tool is particularly useful for identifying where calculations might not be working as intended, as it provides complete visibility into the calculation process.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Running the Debugger

To start the Interactive Calculation Debugger, run the following command from the project root:

```bash
node open-interactive-debugger.mjs
```

This will:
1. Start a local HTTP server on port 3000
2. Open your default web browser to the debugger interface

If your browser doesn't open automatically, you can manually navigate to:
```
http://localhost:3000
```

## Using the Debugger

### Interface Overview

The debugger interface is divided into two main sections:

1. **Left Panel**: Input parameters and debugging controls
2. **Right Panel**: Visualization, state inspector, result comparison, and code view

### Input Parameters

The left panel allows you to set various calculation parameters:

- **Base Rate**: The base cost rate for the calculation
- **Frequency**: How often the service occurs (daily, weekly, monthly, etc.)
- **Current Age**: The current age of the evaluee
- **Life Expectancy**: The expected lifespan of the evaluee
- **Start Age**: (Optional) When the service starts (defaults to current age)
- **End Age**: (Optional) When the service ends (defaults to life expectancy)
- **Category**: The category of the service
- **CPT Code**: (Optional) The CPT code for medical services
- **ZIP Code**: (Optional) The ZIP code for geographic adjustment factors
- **Age Increments**: (Optional) Age-based adjustment factors

### Debugging Controls

The debugging controls allow you to:

- **Enable Breakpoints**: Set breakpoints at specific calculation steps
- **Show Intermediate Values**: Display intermediate calculation values
- **Step-by-Step Execution**: Execute the calculation one step at a time
- **Execution Speed**: Control the speed of step-by-step execution
- **Continue**: Continue execution after a breakpoint
- **Step**: Execute the next step in the calculation

### Visualization Tabs

The right panel contains several tabs:

- **Visualization**: Shows the calculation steps and results
- **State Inspector**: Displays the current state of the calculation
- **Result Comparison**: Compares expected vs. actual results
- **Code View**: Shows the code being executed

## Common Debugging Scenarios

### Scenario 1: Identifying Calculation Errors

1. Enter the parameters that are causing the calculation error
2. Click "Run Calculation"
3. Review each step in the calculation process
4. Look for unexpected values or error messages
5. Use the State Inspector to examine the calculation state at each step

### Scenario 2: Comparing Different Calculation Strategies

1. Run a calculation with one set of parameters
2. Note the results
3. Modify the parameters to use a different calculation strategy
4. Run the calculation again
5. Compare the results to identify differences

### Scenario 3: Debugging Age Increments

1. Enable age increments
2. Add multiple age increment ranges with different adjustment factors
3. Run the calculation
4. Review the "Apply Age Increments" step to see how each increment affects the total cost

### Scenario 4: Step-by-Step Debugging

1. Enable "Step-by-Step Execution"
2. Run the calculation
3. Use the "Step" button to move through each calculation step
4. Review the state at each step
5. Set breakpoints at specific steps to pause execution

## Troubleshooting

### Module Import Errors

If you encounter module import errors, ensure that:

1. You're using the `.mjs` file extension for ES modules
2. The import paths in the code match your project structure
3. You're running the debugger from the project root directory

### Server Port Already in Use

If port 3000 is already in use, you can modify the `PORT` constant in `open-interactive-debugger.mjs` to use a different port.

### Missing Calculation Steps

If you're not seeing all calculation steps, check that:

1. The calculation is completing successfully
2. You've enabled "Show Intermediate Values"
3. The calculation strategy is correctly implemented

## Extending the Debugger

The Interactive Calculation Debugger is designed to be extensible. You can:

1. Add new calculation strategies to the `CostCalculationStrategyFactory`
2. Implement additional validation rules
3. Add more visualization options
4. Extend the state inspector with custom views

## Comparison with Other Testing Methods

| Feature | Interactive Debugger | Playwright | Jest Unit Tests |
|---------|---------------------|------------|-----------------|
| Visual feedback | ✅ | ❌ (headless) | ❌ |
| Real-time interaction | ✅ | ❌ | ❌ |
| Step-by-step execution | ✅ | ❌ | ❌ |
| Breakpoints | ✅ | ❌ | ✅ (with debugger) |
| State inspection | ✅ | ❌ | ✅ (with debugger) |
| Automated testing | ❌ | ✅ | ✅ |
| CI/CD integration | ❌ | ✅ | ✅ |

The Interactive Calculation Debugger complements your existing testing methods by providing a visual, interactive way to debug calculations that's not possible with Playwright or Jest alone.
