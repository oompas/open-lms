#!/usr/bin/env bash

# Set envar for service account location (so tests can access services)
export GOOGLE_APPLICATION_CREDENTIALS=test/serviceAccountKey.json &&
mocha --reporter spec
