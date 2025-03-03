#!/bin/bash

# Run a quick test with a small number of samples
echo "Running quick test with 10 samples..."
node test-actual-calculations.mjs --samples=10

# Exit with the same status code as the test script
exit $?
