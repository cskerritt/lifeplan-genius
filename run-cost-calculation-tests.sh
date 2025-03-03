#!/bin/bash
# Script to run cost calculation tests
# Usage: ./run-cost-calculation-tests.sh [--all] [--report]

echo "Running cost calculation tests..."

# Run the tests
node test-cost-calculations.mjs "$@"

# Check the exit code
if [ $? -eq 0 ]; then
  echo "All tests passed!"
else
  echo "Some tests failed. Check the report for details."
fi

# If report was generated, try to open it
if [[ "$*" == *"--report"* ]]; then
  echo "Opening test report..."
  
  # Try to open the report based on the OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open cost-calculation-test-report.html
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
      xdg-open cost-calculation-test-report.html
    else
      echo "Report generated at: cost-calculation-test-report.html"
    fi
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start cost-calculation-test-report.html
  else
    echo "Report generated at: cost-calculation-test-report.html"
  fi
fi

echo "Done!"
