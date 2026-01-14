# Dashana Code Review & Improvement Plan

**Date:** 2026-01-14
**Reviewer:** Claude Code
**Scope:** Full codebase review for robustness, dependencies, libraries, refactoring, and code quality tooling

> **Implementation Plan:** The actionable items from this review have been structured into
> `plans/PHASE-10-ROBUSTNESS.md` following the project's session-based workflow.
> Use that file for implementation; this document serves as the analysis reference.

---

## Executive Summary

The Dashana codebase is **well-architected and production-ready** with solid fundamentals:
- Clean separation of concerns (data/templates/styles)
- Comprehensive test coverage (325+ lines unit tests, 580+ lines view tests)
- Minimal dependencies (4 total)
- All dependencies are at latest versions

However, there are opportunities to improve **robustness, maintainability, accessibility, and developer experience** through targeted improvements.

---

## 1. Dependency Analysis

### Current State (All Up to Date)
| Package | Current | Latest | Status |
|---------|---------|--------|--------|
| @11ty/eleventy | 3.1.2 | 3.1.2 | Current |
| csv-parse | 6.1.0 | 6.1.0 | Current |
| jest | 30.2.0 | 30.2.0 | Current |
| cheerio | 1.1.2 | 1.1.2 | Current |

### Recommendations

#### Keep Current Dependencies
The dependency choices are excellent - minimal footprint, well-maintained packages:
- **Eleventy 3.x** - Active development (4.x alphas in progress)
- **csv-parse** - Standard, robust CSV parsing
- **Jest 30** - Modern testing with excellent ESM support
- **Cheerio** - Lightweight DOM testing

#### Consider Adding (Optional)
| Tool | Purpose | Priority |
|------|---------|----------|
| **Biome** | Linting + Formatting (20x faster than ESLint) | Medium |
| **html-validate** | Template accessibility/validation | Low |

---

## 2. Code Robustness Issues

### 2.1 Error Handling (High Priority)

**Problem:** `tasks.js:28-31` - Silent failure on missing CSV
```javascript
} catch (e) {
  console.warn('data/project.csv not found:', e.message);
  return { all: [], sections: {}, ... }; // Silent empty state
}
```

**Impact:** Users may not realize their CSV path is wrong or malformed.

**Solution:**
```javascript
// Option A: Fail fast in production
if (process.env.NODE_ENV === 'production') {
  throw new Error(`Required CSV file missing: ${csvPath}`);
}
// Option B: Return error state that templates can display
return {
  all: [],
  error: { message: e.message, type: 'CSV_LOAD_ERROR' },
  ...
};
```

### 2.2 Date Handling Issues (High Priority)

**Problem:** `tasks.js:36-38` - Timezone-dependent date calculations
```javascript
today.setHours(0, 0, 0, 0); // Mutates date object
// Uses local timezone - can differ between build environments
```

**Impact:** Overdue calculations may differ by 1 day depending on server timezone.

**Solution:**
```javascript
// Use UTC for consistent behavior
function normalizeToUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
```

### 2.3 Input Validation (Medium Priority)

**Problem:** No validation of CSV structure or required fields.

**Solution:** Add schema validation:
```javascript
const REQUIRED_FIELDS = ['Name', 'Section/Column'];

function validateRecord(record, index) {
  for (const field of REQUIRED_FIELDS) {
    if (!record[field]?.trim()) {
      console.warn(`Row ${index + 1}: Missing required field "${field}"`);
    }
  }
}
```

### 2.4 Build Script Robustness (Medium Priority)

**Problem:** `scripts/build-versions.sh:54` - Git checkout can fail silently
```bash
git checkout "$TAG" -- data/project.csv 2>/dev/null || continue
```

**Solution:** Add explicit validation:
```bash
if ! git checkout "$TAG" -- data/project.csv 2>/dev/null; then
  echo "Warning: Could not checkout CSV from tag '$TAG'"
  continue
fi
```

