#!/bin/bash
set -e

# Build all historical versions from git tags
# Each tag represents a data snapshot

echo "Building Dashana versions..."

# Create output directory
rm -rf _site
mkdir -p _site

# Get all tags (version releases)
TAGS=$(git tag --sort=-creatordate)

if [ -z "$TAGS" ]; then
  echo "No tags found. Building current state only..."
  npm run build
  exit 0
fi

# Build latest (current state)
echo "Building latest version..."
npm run build
cp -r _site _site_latest

# Store versions list for navigation
VERSIONS_JSON="["

# Build each tagged version
for TAG in $TAGS; do
  # Extract date from tag (expects format: vYYYY-MM-DD or YYYY-MM-DD)
  DATE=$(echo "$TAG" | sed 's/^v//')

  echo "Building version: $DATE"

  # Checkout the tagged version
  git checkout "$TAG" -- data/project.csv 2>/dev/null || continue

  # Build with version prefix
  DASHANA_VERSION="$DATE" npm run build

  # Move to versioned directory
  mkdir -p "_site/$DATE"
  cp -r _site/* "_site/$DATE/" 2>/dev/null || true

  # Add to versions list
  VERSIONS_JSON="$VERSIONS_JSON\"$DATE\","

  # Restore current CSV
  git checkout HEAD -- data/project.csv
done

# Restore latest build
rm -rf _site/*
cp -r _site_latest/* _site/
rm -rf _site_latest

# Finalize versions JSON
VERSIONS_JSON="${VERSIONS_JSON%,}]"
echo "$VERSIONS_JSON" > _site/versions.json

echo "Build complete!"
echo "Versions built: $VERSIONS_JSON"
