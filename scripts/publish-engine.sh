#!/bin/bash

# Lemeone-lab: DRTA Engine Publication Helper
# This script prepares the DRTA engine for publication while protecting the source code.

set -e

ENGINE_DIR="packages/drta-engine"

echo "📦 Preparing @lemeone/drta-engine..."

cd $ENGINE_DIR

# 1. Build the engine (TypeScript to JS)
echo "🏗️ Building..."
npm run build || echo "Warning: tsup not found, skipping build step. Ensure dist/index.js exists."

# 2. Obfuscate the build
echo "🛡️ Obfuscating..."
if command -v javascript-obfuscator &> /dev/null
then
    javascript-obfuscator dist/index.js --output dist/index.js --compact true --self-defending true
else
    echo "Warning: javascript-obfuscator not found. Please install it with 'npm install -g javascript-obfuscator'."
fi

echo "✅ Engine ready in $ENGINE_DIR/dist"
echo "🚀 To publish: cd $ENGINE_DIR && npm publish"