---

## 3. Architecture Improvements

### 3.1 CSS Modularization (Medium Priority)

**Current:** 1,243 lines in single `styles.css` file

**Problem:** Difficult to maintain, no clear component boundaries.

**Recommendation:** Split into logical modules:
```
src/css/
├── base/
│   ├── reset.css
│   ├── variables.css      # All CSS custom properties
│   └── typography.css
├── components/
│   ├── header.css
│   ├── metric-card.css
│   ├── task-card.css
│   ├── table.css
│   └── badges.css
├── layouts/
│   ├── dashboard.css
│   ├── board.css
│   └── timeline.css
├── utilities/
│   └── responsive.css
└── styles.css             # Entry point (imports all)
```

**Implementation:** Use 11ty's built-in CSS bundling or a simple concat script.

### 3.2 Test Architecture (Low Priority)

**Problem:** `views.test.js:11-32` - Swaps production CSV, rebuilds site twice.

**Impact:**
- Slow test execution (~10s overhead)
- Risk of data corruption if tests interrupted
- File I/O coupling

**Solution:** Use a dedicated test output directory:
```javascript
// In jest.config.js or test setup
process.env.ELEVENTY_OUTPUT = '_site_test';
process.env.DATA_PATH = 'tests/fixtures/test-project.csv';
```

### 3.3 Configuration Enhancement (Low Priority)

**Current:** Basic key=value config file

**Recommendation:** Support JSON for complex configuration:
```json
{
  "projectName": "My Project",
  "customerName": "Acme Corp",
  "siteBase": "",
  "features": {
    "showTimeline": true,
    "enableVersionHistory": true
  },
  "customFieldDisplay": {
    "Story Points": { "type": "number", "aggregate": "sum" }
  }
}
```

---

## 4. Accessibility Improvements

### 4.1 Color Contrast Issues (High Priority)

**Problem:** Status indicators use color-only differentiation.

**Current:**
```css
.status-on-track .status-indicator { background: var(--color-on-track); }
.status-at-risk .status-indicator { background: var(--color-at-risk); }
```

**Solution:** Add patterns/icons for colorblind users:
```html
<span class="status-indicator status-on-track">
  <span class="visually-hidden">On track</span>
  <svg aria-hidden="true"><!-- checkmark icon --></svg>
</span>
```

### 4.2 Filter Toggle Accessibility (Medium Priority)

**Problem:** `filter-toggle.njk` lacks ARIA attributes.

**Solution:**
```html
<button id="filter-toggle"
        class="filter-btn"
        aria-pressed="false"
        aria-label="Filter to show open tasks only">
```

### 4.3 Table Accessibility (Medium Priority)

**Problem:** Complex tables without proper scope attributes.

**Solution:**
```html
<th scope="col" class="col-name">Name</th>
<!-- For row headers -->
<th scope="row" class="col-name">{{ task.name }}</th>
```

---

## 5. Code Quality Tools

### 5.1 Recommended: Biome (High Priority)

**Why Biome over ESLint:**
- 20x faster (200ms vs 4s for typical codebase)
- Single tool for linting + formatting
- Zero configuration to start
- Rust-based, no Node.js overhead

**Installation:**
```bash
npm install --save-dev @biomejs/biome
npx biome init
```

**Configuration (`biome.json`):**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.x/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

### 5.2 HTML Validation (Medium Priority)

**Tool:** `html-validate` for Nunjucks template validation

```bash
npm install --save-dev html-validate
```

**Usage:**
```bash
npx html-validate "_site/**/*.html"
```

### 5.3 GitHub Actions Integration (Low Priority)

Add linting to CI pipeline:
```yaml
# In .github/workflows/build.yml
- name: Lint code
  run: npm run lint

- name: Validate HTML
  run: npx html-validate "_site/**/*.html"
```

---

## 6. Security Considerations

### 6.1 Content Security Policy (Low Priority)

**Current:** No CSP headers for GitHub Pages.

