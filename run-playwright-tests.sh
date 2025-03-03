#!/bin/bash

# Run Playwright tests script
# This script provides a convenient way to run Playwright tests with different options

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Display header
echo -e "${BLUE}${BOLD}=================================${NC}"
echo -e "${BLUE}${BOLD}   Playwright Test Runner        ${NC}"
echo -e "${BLUE}${BOLD}=================================${NC}"

# Default log level and server flag
LOG_LEVEL="info"
START_SERVER=true

# Function to display usage
function show_usage {
  echo -e "${YELLOW}${BOLD}Usage:${NC}"
  echo -e "  ./run-playwright-tests.sh [option] [--verbose|--debug] [--no-server]"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Options:${NC}"
  echo -e "  ${GREEN}all${NC}          Run all tests"
  echo -e "  ${GREEN}ui${NC}           Run tests with UI"
  echo -e "  ${GREEN}debug${NC}        Run tests in debug mode"
  echo -e "  ${GREEN}report${NC}       Show test report"
  echo -e "  ${GREEN}visual${NC}       Run only visual tests"
  echo -e "  ${GREEN}a11y${NC}         Run only accessibility tests"
  echo -e "  ${GREEN}auth${NC}         Run only authentication tests"
  echo -e "  ${GREEN}plan${NC}         Run only plan tests"
  echo -e "  ${GREEN}examples${NC}     Run example tests with logging"
  echo -e "  ${GREEN}help${NC}         Show this help message"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Logging Options:${NC}"
  echo -e "  ${GREEN}--verbose${NC}    Show more detailed logs (INFO level)"
  echo -e "  ${GREEN}--debug${NC}      Show all logs including debug messages"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Server Options:${NC}"
  echo -e "  ${GREEN}--no-server${NC}  Don't start the web server (use if already running)"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Examples:${NC}"
  echo -e "  ./run-playwright-tests.sh all"
  echo -e "  ./run-playwright-tests.sh ui --verbose"
  echo -e "  ./run-playwright-tests.sh auth --debug"
  echo -e ""
}

# Function to log messages
function log {
  local level=$1
  local message=$2
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  case "$level" in
    "INFO")
      echo -e "${timestamp} ${GREEN}[INFO]${NC} $message"
      ;;
    "DEBUG")
      echo -e "${timestamp} ${CYAN}[DEBUG]${NC} $message"
      ;;
    "WARN")
      echo -e "${timestamp} ${YELLOW}[WARN]${NC} $message"
      ;;
    "ERROR")
      echo -e "${timestamp} ${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo -e "${timestamp} [$level] $message"
      ;;
  esac
}

# Function to debug log
function debug_log {
  if [ "$LOG_LEVEL" == "debug" ]; then
    log "DEBUG" "$1"
  fi
}

# Function to info log
function info_log {
  if [ "$LOG_LEVEL" == "debug" ] || [ "$LOG_LEVEL" == "info" ]; then
    log "INFO" "$1"
  fi
}

# Function to warn log
function warn_log {
  log "WARN" "$1"
}

# Function to error log
function error_log {
  log "ERROR" "$1"
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
  show_usage
  exit 1
fi

# Parse arguments
TEST_TYPE=""
for arg in "$@"; do
  case "$arg" in
    --verbose)
      LOG_LEVEL="info"
      ;;
    --debug)
      LOG_LEVEL="debug"
      ;;
    --no-server)
      START_SERVER=false
      ;;
    all|ui|debug|report|visual|a11y|auth|plan|examples|help)
      TEST_TYPE="$arg"
      ;;
    *)
      if [ -z "$TEST_TYPE" ]; then
        error_log "Unknown option: $arg"
        show_usage
        exit 1
      fi
      ;;
  esac
done

# If no test type specified, show usage
if [ -z "$TEST_TYPE" ]; then
  error_log "No test type specified"
  show_usage
  exit 1
fi

# Set environment variables
export PLAYWRIGHT_LOG_LEVEL="$LOG_LEVEL"
export PLAYWRIGHT_BASE_URL="http://localhost:8082"

