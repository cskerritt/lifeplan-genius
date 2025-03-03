# Browser Testing Guide

This guide provides information about the browser-based testing framework implemented in this project, including how to run tests, use the interactive UI mode, and troubleshoot common issues.

## Overview

The project uses Playwright for browser-based testing, with enhanced features:

- **Enhanced Test Runner**: Detailed progress reporting, multiple test types, and flexible server options
- **Interactive UI Mode**: Visual interface for running and debugging tests
- **Development Server Script**: Easily start the development server separately
- **Logging System**: Custom logger with different log levels
- **Utility Scripts**: Tools for managing ports and processes

## Scripts

### Test Runner Script (`run-playwright-tests.sh`)

This script provides a convenient way to run Playwright tests with different options:

```bash
# Run all tests
./run-playwright-tests.sh all

# Run specific test types
./run-playwright-tests.sh auth
./run-playwright-tests.sh plan
./run-playwright-tests.sh visual
./run-playwright-tests.sh a11y
./run-playwright-tests.sh examples

# Run with different logging levels
./run-playwright-tests.sh examples --verbose
./run-playwright-tests.sh examples --debug

# Run without starting the server (if already running)
./run-playwright-tests.sh examples --no-server
```

### Development Server Script (`start-dev-server.sh`)

This script starts the development server for the application:

```bash
# Start both frontend and API servers
./start-dev-server.sh all

# Start only the frontend server
./start-dev-server.sh frontend

# Start only the API server
./start-dev-server.sh api
```

### Port Process Killer Script (`kill-port.sh`)

This script finds and terminates processes using a specified port:

```bash
# Kill processes using port 3002
./kill-port.sh 3002

# Kill processes using port 5173
./kill-port.sh 5173
```

## Interactive UI Mode

Playwright provides an interactive UI for running and debugging tests:

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

## Recommended Workflow

For the most efficient testing workflow:

1. Start the development server:
   ```bash
   ./start-dev-server.sh all
   ```

2. In a separate terminal, run the tests with UI mode:
   ```bash
   ./run-playwright-tests.sh ui --no-server
   ```

3. Use the Playwright UI to:
   - Browse test files in the left panel
   - Run individual tests by clicking on them
   - Watch test execution in real-time
   - Debug tests with the time-travel debugger
   - Explore and test selectors

This workflow gives you the most flexibility and control over the testing process.

## Troubleshooting

### Port Already in Use

If you see an error like:
```
Error: listen EADDRINUSE: address already in use :::3002
```

Use the `kill-port.sh` script to terminate the process using that port:
```bash
./kill-port.sh 3002
```

This script will:
1. Find all processes using the specified port
2. Display information about these processes
3. Ask for confirmation before killing them
4. Terminate the processes if confirmed

### Server Not Starting

If the server fails to start:

1. Check if there are any processes already using the required ports:
   ```bash
   ./kill-port.sh 3002  # API server port
   ./kill-port.sh 5173  # Frontend server port
   ```

2. Try starting only the frontend server:
   ```bash
   ./start-dev-server.sh frontend
   ```

3. Run tests without starting the server:
   ```bash
   ./run-playwright-tests.sh all --no-server
   ```

### Tests Failing

If tests are failing:

1. Run with debug logging to see more detailed information:
   ```bash
   ./run-playwright-tests.sh all --debug
   ```

2. Use the UI mode to debug specific tests:
   ```bash
   ./run-playwright-tests.sh ui
   ```

3. Check if the server is running correctly:
   ```bash
   ./start-dev-server.sh all
   ```

## Test Types

The framework supports different types of tests:

- **Authentication Tests**: Login, logout, password reset, registration
- **Plan Tests**: Creating, editing, deleting, and viewing plans
- **Accessibility Tests**: ARIA attributes, keyboard navigation, color contrast
- **Visual Tests**: Component rendering, layout consistency, responsive design
- **Example Tests**: Demonstrating logging functionality

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings include:

- **Test Directory**: `./tests/e2e`
- **Timeout**: 30 seconds
- **Retries**: 2 in CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Web Server**: Starts the development server before running tests
- **Base URL**: `http://localhost:8082` (current frontend port)

Note that the frontend server may run on different ports (8080, 8081, 8082, etc.) depending on port availability. If you encounter connection errors, check the terminal output for the actual port being used and update the `baseURL` and `url` properties in `playwright.config.ts` accordingly.

## Additional Resources

For more information, see:
- [Playwright Testing Documentation](./PLAYWRIGHT_TESTING.md)
- [End-to-End Tests README](./tests/e2e/README.md)
