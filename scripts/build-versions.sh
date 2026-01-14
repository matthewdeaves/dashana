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

# Extract date from various tag formats
# Supports: v2026-01-15, 2026-01-15, release-2026-01-15, 2026.01.15, v2026.01.15
extract_date() {
  local tag="$1"
  # Try to extract YYYY-MM-DD or YYYY.MM.DD pattern
  local date=$(echo "$tag" | grep -oE '[0-9]{4}[-\.][0-9]{2}[-\.][0-9]{2}' | head -1)
  # Normalize dots to dashes
  echo "$date" | tr '.' '-'
}

# Collect all valid version dates first (for versions.json)
VALID_DATES=()
for TAG in $TAGS; do
  DATE=$(extract_date "$TAG")
  if [ -n "$DATE" ]; then
    VALID_DATES+=("$DATE")
  fi
done

# Generate versions.json BEFORE building so it's available during all builds
VERSIONS_JSON="["
for i in "${!VALID_DATES[@]}"; do
  if [ $i -gt 0 ]; then
    VERSIONS_JSON="$VERSIONS_JSON,"
  fi
  VERSIONS_JSON="$VERSIONS_JSON\"${VALID_DATES[$i]}\""
done
VERSIONS_JSON="$VERSIONS_JSON]"
echo "$VERSIONS_JSON" > _site/versions.json
echo "Generated versions.json with ${#VALID_DATES[@]} versions"

# Build latest (current state) first
echo "Building latest version..."
npm run build
cp -r _site _site_latest

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

  # Clear _site before building to avoid accumulating previous version directories
  rm -rf _site
  mkdir -p _site
  # Restore versions.json for this build
  echo "$VERSIONS_JSON" > _site/versions.json

  # Build with version prefix
  DASHANA_VERSION="$DATE" npm run build

  # Move to versioned directory in latest build
  mkdir -p "_site_latest/$DATE"
  cp -r _site/* "_site_latest/$DATE/"

  # Restore current CSV
  git checkout HEAD -- data/project.csv
done

# Restore latest build as the root
rm -rf _site
mv _site_latest _site

echo "Build complete!"
echo "Versions built: $VERSIONS_JSON"
