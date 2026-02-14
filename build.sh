#!/bin/bash
# Build script: Compile SCSS and add cache-busting hash to CSS

set -e

# Ensure devbox environment is loaded
eval "$(devbox shellenv)"

# Compile SCSS to CSS
echo "Compiling SCSS..."
sass css/styles.scss css/styles.css --style=compressed --no-source-map

# Calculate SHA256 of CSS file (first 8 chars)
CSS_HASH=$(shasum -a 256 css/styles.css | cut -c1-8)

# Update index.html with versioned CSS link
sed -i.bak "s|css/styles.css?v=[^\"]*|css/styles.css?v=$CSS_HASH|g" index.html
sed -i.bak "s|css/styles.css\"|css/styles.css?v=$CSS_HASH\"|g" index.html

# Clean up backup file
rm -f index.html.bak

echo "✓ CSS cache-busting hash updated: v=$CSS_HASH"
