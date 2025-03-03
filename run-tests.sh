#!/bin/bash

# Run Cost Calculation Tests
# This script provides a simple way to run the cost calculation tests

# Set default options
VERBOSE=false
EXPORT=false
MOCK_ONLY=false
ACTUAL_ONLY=false
TEST_CASE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -e|--export)
      EXPORT=true
      shift
      ;;
    -m|--mock-only)
      MOCK_ONLY=true
      shift
      ;;
    -a|--actual-only)
      ACTUAL_ONLY=true
      shift
      ;;
    -t|--test-case)
      TEST_CASE="$2"
      shift
      shift
      ;;
    -h|--help)
      echo "Usage: ./run-tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  -v, --verbose     Enable verbose logging"
      echo "  -e, --export      Export logs to JSON files"
      echo "  -m, --mock-only   Only run the mock tests"
      echo "  -a, --actual-only Only run the actual tests"
      echo "  -t, --test-case N Run a specific test case number"
      echo "  -h, --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help to see available options"
      exit 1
      ;;
  esac
done

# Build the command arguments
ARGS=""

if [ "$VERBOSE" = true ]; then
  ARGS="$ARGS --verbose"
fi

if [ "$EXPORT" = true ]; then
  ARGS="$ARGS --export"
fi

if [ "$MOCK_ONLY" = true ]; then
  ARGS="$ARGS --mock-only"
fi

if [ "$ACTUAL_ONLY" = true ]; then
  ARGS="$ARGS --actual-only"
fi

# If a specific test case is specified, run that test case
if [ -n "$TEST_CASE" ]; then
  if [ "$MOCK_ONLY" = true ]; then
    echo "Running mock test case $TEST_CASE..."
    node debug-cost-calculations.mjs --test-case=$TEST_CASE $ARGS
  elif [ "$ACTUAL_ONLY" = true ]; then
    echo "Running actual test case $TEST_CASE..."
    node test-actual-cost-calculations.mjs --test-case=$TEST_CASE $ARGS
  else
    echo "Please specify --mock-only or --actual-only when using --test-case"
    exit 1
  fi
else
  # Otherwise, run all tests
  echo "Running all tests..."
  node run-cost-tests.mjs $ARGS
fi

# Make the script executable
chmod +x run-tests.sh
