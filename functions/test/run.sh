#!/usr/bin/env bash

# Need this to be a module for tests
sed -i '$ d' package.json
printf "  ,\"type\": \"module\"\n}" >> package.json

# Set envar for service account location (so tests can access services)
export GOOGLE_APPLICATION_CREDENTIALS=test/serviceAccountKey.json

if [ $# -eq 0 ]; then
  echo "===================="
  echo "Running all tests..."
  echo "===================="
  mocha --reporter spec
else
  echo "============================================="
  echo "Running tests with $1 in their name..."
  echo "============================================="
  mocha --reporter spec -g "$1"
fi


# Remove module type
sed -i '$ d' package.json
sed -i '$ d' package.json
echo "}" >> package.json
