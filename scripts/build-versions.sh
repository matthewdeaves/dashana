#!/bin/bash
set -e

# Build all historical versions from git tags
# Each tag represents a data snapshot

echo "Building Dashana versions..."

# Verify we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: Not a git repository"
  exit 1
fi

# Verify data directory exists
if [ ! -d "data" ]; then
  echo "Error: data/ directory not found"
  exit 1
fi

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

# Extract date from various tag formats
# Supports: v2026-01-15, 2026-01-15, release-2026-01-15, 2026.01.15, v2026.01.15
extract_date() {
  local tag="$1"
  # Try to extract YYYY-MM-DD or YYYY.MM.DD pattern
  local date=$(echo "$tag" | grep -oE '[0-9]{4}[-\.][0-9]{2}[-\.][0-9]{2}' | head -1)
  # Normalize dots to dashes
  echo "$date" | tr '.' '-'
}

# Build each tagged version
for TAG in $TAGS; do
  # Extract date from tag
  DATE=$(extract_date "$TAG")

  # Skip tags that don't contain a valid date
  if [ -z "$DATE" ]; then
    echo "Skipping tag '$TAG' - no date pattern found"
    continue
  fi

  echo "Building version: $DATE (from tag: $TAG)"

  # Checkout the tagged version
  if ! git checkout "$TAG" -- data/project.csv 2>/dev/null; then
    echo "  Skipping $TAG: Could not checkout data/project.csv from this tag"
    continue
  fi

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