# Create screenshots directory if it doesn't exist
if [ ! -d "./screenshots" ]; then
  debug_log "Creating screenshots directory"
  mkdir -p ./screenshots
fi

# Display test configuration
info_log "Test type: $TEST_TYPE"
info_log "Log level: $LOG_LEVEL"
info_log "Working directory: $(pwd)"
info_log "Start server: $START_SERVER"

# Function to run tests with progress reporting
function run_tests_with_progress() {
  local command=$1
  local test_type=$2
  
  # Add environment variable to skip web server if server should not be started
  if [ "$START_SERVER" = false ]; then
    export PLAYWRIGHT_SKIP_BROWSER_LAUNCH=1
  fi
  
  info_log "Running $test_type tests..."
  info_log "Command: $command"
  
  # Create a temporary file to capture output
  local temp_file=$(mktemp)
  
  # Run the command and capture output
  info_log "Test execution started"
  info_log "This may take a moment. Progress will be shown as tests complete..."
  
  # Run the command and tee output to both the terminal and the temp file
  eval "$command" 2>&1 | tee "$temp_file" | while IFS= read -r line; do
    # Look for patterns in the output to report progress
    if [[ "$line" == *"Running"*"test"* ]]; then
      info_log "PROGRESS: $line"
    elif [[ "$line" == *"passed"* ]]; then
      log "INFO" "✅ $line"
    elif [[ "$line" == *"failed"* ]]; then
      log "ERROR" "❌ $line"
    elif [[ "$line" == *"skipped"* ]]; then
      log "WARN" "⏭️ $line"
    fi
  done
  
  # Get the exit code
  local exit_code=${PIPESTATUS[0]}
  
  # Count tests
  local total_tests=$(grep -c "Running" "$temp_file" || echo "0")
  local passed_tests=$(grep -c "passed" "$temp_file" || echo "0")
  local failed_tests=$(grep -c "failed" "$temp_file" || echo "0")
  local skipped_tests=$(grep -c "skipped" "$temp_file" || echo "0")
  
  # Report summary
  info_log "Test Summary:"
  info_log "  Total tests: $total_tests"
  info_log "  Passed: $passed_tests"
  info_log "  Failed: $failed_tests"
  info_log "  Skipped: $skipped_tests"
  
  # Clean up
  rm -f "$temp_file"
  
  return $exit_code
}

# Process test type
case "$TEST_TYPE" in
  all)
    run_tests_with_progress "npm run test:e2e" "all"
    ;;
  ui)
    info_log "Running tests with UI mode..."
    info_log "This will open Playwright's interactive UI for running and debugging tests"
    
    # Set environment variable to skip web server if server should not be started
    if [ "$START_SERVER" = false ]; then
      export PLAYWRIGHT_SKIP_BROWSER_LAUNCH=1
    fi
    
    ui_command="npx playwright test --ui"
    info_log "Command: $ui_command"
    eval "$ui_command"
    ;;
  debug)
    run_tests_with_progress "npm run test:e2e:debug" "debug"
    ;;
  report)
    info_log "Showing test report..."
    debug_log "Command: npm run test:e2e:report"
    npm run test:e2e:report
    ;;
  visual)
    run_tests_with_progress "npm run test:e2e:visual" "visual"
    ;;
  a11y)
    run_tests_with_progress "npx playwright test tests/e2e/specs/accessibility/" "accessibility"
    ;;
  auth)
    run_tests_with_progress "npx playwright test tests/e2e/specs/auth/" "authentication"
    ;;
  plan)
    run_tests_with_progress "npx playwright test tests/e2e/specs/plan/" "plan"
    ;;
  examples)
    run_tests_with_progress "npx playwright test tests/e2e/specs/examples/" "example"
    ;;
  help)
    show_usage
    ;;
  *)
    error_log "Unknown option: $TEST_TYPE"
    show_usage
    exit 1
    ;;
esac

# Check exit status
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  info_log "Tests completed successfully"
else
  error_log "Tests failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
