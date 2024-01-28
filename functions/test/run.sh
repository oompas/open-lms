#!/usr/bin/env bash

# Need this to be a module for tests
sed -i '$ d' package.json
sed -i '$ d' package.json
if [[ $(tail -n 1 package.json) == "  \"private\": true," ]]; then
  sed -i '$ d' package.json # If you exit the script partway through, an extra line is added
fi
echo "  \"private\": true," >> package.json
echo "  \"type\": \"module\"" >> package.json
echo "}" >> package.json

# Set envar for service account location (so tests can access services)
export GOOGLE_APPLICATION_CREDENTIALS=test/serviceAccountKey.json
mocha --reporter spec

# Remove module type
sed -i '$ d' package.json
sed -i '$ d' package.json
sed -i '$ d' package.json
echo "  \"private\": true" >> package.json
echo "}" >> package.json
