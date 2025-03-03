# End-to-End Tests

This directory contains end-to-end tests for the application using Playwright. These tests simulate real user interactions with the application in a browser environment.

## Directory Structure

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

## Running Tests

Tests can be run using the `run-playwright-tests.sh` script in the project root:

```bash
# Run all tests
./run-playwright-tests.sh all

# Run specific test types
./run-playwright-tests.sh auth
./run-playwright-tests.sh plan
./run-playwright-tests.sh a11y
./run-playwright-tests.sh visual
./run-playwright-tests.sh examples

# Run with different logging levels
./run-playwright-tests.sh examples --verbose
./run-playwright-tests.sh examples --debug

# Run without starting the web server (if already running)
./run-playwright-tests.sh examples --no-server
```

### Interactive UI Mode

For a more visual and interactive testing experience, you can use Playwright's UI mode:

```bash
# Start UI mode with automatic server startup
./run-playwright-tests.sh ui

# Start UI mode without starting the server (if already running)
./run-playwright-tests.sh ui --no-server
```

This opens a browser window with Playwright's UI, which provides:

- A visual test explorer showing all test files and test cases
- The ability to run individual tests by clicking on them
- Real-time test execution in a browser window
- Detailed test results with screenshots and traces
- A time-travel debugger to step through test execution
- Tools for exploring and testing selectors

The UI mode is especially helpful when:
- Developing new tests
- Debugging failing tests
- Learning how the tests interact with your application
- Sharing test results with team members

### Server Options

By default, the test runner will start the development server before running tests. If you already have the server running (for example, if you're actively developing the application), you can use the `--no-server` option to skip starting the server:

```bash
# Run tests without starting the server
./run-playwright-tests.sh all --no-server
```

This can be useful to:
- Speed up test execution when the server is already running
- Avoid port conflicts if the server is already running on the default port
- Test against a custom server configuration that you've started manually

## Test Types

### Authentication Tests

Tests for user authentication flows:
- Login
- Logout
- Password reset
- Registration

### Plan Tests

Tests for plan-related functionality:
- Creating plans
- Editing plans
- Deleting plans
- Viewing plan details

### Accessibility Tests

Tests for accessibility compliance:
- ARIA attributes
- Keyboard navigation
- Color contrast
- Screen reader compatibility

### Visual Tests

Tests for visual regression:
- Component rendering
- Layout consistency
- Responsive design

### Example Tests

Example tests demonstrating the logging functionality:
- Different log levels
- Page navigation
- Element interactions

## Page Objects

Page objects encapsulate page-specific logic and provide a higher-level API for interacting with pages:

### BasePage

The `BasePage` class provides common functionality for all page objects:
- Waiting for page load
- Getting page title
- Checking headings
- Taking screenshots
- Navigation
- Element interactions

### LoginPage

The `LoginPage` class handles authentication-related functionality:
- Logging in
- Logging out
- Resetting password
- Registering new users

### PlanPage

The `PlanPage` class handles plan-related functionality:
- Creating plans
- Editing plans
- Deleting plans
- Viewing plan details

## Utilities

### Logger

The `logger` utility provides logging functionality with different log levels:
- DEBUG: Detailed debug information
- INFO: General information
- WARN: Warning messages
- ERROR: Error messages

Example usage:

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

### Test Utilities

The `test-utils` module provides common test utilities:
- Waiting for network requests to complete
- Filling forms
- Getting random data
- Formatting and parsing currency
- Checking element visibility
- Getting text content

Example usage:

```typescript
import { waitForNetworkIdle, fillForm, getRandomEmail } from '../utils/test-utils';

// Wait for network requests to complete
await waitForNetworkIdle(page);

// Fill a form
await fillForm(page, {
  '#name': 'John Doe',
  '#email': getRandomEmail(),
  '#message': 'Hello, world!'
});
```

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

### Test Fixtures

Test fixtures can be used to set up test environments:

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login-page';

// Define a fixture for authenticated tests
const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('username', 'password');
    await use(page);
  },
});

// Use the fixture in tests
test('should access protected page', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/protected');
  // Test protected page functionality
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

If tests are failing, check the following:

1. **Selectors**: Make sure selectors are correct and unique
2. **Timing**: Use `waitForNetworkIdle` or other waiting mechanisms
3. **Environment**: Make sure the application is running and accessible
4. **Logging**: Increase the logging level to see more detailed information

For more information, see the [Playwright Testing Documentation](../../PLAYWRIGHT_TESTING.md).