**Recommendation:** Add meta tag for basic protection:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 6.2 XSS Protection in Templates (Low Priority)

**Current:** Templates use `{{ value }}` which auto-escapes.

**Status:** Already secure - Nunjucks auto-escapes by default. Only `{{ content | safe }}` bypasses this, which is used correctly for rendered HTML.

---

## 7. Performance Optimizations

### 7.1 CSS Minification (Low Priority)

**Current:** CSS served unminified (~35KB)

**Solution:** Use Eleventy's built-in minification:
```javascript
// .eleventy.js
const CleanCSS = require("clean-css");

eleventyConfig.addFilter("cssmin", function(code) {
  return new CleanCSS({}).minify(code).styles;
});
```

### 7.2 Inline Critical CSS (Low Priority)

For first-contentful-paint optimization, inline critical CSS in `<head>`:
```njk
<style>{% include "css/critical.css" %}</style>
```

---

## 8. Implementation Priority Matrix

| Improvement | Impact | Effort | Priority |
|------------|--------|--------|----------|
| Add Biome linting | High | Low | **P1** |
| Fix date timezone handling | High | Low | **P1** |
| Improve error handling | High | Low | **P1** |
| Add filter toggle ARIA | Medium | Low | **P2** |
| Add colorblind-friendly indicators | High | Medium | **P2** |
| Input validation for CSV | Medium | Low | **P2** |
| Build script error handling | Medium | Low | **P2** |
| CSS modularization | Medium | High | **P3** |
| Test architecture refactor | Low | Medium | **P3** |
| CSP headers | Low | Low | **P3** |
| CSS minification | Low | Low | **P3** |

---

## 9. Recommended Action Plan

> **See `plans/PHASE-10-ROBUSTNESS.md`** for the structured implementation plan with
> sessions, acceptance criteria, and prompts for Claude Code execution.

### Summary of Implementation Sessions

| Session | Focus | Tasks |
|---------|-------|-------|
| 10-A | Code Quality Tooling | Biome setup, lint scripts, CI integration |
| 10-B | Date Handling & Error States | UTC dates, error display, CSV validation |
| 10-C | Accessibility | ARIA attributes, table scope, colorblind indicators |

### Deferred (Out of Scope)

These items are documented but not included in Phase 10:
- CSS modularization (large refactor, minimal user impact)
- JSON config format (current format works well)
- CSP headers (GitHub Pages limitations)
- Test architecture refactor (tests already pass reliably)

---

## 10. Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add Biome, lint scripts |
| `biome.json` | New - linter config |
| `src/_data/tasks.js` | Timezone fixes, validation, error handling |
| `scripts/build-versions.sh` | Better error messages |
| `src/_includes/components/filter-toggle.njk` | ARIA attributes |
| `src/css/styles.css` | (optional) Split into modules |
| `.github/workflows/build.yml` | Add lint step |

---

## Appendix: Current Codebase Metrics

- **Total JS Lines:** ~420 (tasks.js: 274, config.js: 27, versions.js: 20, .eleventy.js: 27)
- **Total CSS Lines:** 1,385 (styles.css: 1,243, print.css: 142)
- **Total Template Lines:** ~530 (across 12 .njk files)
- **Total Test Lines:** ~1,014 (data-processing: 325, views: 583, integration: 106)
- **Test Coverage:** Unit tests cover all exported functions
- **Dependencies:** 4 (2 prod, 2 dev)

---

## Sources

- [Biome vs ESLint Comparison](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/)
- [Why Biome Over ESLint](https://dev.to/saswatapal/why-i-chose-biome-over-eslintprettier-20x-faster-linting-one-tool-to-rule-them-all-10kf)
- [Google's Eleventy High-Performance Blog](https://github.com/google/eleventy-high-performance-blog)
- [Eleventy 2025 Review](https://www.11ty.dev/blog/review-2025/)
- [ESLint Official](https://eslint.org/)
