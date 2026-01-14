# Phase 7: Versioning System

> **Status:** ✅ COMPLETE
> **Goal:** Build historical versions from git history, add version navigation.
> **Sessions:** 2
> **Prerequisites:** Phase 6 complete (all pages working)
>
> **Enhancements Added:**
> - DEV_VERSIONS environment variable for local testing
> - Support for multiple tag formats (v2026-01-15, 2026-01-15, 2026.01.15, etc.)

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 7-A | 7.1 - 7.3 | Version build script, 11ty config changes |
| 7-B | 7.4 - 7.5 | Version navigation UI, versions index page |

## Versioning Concept

Each time the CSV is updated and tagged, a new version is created:
- Latest always at `/`
- Historical at `/YYYY-MM-DD/`
- Version index at `/versions/`

The build script iterates through git history to build each version.

## Session 7-A: Build Script

### Task 7.1: Create Version Build Script

Create `scripts/build-versions.sh`:

```bash
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
```

Make executable:
```bash
chmod +x scripts/build-versions.sh
```

**Acceptance:**
- [ ] Script runs without errors
- [ ] Creates versioned directories
- [ ] Generates versions.json
- [ ] Latest version at root

---

### Task 7.2: Update 11ty Config for Versions

Update `.eleventy.js` to support version paths:

```javascript
module.exports = function(eleventyConfig) {
  // Get version from environment (set by build script)
  const version = process.env.DASHANA_VERSION || null;

  eleventyConfig.addPassthroughCopy("src/css");

  // Add version to global data
  eleventyConfig.addGlobalData("version", version);

  // Adjust paths if building a version
  if (version) {
    eleventyConfig.addGlobalData("pathPrefix", `/${version}`);
  } else {
    eleventyConfig.addGlobalData("pathPrefix", "");
  }

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk"
  };
};
```

**Acceptance:**
- [ ] Version available in templates as `{{ version }}`
- [ ] Path prefix available for links
- [ ] Normal build still works

---

### Task 7.3: Create Versions Data File

Create `src/_data/versions.js` to load available versions:

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function() {
  const versionsPath = path.join(__dirname, '../../_site/versions.json');

  try {
    const content = fs.readFileSync(versionsPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    // During development, return empty array
    return [];
  }
};
```

**Acceptance:**
- [ ] Versions array available in templates
- [ ] Gracefully handles missing file

---

## Session 7-B: Version Navigation

### Task 7.4: Update Header with Version Selector

Update `src/_includes/components/header.njk`:

```njk
<header class="site-header">
  <div class="header-top">
    <h1 class="site-title">{{ config.projectName }}</h1>
    <span class="customer-name">{{ config.customerName }}</span>
  </div>

  <nav class="main-nav">
    <a href="{{ pathPrefix }}/" class="nav-link {% if page.url == '/' %}active{% endif %}">Dashboard</a>
    <a href="{{ pathPrefix }}/board/" class="nav-link {% if '/board/' in page.url %}active{% endif %}">Board</a>
    <a href="{{ pathPrefix }}/tasks/" class="nav-link {% if '/tasks/' in page.url %}active{% endif %}">Tasks</a>
    <a href="{{ pathPrefix }}/timeline/" class="nav-link {% if '/timeline/' in page.url %}active{% endif %}">Timeline</a>
  </nav>

  <div class="version-info">
    {% if version %}
      <span class="version-badge">{{ version }}</span>
      <a href="/" class="version-link">View Latest</a>
    {% else %}
      <span class="version-badge current">Latest</span>
    {% endif %}

    {% if versions.length > 0 %}
      <a href="/versions/" class="version-link">All Versions</a>
    {% endif %}
  </div>
</header>
```

Add header styles:

```css
/* Header */
.site-header {
  background: white;
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-top {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.site-title {
  font-size: 1.25rem;
  margin: 0;
}

.customer-name {
  color: #666;
  font-size: 0.875rem;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--color-text);
  border-radius: 4px;
}

.nav-link:hover,
.nav-link.active {
  background: #f0f0f0;
}

.nav-link.active {
  font-weight: 500;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.version-badge {
  padding: 0.25rem 0.5rem;
  background: #e5e5e5;
  border-radius: 3px;
  font-size: 0.75rem;
  font-family: monospace;
}

.version-badge.current {
  background: var(--color-accent);
  color: white;
}

.version-link {
  font-size: 0.75rem;
  color: var(--color-accent);
}
```

**Acceptance:**
- [ ] Current version shown in header
- [ ] "View Latest" link on historical versions
- [ ] "All Versions" link when versions exist
- [ ] Navigation links use path prefix

---

### Task 7.5: Create Versions Index Page

Create `src/versions.njk`:

```njk
---
layout: layouts/base.njk
title: Version History
permalink: /versions/
---

<div class="versions-page">
  <div class="page-header">
    <h2>Version History</h2>
    <p class="page-subtitle">Report snapshots over time</p>
  </div>

  <div class="versions-list">
    <div class="version-item current">
      <a href="/" class="version-link-card">
        <span class="version-date">Latest</span>
        <span class="version-label">Current Report</span>
      </a>
    </div>

    {% for ver in versions %}
    <div class="version-item">
      <a href="/{{ ver }}/" class="version-link-card">
        <span class="version-date">{{ ver }}</span>
        <span class="version-label">Report Snapshot</span>
      </a>
    </div>
    {% endfor %}

    {% if versions.length == 0 %}
    <p class="empty-state">No historical versions yet. Push a tag to create a snapshot.</p>
    {% endif %}
  </div>
</div>
```

Add versions page styles:

```css
/* Versions Page */
.versions-page {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.version-link-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  text-decoration: none;
  color: var(--color-text);
}

.version-link-card:hover {
  border-color: var(--color-accent);
  background: #f8f9fa;
}

.version-item.current .version-link-card {
  border-color: var(--color-accent);
}

.version-date {
  font-family: monospace;
  font-weight: 500;
}

.version-label {
  color: #666;
  font-size: 0.875rem;
}
```

**Acceptance:**
- [ ] Versions page loads at /versions/
- [ ] Latest version highlighted
- [ ] All historical versions listed
- [ ] Links navigate to correct version
- [ ] Empty state when no versions

---

## Phase 7 Completion Checklist

- [x] Build script generates all versions
- [x] versions.json created with version list
- [x] Header shows current version
- [x] Navigation links work within versions
- [x] Versions index page works
- [x] Can navigate between versions
- [x] Ready for Phase 8 (GitHub Actions)

## How to Start This Phase

```
Read plans/PHASE-7-VERSIONING.md and implement session 7-A.
```

After session 7-A:
```
/clear
Read plans/PHASE-7-VERSIONING.md and implement session 7-B.
```
