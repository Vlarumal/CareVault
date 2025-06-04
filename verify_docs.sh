#!/bin/bash

# Build client documentation
cd client
npm run docs

# Build server documentation
cd ../server
npm run docs

# Move server docs to client/docs/server for combined deployment
cd ..
rm -rf client/docs/server
mkdir -p client/docs/server
cp -R server/docs/* client/docs/server

# Run verification tests
node __tests__/verify_docs.test.js

echo "Documentation built and verified successfully!"
open client/docs/index.html
