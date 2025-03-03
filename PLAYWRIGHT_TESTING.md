# Playwright Testing Framework

This document provides an overview of the Playwright testing framework implemented in this project, which enables browser-based testing with enhanced logging capabilities.

## Overview

Playwright is a powerful browser automation library that allows you to write end-to-end tests that run in real browsers. Our implementation includes:

1. **Page Object Model**: A structured approach to organizing test code
2. **Enhanced Logging**: Detailed logging of test execution and progress
3. **Test Runner Script**: A convenient script for running different types of tests
4. **Test Utilities**: Helper functions for common testing tasks

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

The Playwright dependencies are already installed in the project. If you need to reinstall them, run:

```bash
npm install -D @playwright/test
npx playwright install
```

## Running Tests

Use the `run-playwright-tests.sh` script to run tests:

```bash
# Make the script executable (if not already)
chmod +x run-playwright-tests.sh

# Run all tests
./run-playwright-tests.sh all

# Run example tests with logging
./run-playwright-tests.sh examples

# Run authentication tests
./run-playwright-tests.sh auth

# Run plan tests
./run-playwright-tests.sh plan

# Run accessibility tests
./run-playwright-tests.sh a11y

# Run visual tests
./run-playwright-tests.sh visual
```

### Interactive UI Mode

Playwright provides an interactive UI for running and debugging tests. This gives you a visual interface to:

- See all your tests in a tree view
- Run individual tests or groups of tests
- Watch test execution in real-time
- View test results with screenshots
- Debug tests step by step
- Explore locators and selectors

To use the UI mode:

```bash
# Start UI mode with automatic server startup
./run-playwright-tests.sh ui

# Start UI mode without starting the server (if already running)
./run-playwright-tests.sh ui --no-server
```

This will open a browser window with the Playwright UI, where you can:

1. Browse the test files in the left panel
2. Click on tests to run them individually
3. Use the "Run all" button to run all tests
4. See test results, including screenshots and traces
5. Use the time travel debugger to step through test execution

The UI mode is particularly useful for:
- Developing new tests
- Debugging failing tests
- Understanding test flow
- Exploring the application under test

### Logging Options

The script supports different logging levels:

```bash
# Run with default logging (minimal output)
./run-playwright-tests.sh examples

# Run with verbose logging (INFO level)
./run-playwright-tests.sh examples --verbose

# Run with debug logging (DEBUG level - most detailed)
./run-playwright-tests.sh examples --debug
```

## Project Structure

```
tests/e2e/
├── fixtures/       # Test fixtures for setting up test environments
├── pages/          # Page objects representing pages in the application
├── specs/          # Test specifications organized by feature
│   ├── accessibility/  # Accessibility tests
│   ├── auth/           # Authentication tests
│   ├── examples/       # Example tests demonstrating logging
│   ├── plan/           # Plan-related tests
│   └── visual/         # Visual regression tests
└── utils/          # Utility functions and helpers
    ├── logger.ts   # Logging utility
    └── test-utils.ts # Common test utilities
```

## Page Object Model

The Page Object Model (POM) is a design pattern that creates an object repository for web UI elements. It helps in reducing code duplication and improves test maintenance.

### Base Page

The `BasePage` class (`tests/e2e/pages/base-page.ts`) provides common functionality for all page objects:

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../utils/logger';

export class BasePage {
  readonly page: Page;
  readonly heading: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    logger.info(`Initialized ${this.constructor.name}`);
  }
  
  async waitForPageLoad() {
    logger.debug(`Waiting for page to load: ${await this.page.url()}`);
    await this.page.waitForLoadState('networkidle');
    logger.debug('Page loaded');
  }
  
  // ... other common methods
}
```

### Specific Page Objects

Specific page objects extend the `BasePage` class:

- `LoginPage`: Handles authentication-related functionality
- `PlanPage`: Handles plan-related functionality

## Logging System

The logging system (`tests/e2e/utils/logger.ts`) provides different log levels and colorized output:

```typescript
import { logger, LogLevel } from '../utils/logger';

// Set log level
logger.setLogLevel(LogLevel.DEBUG);

// Log at different levels
logger.debug('Detailed debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message');
```

## Test Runner Script

The `run-playwright-tests.sh` script provides a convenient way to run tests with different options:

- Different test types (all, auth, plan, visual, a11y, examples)
- Different logging levels (default, verbose, debug)
- Progress reporting during test execution
- Test summary after completion

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { logger } from '../utils/logger';

test.describe('Authentication', () => {
  test('should log in successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    logger.info('Navigating to login page');
    await loginPage.navigate();
    
    logger.info('Filling login form');
    await loginPage.login('username', 'password');
    
    logger.info('Verifying successful login');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Using Test Utilities

```typescript
import { test, expect } from '@playwright/test';
import { waitForNetworkIdle, fillForm } from '../utils/test-utils';

test('should submit a form', async ({ page }) => {
  await page.goto('/form');
  
  // Fill form fields
  await fillForm(page, {
    '#name': 'John Doe',
    '#email': 'john@example.com',
    '#message': 'Hello, world!'
  });
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for network requests to complete
  await waitForNetworkIdle(page);
  
  // Verify submission
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Best Practices

1. **Use Page Objects**: Encapsulate page-specific logic in page objects
2. **Log Appropriately**: Use the right log level for different types of information
3. **Use Test Utilities**: Leverage the utility functions for common tasks
4. **Organize Tests**: Keep tests organized by feature or functionality
5. **Keep Tests Independent**: Each test should be able to run independently
6. **Use Descriptive Test Names**: Test names should clearly describe what they're testing
7. **Handle Asynchronous Operations**: Use `await` for all asynchronous operations
8. **Clean Up After Tests**: Use `test.afterEach` or `test.afterAll` to clean up resources

## Troubleshooting

### Common Issues

1. **Tests Failing Intermittently**: This might be due to timing issues. Try using `waitForNetworkIdle` or other waiting mechanisms.
2. **Selectors Not Working**: Check if the selectors are correct and unique. Use the Playwright Inspector to debug.
3. **Screenshots Not Being Saved**: Make sure the screenshots directory exists and is writable.

### Debugging Tips

1. **Use the Playwright Inspector**: Run tests with the `--debug` flag to use the Playwright Inspector.
2. **Increase Logging Level**: Run tests with the `--debug` flag to see more detailed logs.
3. **Take Screenshots**: Use `page.screenshot()` to take screenshots at specific points in the test.
4. **Check Console Logs**: Use `page.on('console', msg => console.log(msg.text()))` to see browser console logs.

## Extending the Framework

### Adding New Page Objects

1. Create a new file in the `tests/e2e/pages` directory
2. Extend the `BasePage` class
3. Add page-specific methods and properties

### Adding New Test Utilities

1. Add new functions to `tests/e2e/utils/test-utils.ts`
2. Make sure they're properly typed and documented
3. Import and use them in your tests

### Adding New Test Types

1. Create a new directory in `tests/e2e/specs`
2. Add test files with the `.spec.ts` extension
3. Update the `run-playwright-tests.sh` script to include the new test type
