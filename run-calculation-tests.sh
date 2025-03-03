#!/bin/bash
# Comprehensive test runner for cost calculations
# This script provides a convenient way to run the different types of tests

# Default values
PROPERTY_SAMPLES=500
SEED=$(date +%s)
GENERATE_GOLDEN=false
ALL_COMBINATIONS=false
TEST_TYPE="all"

# Display help message
show_help() {
  echo "Usage: $0 [options] [test-type]"
  echo ""
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -p, --property-samples N   Number of property-based test samples (default: 500)"
  echo "  -s, --seed N               Random seed for tests (default: current timestamp)"
  echo "  -g, --generate-golden      Generate golden master data"
  echo "  -a, --all-combinations     Use all combinations for comprehensive tests"
  echo ""
  echo "Test Types:"
  echo "  all                        Run all tests (default)"
  echo "  property                   Run only property-based tests"
  echo "  golden                     Run only golden master tests"
  echo "  strategy                   Run only cross-strategy validation tests"
  echo "  comprehensive              Run only comprehensive tests"
  echo ""
  echo "Examples:"
  echo "  $0                         Run all tests with default options"
  echo "  $0 -p 1000 -s 12345        Run all tests with 1000 property samples and seed 12345"
  echo "  $0 -g golden               Generate golden master data and run golden master tests"
  echo "  $0 property                Run only property-based tests"
  echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -p|--property-samples)
      PROPERTY_SAMPLES="$2"
      shift 2
      ;;
    -s|--seed)
      SEED="$2"
      shift 2
      ;;
    -g|--generate-golden)
      GENERATE_GOLDEN=true
      shift
      ;;
    -a|--all-combinations)
      ALL_COMBINATIONS=true
      shift
      ;;
    property|golden|strategy|comprehensive|all)
      TEST_TYPE="$1"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Build the command arguments
ARGS=""

if [ "$PROPERTY_SAMPLES" != "500" ]; then
  ARGS="$ARGS --property-samples=$PROPERTY_SAMPLES"
fi

if [ "$SEED" != "$(date +%s)" ]; then
  ARGS="$ARGS --seed=$SEED"
fi

if [ "$GENERATE_GOLDEN" = true ]; then
  ARGS="$ARGS --generate-golden"
fi

if [ "$ALL_COMBINATIONS" = true ]; then
  ARGS="$ARGS --all-combinations"
fi

# Run the appropriate test(s)
case $TEST_TYPE in
  all)
    echo "Running all tests with options: $ARGS"
    node src/utils/calculations/__tests__/runAllTests.mjs $ARGS
    ;;
  property)
    echo "Running property-based tests with options: $ARGS"
    node src/utils/calculations/__tests__/propertyBasedTesting.mjs $ARGS
    ;;
  golden)
    echo "Running golden master tests with options: $ARGS"
    if [ "$GENERATE_GOLDEN" = true ]; then
      node src/utils/calculations/__tests__/goldenMasterTesting.mjs --generate
    else
      node src/utils/calculations/__tests__/goldenMasterTesting.mjs --verify
    fi
    ;;
  strategy)
    echo "Running cross-strategy validation tests"
    node src/utils/calculations/__tests__/crossStrategyValidation.mjs
    ;;
  comprehensive)
    echo "Running comprehensive tests with options: $ARGS"
    if [ "$ALL_COMBINATIONS" = true ]; then
      node src/utils/calculations/__tests__/runComprehensiveTests.mjs --all
    else
      node src/utils/calculations/__tests__/runComprehensiveTests.mjs
    fi
    ;;
esac

# Exit with the exit code of the last command
exit $?
