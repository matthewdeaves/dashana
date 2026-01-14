# Phase 10: Robustness & Code Quality

> **Goal:** Improve error handling, date consistency, accessibility, code quality tooling, display configuration, timeline UX, and visual comfort.
> **Sessions:** 6
> **Prerequisites:** Phases 1-9 complete (working site)
> **Last Updated:** 2026-01-14 (verified against current codebase)

## Scope

This phase implements P1 and P2 improvements from the January 2026 code review:

**In Scope:**
- Biome linting and formatting setup
- Date timezone handling fixes
- CSV error handling improvements
- ARIA accessibility attributes
- Build script robustness
- Colorblind-friendly status indicators
- Display configuration (tab visibility, column visibility, card items)
- **Timeline duration bar refactor** (added 2026-01-14)
- **Light theme refinement** - reduce eye strain (added 2026-01-14)

**Out of Scope (future consideration):**
- CSS modularization (large refactor, minimal user impact)
- JSON config format (current format works well)
- CSP headers (GitHub Pages limitations)
- Test architecture refactor (tests already pass reliably)

---

## Current Code State (as of 2026-01-14)

Before starting any session, verify these assumptions:

| File | Current State |
|------|---------------|
| `package.json` | No Biome (only eleventy, csv-parse, jest, cheerio) |
| `src/_data/config.js` | 27 lines, basic key=value parsing |
| `src/_data/tasks.js` | Uses `setHours(0,0,0,0)` for dates (timezone-dependent) |
| `src/_includes/components/filter-toggle.njk` | Has `aria-label` but missing `aria-pressed` |
| `src/_includes/components/task-card.njk` | Uses `.task-status` text badges (not SVG indicators) |
| `src/timeline.njk` | Tables lack `scope="col"` attributes |

---

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 10-A | 10.1 - 10.3 | Biome setup, lint scripts, CI integration |
| 10-B | 10.4 - 10.7 | Date handling, error states, CSV validation |
| 10-C | 10.8 - 10.11 | Accessibility improvements |
| 10-D | 10.12 - 10.16 | Display configuration (tabs, columns, cards) |
| 10-E | 10.17 - 10.20 | **Timeline duration bar refactor** |
| 10-F | 10.21 - 10.22 | **Light theme refinement** (reduce eye strain) |

---

## Session 10-A: Code Quality Tooling

### Task 10.1: Install and Configure Biome

Install Biome for fast linting and formatting:

```bash
npm install --save-dev @biomejs/biome
npx biome init
```

Create `biome.json` in project root:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.x/schema.json",
  "organizeImports": {
    "enabled": true
  },
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
  },
  "files": {
    "ignore": ["_site/**", "node_modules/**"]
  }
}
```

**Acceptance:**
- [ ] `biome.json` exists in project root
- [ ] `npx biome check .` runs without crashing
- [ ] `@biomejs/biome` appears in package.json devDependencies

---

### Task 10.2: Add Lint Scripts to package.json

Update `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:integration": "jest tests/integration.test.js",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

**Acceptance:**
- [ ] `npm run lint` executes and reports any issues
- [ ] `npm run lint:fix` auto-fixes fixable issues
- [ ] `npm run format` formats all JS files
- [ ] All three commands exit successfully on clean code

---

### Task 10.3: Add Linting to CI Pipeline

Update `.github/workflows/build.yml` to run linting before build:

Add after the "Install dependencies" step:

```yaml
- name: Lint code
  run: npm run lint
```

**Acceptance:**
- [ ] Lint step appears in build.yml before the build step
- [ ] Workflow YAML is valid (no syntax errors)
- [ ] Local test: `npm run lint && npm run build` succeeds

---

## Session 10-B: Date Handling & Error States

### Task 10.4: Fix Timezone-Dependent Date Handling

**Problem:** `tasks.js` uses `setHours(0,0,0,0)` which depends on local timezone, causing inconsistent overdue calculations across build environments.

Update `src/_data/tasks.js` to use UTC normalization:

Add helper function near the top of the file:

```javascript
/**
 * Normalize a date to UTC midnight for consistent comparisons.
 * Avoids timezone-dependent behavior in overdue calculations.
 */
function normalizeToUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
```

Replace the existing date normalization in `processRecords`:

```javascript
// Before (timezone-dependent):
// today.setHours(0, 0, 0, 0);

// After (UTC-consistent):
const todayUTC = normalizeToUTC(today);
```

Update `isOverdue` function to use UTC comparison:

```javascript
function isOverdue(dueDate, section, today) {
  if (!dueDate || isDoneSection(section)) return false;
  const dueDateUTC = normalizeToUTC(new Date(dueDate));
  const todayUTC = normalizeToUTC(today);
  return dueDateUTC < todayUTC;
}
```

**Acceptance:**
- [ ] `normalizeToUTC` function added to tasks.js
- [ ] `isOverdue` uses UTC comparison
- [ ] `npm test` passes (all existing tests still work)
- [ ] Add test: task due "2026-01-14" is not overdue when today is "2026-01-14" regardless of timezone

---

### Task 10.5: Add CSV Load Error State

**Problem:** Missing or malformed CSV silently returns empty data. Users don't know something is wrong.

Update the catch block in `src/_data/tasks.js`:

```javascript
} catch (e) {
  console.warn('CSV load error:', e.message);
  return {
    all: [],
    sections: {},
    sectionNames: [],
    stats: {
      total: 0,
      done: 0,
      open: 0,
      overdue: 0,
      completionPercent: 0,
      bySection: {},
      byStatus: {},
      byPriority: {},
      byAssignee: {}
    },
    timeline: [],
    projectRange: { start: null, end: null },
    error: {
      message: e.message,
      type: e.code === 'ENOENT' ? 'CSV_NOT_FOUND' : 'CSV_PARSE_ERROR',
      hint: e.code === 'ENOENT'
        ? 'Ensure data/project.csv exists'
        : 'Check CSV format matches Asana export'
    }
  };
}
```

**Acceptance:**
- [ ] Error object included in returned data when CSV fails to load
- [ ] Error includes type, message, and hint
- [ ] `npm run build` still succeeds with missing CSV (graceful degradation)

---

### Task 10.6: Display Error State in Dashboard

Update `src/index.njk` to show error state when CSV fails:

Add at the top of the dashboard content (after front matter):

```njk
{% if tasks.error %}
<div class="error-banner" role="alert">
  <strong>Data Error:</strong> {{ tasks.error.message }}
  <p class="error-hint">{{ tasks.error.hint }}</p>
</div>
{% endif %}
```

Add styles to `src/css/styles.css`:

```css
/* Error Banner */
.error-banner {
  background: #fef2f2;
  border: 1px solid var(--color-off-track);
  border-radius: 4px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  color: #991b1b;
}

.error-banner strong {
  display: block;
  margin-bottom: 0.5rem;
}

.error-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #7f1d1d;
}
```

**Acceptance:**
- [ ] Error banner displays when tasks.error exists
- [ ] Banner has appropriate warning styling
- [ ] Banner includes the hint text
- [ ] Normal dashboard displays when no error

---

### Task 10.7: Add CSV Field Validation

Add validation for required fields in `src/_data/tasks.js`:

```javascript
const REQUIRED_FIELDS = ['Name'];
const RECOMMENDED_FIELDS = ['Section/Column', 'Assignee', 'Due Date'];

function validateRecords(records) {
  const warnings = [];

  records.forEach((record, index) => {
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!record[field]?.trim()) {
        warnings.push(`Row ${index + 2}: Missing required field "${field}"`);
      }
    }
  });

  // Check if recommended fields exist in header
  if (records.length > 0) {
    const fields = Object.keys(records[0]);
    for (const field of RECOMMENDED_FIELDS) {
      if (!fields.includes(field)) {
        warnings.push(`CSV missing recommended column "${field}"`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('CSV validation warnings:');
    warnings.slice(0, 10).forEach(w => console.warn('  ' + w));
    if (warnings.length > 10) {
      console.warn(`  ... and ${warnings.length - 10} more warnings`);
    }
  }

  return warnings;
}
```

Call validation in `processRecords` before processing:

```javascript
const validationWarnings = validateRecords(records);
```

**Acceptance:**
- [ ] `validateRecords` function added
- [ ] Warnings logged for missing Name field
- [ ] Warnings logged for missing recommended columns
- [ ] Build still succeeds with warnings (non-blocking)
- [ ] `npm test` passes

---

## Session 10-C: Accessibility Improvements

### Task 10.8: Add ARIA Attributes to Filter Toggle

**Current state:** Filter button already has `aria-label` but is missing `aria-pressed`.

Update `src/_includes/components/filter-toggle.njk` to add `aria-pressed`:

```njk
{# BEFORE: #}
{# <button class="filter-btn active" id="filter-toggle" aria-label="Toggle task filter"> #}

{# AFTER: #}
<div class="filter-toggle">
  <button class="filter-btn active" id="filter-toggle"
          aria-label="Toggle task filter"
          aria-pressed="false">
    <span class="filter-label-all">All Tasks</span>
    <span class="filter-label-open">Open Only</span>
  </button>
</div>
```

Update the JavaScript in `src/_includes/layouts/base.njk` to toggle `aria-pressed`:

Find the filter toggle click handler and add:
```javascript
filterToggle.addEventListener('click', function() {
  const isPressed = this.getAttribute('aria-pressed') === 'true';
  this.setAttribute('aria-pressed', !isPressed);
  // ... existing toggle logic (classList toggle, etc.)
});
```

**Acceptance:**
- [ ] Filter button has `aria-pressed="false"` initial attribute
- [ ] `aria-pressed` toggles between "true"/"false" when button is clicked
- [ ] Existing filter functionality still works

---

### Task 10.9: Add Table Accessibility Attributes

Update table headers in `src/tasks.njk`:

```njk
<thead>
  <tr>
    <th scope="col" class="col-name">Name</th>
    <th scope="col" class="col-section">Section</th>
    <th scope="col" class="col-assignee">Assignee</th>
    <th scope="col" class="col-due">Due Date</th>
    <th scope="col" class="col-priority">Priority</th>
    <th scope="col" class="col-status">Status</th>
  </tr>
</thead>
```

Update table headers in `src/timeline.njk`:

```njk
<thead>
  <tr>
    <th scope="col" class="col-name">Task</th>
    <th scope="col" class="col-start">Start</th>
    <th scope="col" class="col-due">Due</th>
    <th scope="col" class="col-timeline">Timeline</th>
    <th scope="col" class="col-status">Status</th>
  </tr>
</thead>
```

**Acceptance:**
- [ ] All `<th>` elements have `scope="col"` attribute
- [ ] Tables pass accessibility linting
- [ ] Screen reader can identify column headers

---

### Task 10.10: Add Colorblind-Friendly Status Indicators

**Problem:** Status indicators rely solely on color, which is inaccessible to colorblind users.

**Current state:** `task-card.njk` uses text badges with `.task-status` class (lines 23-25):
```njk
{% if task.status %}
  <span class="task-status status-{{ task.status | lower | replace(' ', '-') }}">{{ task.status }}</span>
{% endif %}
```

**Solution:** Add shape prefixes to status badges while keeping text. This works with the existing structure.

Update `src/_includes/components/task-card.njk` status display:

```njk
{% if task.status %}
  <span class="task-status status-{{ task.status | lower | replace(' ', '-') }}">
    {# Shape indicator for colorblind users #}
    {% if task.status == 'On track' %}●{% elif task.status == 'At risk' %}▲{% elif task.status == 'Off track' %}■{% endif %}
    {{ task.status }}
  </span>
{% endif %}
```

Also update status badges in tables (`src/tasks.njk` and `src/timeline.njk`):

```njk
<span class="status-badge status-{{ task.status | lower | replace(' ', '-') }}">
  {% if task.status == 'On track' %}●{% elif task.status == 'At risk' %}▲{% elif task.status == 'Off track' %}■{% endif %}
  {{ task.status }}
</span>
```

Shapes used (Unicode):
- **On track:** ● (U+25CF Black Circle)
- **At risk:** ▲ (U+25B2 Black Up-Pointing Triangle)
- **Off track:** ■ (U+25A0 Black Square)

Add styles to `src/css/styles.css` for visually hidden utility (may be needed elsewhere):

```css
/* Visually Hidden (for screen readers) */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Acceptance:**
- [ ] Status badges show shape prefix (●, ▲, ■)
- [ ] Shapes appear before status text in cards and tables
- [ ] Existing color coding still works
- [ ] Shapes are distinguishable without color

---

### Task 10.11: Improve Build Script Error Messages

Update `scripts/build-versions.sh` to provide clearer error feedback:

Replace silent failures with explicit messages:

```bash
# Before:
# git checkout "$TAG" -- data/project.csv 2>/dev/null || continue

# After:
if ! git checkout "$TAG" -- data/project.csv 2>/dev/null; then
  echo "  Skipping $TAG: Could not checkout data/project.csv from this tag"
  continue
fi
```

Add validation at script start:

```bash
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
```

**Acceptance:**
- [ ] Script outputs message when skipping a tag
- [ ] Script exits with error if not in git repo
- [ ] Script exits with error if data/ directory missing
- [ ] Successful runs still work as before

---

## Session 10-D: Display Configuration

### Overview

Add configuration options to `dashana.config` for controlling:
- Which tabs (pages) appear in navigation
- Which columns display in Tasks and Timeline tables
- Which data items appear on Board cards

**Design Principles:**
- All options default to YES (shown) - only specify what you want to hide
- Human-readable YES/NO values (not true/false)
- Comments supported (lines starting with #)
- Config remains simple key=value format

### Task 10.12: Extend Config Parser

Update `src/_data/config.js` to parse display configuration options:

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function() {
  const configPath = path.join(__dirname, '../../dashana.config');

  // Default config - everything shown
  const config = {
    projectName: 'Project Report',
    customerName: 'Customer',
    siteBase: '',

    // Tab visibility (all shown by default)
    tabs: {
      dashboard: true,
      board: true,
      tasks: true,
      timeline: true
    },

    // Tasks table columns (all shown by default)
    tasksColumns: {
      name: true,
      progress: true,
      section: true,
      assignee: true,
      due: true,
      priority: true,
      status: true,
      tags: true,
      parent: true,
      notes: true,
      custom: true
    },

    // Timeline table columns (all shown by default)
    timelineColumns: {
      name: true,
      progress: true,
      section: true,
      start: true,
      due: true,
      duration: true,
      status: true,
      tags: true,
      parent: true,
      custom: true
    },

    // Board card items (all shown by default)
    cardItems: {
      progress: true,
      assignee: true,
      due: true,
      status: true,
      priority: true,
      tags: true,
      parent: true,
      notes: true,
      custom: true
    }
  };

  /**
   * Parse YES/NO value to boolean
   */
  function parseYesNo(value) {
    const v = value.trim().toUpperCase();
    return v === 'YES' || v === 'Y' || v === 'TRUE' || v === '1';
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) return;

      const key = line.substring(0, eqIndex).trim();
      const value = line.substring(eqIndex + 1).trim();

      // Core settings
      if (key === 'PROJECT_NAME') config.projectName = value;
      if (key === 'CUSTOMER_NAME') config.customerName = value;
      if (key === 'SITE_BASE') config.siteBase = value;

      // Tab visibility
      if (key === 'SHOW_DASHBOARD') config.tabs.dashboard = parseYesNo(value);
      if (key === 'SHOW_BOARD') config.tabs.board = parseYesNo(value);
      if (key === 'SHOW_TASKS') config.tabs.tasks = parseYesNo(value);
      if (key === 'SHOW_TIMELINE') config.tabs.timeline = parseYesNo(value);

      // Tasks columns
      if (key === 'TASKS_COL_NAME') config.tasksColumns.name = parseYesNo(value);
      if (key === 'TASKS_COL_PROGRESS') config.tasksColumns.progress = parseYesNo(value);
      if (key === 'TASKS_COL_SECTION') config.tasksColumns.section = parseYesNo(value);
      if (key === 'TASKS_COL_ASSIGNEE') config.tasksColumns.assignee = parseYesNo(value);
      if (key === 'TASKS_COL_DUE') config.tasksColumns.due = parseYesNo(value);
      if (key === 'TASKS_COL_PRIORITY') config.tasksColumns.priority = parseYesNo(value);
      if (key === 'TASKS_COL_STATUS') config.tasksColumns.status = parseYesNo(value);
      if (key === 'TASKS_COL_TAGS') config.tasksColumns.tags = parseYesNo(value);
      if (key === 'TASKS_COL_PARENT') config.tasksColumns.parent = parseYesNo(value);
      if (key === 'TASKS_COL_NOTES') config.tasksColumns.notes = parseYesNo(value);
      if (key === 'TASKS_COL_CUSTOM') config.tasksColumns.custom = parseYesNo(value);

      // Timeline columns
      if (key === 'TIMELINE_COL_NAME') config.timelineColumns.name = parseYesNo(value);
      if (key === 'TIMELINE_COL_PROGRESS') config.timelineColumns.progress = parseYesNo(value);
      if (key === 'TIMELINE_COL_SECTION') config.timelineColumns.section = parseYesNo(value);
      if (key === 'TIMELINE_COL_START') config.timelineColumns.start = parseYesNo(value);
      if (key === 'TIMELINE_COL_DUE') config.timelineColumns.due = parseYesNo(value);
      if (key === 'TIMELINE_COL_DURATION') config.timelineColumns.duration = parseYesNo(value);
      if (key === 'TIMELINE_COL_STATUS') config.timelineColumns.status = parseYesNo(value);
      if (key === 'TIMELINE_COL_TAGS') config.timelineColumns.tags = parseYesNo(value);
      if (key === 'TIMELINE_COL_PARENT') config.timelineColumns.parent = parseYesNo(value);
      if (key === 'TIMELINE_COL_CUSTOM') config.timelineColumns.custom = parseYesNo(value);

      // Card items
      if (key === 'CARD_SHOW_PROGRESS') config.cardItems.progress = parseYesNo(value);
      if (key === 'CARD_SHOW_ASSIGNEE') config.cardItems.assignee = parseYesNo(value);
      if (key === 'CARD_SHOW_DUE') config.cardItems.due = parseYesNo(value);
      if (key === 'CARD_SHOW_STATUS') config.cardItems.status = parseYesNo(value);
      if (key === 'CARD_SHOW_PRIORITY') config.cardItems.priority = parseYesNo(value);
      if (key === 'CARD_SHOW_TAGS') config.cardItems.tags = parseYesNo(value);
      if (key === 'CARD_SHOW_PARENT') config.cardItems.parent = parseYesNo(value);
      if (key === 'CARD_SHOW_NOTES') config.cardItems.notes = parseYesNo(value);
      if (key === 'CARD_SHOW_CUSTOM') config.cardItems.custom = parseYesNo(value);
    });
  } catch (e) {
    console.warn('dashana.config not found, using defaults');
  }

  return config;
};
```

**Acceptance:**
- [ ] Config parser handles # comments
- [ ] YES/NO values parsed correctly (case-insensitive)
- [ ] Default values are all true (shown)
- [ ] Setting `SHOW_BOARD=NO` results in `config.tabs.board === false`
- [ ] `npm run build` succeeds with unchanged config

---

### Task 10.13: Update Navigation for Tab Visibility

Update `src/_includes/components/header.njk` to conditionally show tabs:

```njk
<nav class="main-nav">
  {% if config.tabs.dashboard %}
    <a href="{{ config.siteBase }}/" class="nav-link {% if page.url == '/' %}active{% endif %}">Dashboard</a>
  {% endif %}
  {% if config.tabs.board %}
    <a href="{{ config.siteBase }}/board/" class="nav-link {% if page.url == '/board/' %}active{% endif %}">Board</a>
  {% endif %}
  {% if config.tabs.tasks %}
    <a href="{{ config.siteBase }}/tasks/" class="nav-link {% if page.url == '/tasks/' %}active{% endif %}">Tasks</a>
  {% endif %}
  {% if config.tabs.timeline %}
    <a href="{{ config.siteBase }}/timeline/" class="nav-link {% if page.url == '/timeline/' %}active{% endif %}">Timeline</a>
  {% endif %}
</nav>
```

Update each page template to redirect or show "disabled" when tab is hidden. In `src/board.njk`, `src/tasks.njk`, `src/timeline.njk`:

```njk
---
layout: layouts/base.njk
title: Board
permalink: /board/
---

{% if not config.tabs.board %}
<div class="page-disabled">
  <p>This view has been disabled in the configuration.</p>
  <a href="{{ config.siteBase }}/">Return to Dashboard</a>
</div>
{% else %}
{# existing page content #}
{% endif %}
```

Add styles for disabled page:

```css
/* Disabled Page */
.page-disabled {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-muted);
}

.page-disabled a {
  color: var(--color-accent);
}
```

**Acceptance:**
- [ ] Hidden tabs don't appear in navigation
- [ ] Direct URL access shows "disabled" message
- [ ] At least one tab must remain visible (Dashboard is sensible default)
- [ ] Navigation still works when all tabs enabled

---

### Task 10.14: Update Tasks Table for Column Visibility

Update `src/tasks.njk` to conditionally render columns:

**Header:**
```njk
<thead>
  <tr>
    {% if config.tasksColumns.name %}<th class="col-name">Name</th>{% endif %}
    {% if config.tasksColumns.progress %}<th class="col-completion">Progress</th>{% endif %}
    {% if config.tasksColumns.section %}<th class="col-section">Section</th>{% endif %}
    {% if config.tasksColumns.assignee %}<th class="col-assignee">Assignee</th>{% endif %}
    {% if config.tasksColumns.due %}<th class="col-due">Due Date</th>{% endif %}
    {% if config.tasksColumns.priority %}<th class="col-priority">Priority</th>{% endif %}
    {% if config.tasksColumns.status %}<th class="col-status">Status</th>{% endif %}
    {% if config.tasksColumns.tags %}<th class="col-tags">Tags</th>{% endif %}
    {% if config.tasksColumns.parent %}<th class="col-parent">Parent</th>{% endif %}
    {% if config.tasksColumns.notes %}<th class="col-notes">Notes</th>{% endif %}
    {% if config.tasksColumns.custom %}
      {% for fieldName in tasks.customFieldNames %}
      <th class="col-custom">{{ fieldName }}</th>
      {% endfor %}
    {% endif %}
  </tr>
</thead>
```

**Body cells** (wrap each `<td>` in same condition):
```njk
<tr class="...">
  {% if config.tasksColumns.name %}
    <td class="col-name">...</td>
  {% endif %}
  {% if config.tasksColumns.progress %}
    <td class="col-completion">...</td>
  {% endif %}
  {# ... etc for all columns #}
</tr>
```

**Acceptance:**
- [ ] Setting `TASKS_COL_NOTES=NO` hides Notes column header and cells
- [ ] Setting `TASKS_COL_CUSTOM=NO` hides all custom field columns
- [ ] Table renders correctly with various column combinations
- [ ] Name column should probably always show (consider making mandatory)

---

### Task 10.15: Update Timeline Table for Column Visibility

Update `src/timeline.njk` with same pattern as Tasks:

**Header:**
```njk
<thead>
  <tr>
    {% if config.timelineColumns.name %}<th class="col-name">Task</th>{% endif %}
    {% if config.timelineColumns.progress %}<th class="col-completion">Progress</th>{% endif %}
    {% if config.timelineColumns.section %}<th class="col-section">Section</th>{% endif %}
    {% if config.timelineColumns.start %}<th class="col-start">Start</th>{% endif %}
    {% if config.timelineColumns.due %}<th class="col-due">Due</th>{% endif %}
    {% if config.timelineColumns.duration %}<th class="col-bar">Duration</th>{% endif %}
    {% if config.timelineColumns.status %}<th class="col-status">Status</th>{% endif %}
    {% if config.timelineColumns.tags %}<th class="col-tags">Tags</th>{% endif %}
    {% if config.timelineColumns.parent %}<th class="col-parent">Parent</th>{% endif %}
    {% if config.timelineColumns.custom %}
      {% for fieldName in tasks.customFieldNames %}
      <th class="col-custom">{{ fieldName }}</th>
      {% endfor %}
    {% endif %}
  </tr>
</thead>
```

**Body cells** (wrap each in matching condition).

**Acceptance:**
- [ ] Setting `TIMELINE_COL_START=NO` hides Start column
- [ ] Duration bar column can be hidden independently
- [ ] Custom fields can be hidden as a group
- [ ] Table renders correctly with various combinations

---

### Task 10.16: Update Board Cards for Item Visibility

Update `src/_includes/components/task-card.njk` to conditionally render items:

```njk
<div class="task-card {% if task.isDone %}is-done{% endif %} {% if task.isOverdue %}is-overdue{% endif %} {% if task.isSubtask %}is-subtask{% endif %}">
  <div class="card-header">
    <span class="task-name">{{ task.name }}</span>
    {% if config.cardItems.progress %}
      {% if task.isDone %}
        <span class="completion-label completion-done">Done</span>
      {% else %}
        <span class="completion-label completion-open">Open</span>
      {% endif %}
    {% endif %}
  </div>

  <div class="card-meta">
    {% if config.cardItems.assignee and task.assignee and task.assignee != 'Unassigned' %}
      <span class="task-assignee">{{ task.assignee }}</span>
    {% endif %}

    {% if config.cardItems.due and task.dueDate %}
      <span class="task-due {% if task.isOverdue %}overdue{% endif %}">
        {{ task.dueDate }}
      </span>
    {% endif %}

    {% if config.cardItems.status and task.status %}
      <span class="task-status status-{{ task.status | lower | replace(' ', '-') }}">{{ task.status }}</span>
    {% endif %}
  </div>

  {% if config.cardItems.priority and task.priority and not task.isDone %}
    <span class="priority-badge priority-{{ task.priority | lower }}">
      {{ task.priority }}
    </span>
  {% endif %}

  {% if config.cardItems.tags and task.tags.length > 0 %}
    <div class="card-tags">
      {% for tag in task.tags %}
        <span class="tag-badge">{{ tag }}</span>
      {% endfor %}
    </div>
  {% endif %}

  {% if config.cardItems.parent and task.parentTask %}
    <div class="card-parent">↳ {{ task.parentTask }}</div>
  {% endif %}

  {% if config.cardItems.notes and task.notes %}
    <span class="card-notes-icon" title="{{ task.notes }}">📝</span>
  {% endif %}

  {% if config.cardItems.custom and task.customFields and tasks.customFieldNames.length > 0 %}
    <div class="card-custom-fields">
      {% for fieldName in tasks.customFieldNames %}
        {% if task.customFields[fieldName] %}
          <span class="custom-field">
            <span class="custom-field-name">{{ fieldName }}:</span>
            <span class="custom-field-value">{{ task.customFields[fieldName] }}</span>
          </span>
        {% endif %}
      {% endfor %}
    </div>
  {% endif %}
</div>
```

**Acceptance:**
- [ ] Setting `CARD_SHOW_TAGS=NO` hides tags on all cards
- [ ] Setting `CARD_SHOW_NOTES=NO` hides the notes icon
- [ ] Cards still display task name (always shown)
- [ ] Cards look correct with various item combinations
- [ ] Done/Open label respects `CARD_SHOW_PROGRESS` setting

---

### Example Configuration

A fully-commented example for `dashana.config`:

```ini
# Dashana Configuration
# =====================
# Only add lines you want to CHANGE from defaults.
# All display options default to YES (shown).

PROJECT_NAME=Cross-functional Project Plan
CUSTOMER_NAME=Acme Corp

# Tab Visibility
# --------------
# Set to NO to hide a tab from navigation
# SHOW_DASHBOARD=YES
# SHOW_BOARD=YES
# SHOW_TASKS=YES
# SHOW_TIMELINE=YES

# Tasks Table Columns
# -------------------
# Set to NO to hide a column (Name always shown)
# TASKS_COL_NAME=YES
# TASKS_COL_PROGRESS=YES
# TASKS_COL_SECTION=YES
# TASKS_COL_ASSIGNEE=YES
# TASKS_COL_DUE=YES
# TASKS_COL_PRIORITY=YES
# TASKS_COL_STATUS=YES
# TASKS_COL_TAGS=YES
# TASKS_COL_PARENT=YES
# TASKS_COL_NOTES=YES
# TASKS_COL_CUSTOM=YES

# Timeline Table Columns
# ----------------------
# Set to NO to hide a column
# TIMELINE_COL_NAME=YES
# TIMELINE_COL_PROGRESS=YES
# TIMELINE_COL_SECTION=YES
# TIMELINE_COL_START=YES
# TIMELINE_COL_DUE=YES
# TIMELINE_COL_DURATION=YES
# TIMELINE_COL_STATUS=YES
# TIMELINE_COL_TAGS=YES
# TIMELINE_COL_PARENT=YES
# TIMELINE_COL_CUSTOM=YES

# Board Card Items
# ----------------
# Set to NO to hide an item on cards (Name always shown)
# CARD_SHOW_PROGRESS=YES
# CARD_SHOW_ASSIGNEE=YES
# CARD_SHOW_DUE=YES
# CARD_SHOW_STATUS=YES
# CARD_SHOW_PRIORITY=YES
# CARD_SHOW_TAGS=YES
# CARD_SHOW_PARENT=YES
# CARD_SHOW_NOTES=YES
# CARD_SHOW_CUSTOM=YES
```

**Minimal config (hide some features):**
```ini
PROJECT_NAME=My Project
CUSTOMER_NAME=Acme Corp

# Hide Timeline tab
SHOW_TIMELINE=NO

# Simplify task table
TASKS_COL_TAGS=NO
TASKS_COL_PARENT=NO
TASKS_COL_NOTES=NO

# Minimal cards
CARD_SHOW_TAGS=NO
CARD_SHOW_CUSTOM=NO
```

---

## Session 10-E: Timeline Duration Bar Refactor

### Background

**Problem:** The current duration bar shows task position/width relative to the entire project timeline. This is confusing because:
- A 10-day task in a 100-day project shows as a tiny 10% bar
- Users can't tell actual task duration at a glance
- No indication of time elapsed vs. remaining

**Current implementation** (`tasks.js:195-217`):
```javascript
// Position within project span
startPercent = (taskStart - projectStart) / projectSpan * 100
// Width as fraction of project
widthPercent = taskDuration / projectSpan * 100
```

**New design:** Show elapsed time vs. total duration per task:
- Bar fills from left to right as time passes
- Text overlay shows actual days (e.g., "5d" or "3/7d")
- Green when on track, red when overdue, gray when done

---

### Task 10.17: Update Task Data Model for Duration Progress

Update `src/_data/tasks.js` to calculate elapsed/remaining days.

Add duration calculation helper after the existing helper functions:

```javascript
/**
 * Calculate duration info for a task.
 * Days calculation: inclusive of start, exclusive of end (e.g., Jan 1-5 = 4 days).
 */
function calculateDuration(startDate, dueDate, today) {
  const start = startDate ? new Date(startDate) : null;
  const end = dueDate ? new Date(dueDate) : null;

  // No dates = no duration
  if (!start && !end) {
    return null;
  }

  // Use start for both if only start, or due for both if only due
  const effectiveStart = start || end;
  const effectiveEnd = end || start;

  // Duration in days (exclusive of end)
  const durationDays = Math.max(1, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)));

  // Days elapsed from start to today (capped at duration)
  const elapsedMs = today - effectiveStart;
  const elapsedDays = Math.max(0, Math.min(durationDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24))));

  // Percentage elapsed (capped at 100)
  const percentElapsed = Math.min(100, Math.round((elapsedDays / durationDays) * 100));

  return {
    days: durationDays,
    elapsed: elapsedDays,
    remaining: Math.max(0, durationDays - elapsedDays),
    percentElapsed: percentElapsed,
    hasStarted: elapsedMs >= 0,
    isComplete: elapsedDays >= durationDays
  };
}
```

In `processRecords`, update the task object to include duration info:

```javascript
// After existing timeline calculation (around line 217)
task.duration = calculateDuration(task.startDate, task.dueDate, today);
```

Export for testing:
```javascript
module.exports.calculateDuration = calculateDuration;
```

**Acceptance:**
- [ ] `calculateDuration` function added
- [ ] Each task has `duration` property with `days`, `elapsed`, `remaining`, `percentElapsed`
- [ ] `npm test` passes

---

### Task 10.18: Update Timeline Template

Update `src/timeline.njk` to show new duration bar:

Replace the duration bar cell (lines 59-68):

```njk
<td class="col-bar">
  {% if task.duration %}
  <div class="duration-bar-container">
    <div class="duration-bar
                {% if task.isDone %}done{% elif task.isOverdue %}overdue{% elif task.duration.hasStarted %}in-progress{% else %}not-started{% endif %}"
         style="width: {{ task.duration.percentElapsed }}%">
    </div>
    <span class="duration-text">
      {% if task.isDone %}
        {{ task.duration.days }}d ✓
      {% elif task.isOverdue %}
        {{ task.duration.days }}d (overdue)
      {% elif task.duration.hasStarted %}
        {{ task.duration.elapsed }}/{{ task.duration.days }}d
      {% else %}
        {{ task.duration.days }}d
      {% endif %}
    </span>
  </div>
  {% else %}
  <span class="no-dates-label">No dates</span>
  {% endif %}
</td>
```

**Acceptance:**
- [ ] Duration bar shows percentage elapsed, not project-relative position
- [ ] Days displayed inside bar (e.g., "3/7d")
- [ ] Different states: not-started, in-progress, done, overdue

---

### Task 10.19: Update Duration Bar Styles

Update `src/css/styles.css` - replace timeline bar styles:

```css
/* Timeline Duration Bar (refactored) */
.duration-bar-container {
  position: relative;
  height: 24px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.duration-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: var(--color-border);
  border-radius: 3px 0 0 3px;
  transition: width 0.3s ease;
}

.duration-bar.in-progress {
  background: var(--color-accent);
}

.duration-bar.done {
  background: var(--color-on-track);
}

.duration-bar.overdue {
  background: var(--color-off-track);
}

.duration-bar.not-started {
  width: 0 !important;
}

.duration-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  z-index: 1;
}

/* Ensure text is readable on filled bars */
.duration-bar-container:has(.duration-bar.in-progress[style*="width: 100%"]) .duration-text,
.duration-bar-container:has(.duration-bar.done) .duration-text,
.duration-bar-container:has(.duration-bar.overdue) .duration-text {
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

/* Fallback for browsers without :has() - rely on contrast */
.duration-bar.done ~ .duration-text,
.duration-bar.overdue ~ .duration-text {
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
```

Remove or deprecate old timeline bar styles (`.timeline-bar-container`, `.timeline-bar`).

**Acceptance:**
- [ ] Bar fills left-to-right showing elapsed time
- [ ] Day count text visible and readable
- [ ] Different colors for states: gray (not started), blue (in progress), green (done), red (overdue)
- [ ] Text remains readable on both empty and filled bars

---

### Task 10.20: Add Duration Tests

Add tests to `tests/data-processing.test.js`:

```javascript
describe('calculateDuration', () => {
  const { calculateDuration } = require('../src/_data/tasks.js');

  test('calculates days inclusive start exclusive end', () => {
    const today = new Date('2026-01-10');
    const result = calculateDuration('2026-01-01', '2026-01-05', today);
    expect(result.days).toBe(4); // Jan 1, 2, 3, 4 (not 5)
  });

  test('calculates elapsed days', () => {
    const today = new Date('2026-01-03');
    const result = calculateDuration('2026-01-01', '2026-01-10', today);
    expect(result.elapsed).toBe(2); // Jan 1, 2
    expect(result.percentElapsed).toBe(22); // 2/9 ≈ 22%
  });

  test('caps elapsed at duration', () => {
    const today = new Date('2026-01-20'); // past due
    const result = calculateDuration('2026-01-01', '2026-01-10', today);
    expect(result.elapsed).toBe(9);
    expect(result.percentElapsed).toBe(100);
  });

  test('returns null when no dates', () => {
    const today = new Date('2026-01-10');
    expect(calculateDuration(null, null, today)).toBeNull();
  });

  test('handles start-only tasks', () => {
    const today = new Date('2026-01-05');
    const result = calculateDuration('2026-01-01', null, today);
    expect(result.days).toBe(1); // single day
  });
});
```

**Acceptance:**
- [ ] All new tests pass
- [ ] Existing tests still pass
- [ ] Edge cases covered: no dates, past due, future start

---

## Session 10-F: Light Theme Refinement

### Background

**Problem:** The current light theme uses pure white (#ffffff) backgrounds which can cause eye strain, especially during extended use. The theme needs to be "warmer" and less harsh while still feeling light and professional.

**Current light theme values** (`styles.css:1-32`):
```css
:root {
  --color-bg: #ffffff;        /* Pure white - TOO BRIGHT */
  --color-bg-alt: #f9fafb;    /* Near-white */
  --color-bg-tertiary: #f0f0f0;
  --color-text: #333333;
  --color-border: #e5e5e5;
  ...
}
```

**Goal:** Shift to softer off-white/warm gray tones that reduce contrast without looking "dirty" or washed out.

---

### Task 10.21: Update Light Theme Color Palette

Update `src/css/styles.css` `:root` section with softer colors:

```css
/* Light theme (default) - REFINED for reduced eye strain */
:root {
  /* Base colors - warmer, softer whites */
  --color-bg: #fafafa;              /* Was #ffffff - soft off-white */
  --color-bg-alt: #f5f5f4;          /* Was #f9fafb - warm light gray */
  --color-bg-tertiary: #e7e5e4;     /* Was #f0f0f0 - stone gray */
  --color-text: #292524;            /* Was #333333 - warm dark */
  --color-text-muted: #78716c;      /* Was #666666 - stone muted */
  --color-border: #d6d3d1;          /* Was #e5e5e5 - visible but soft */
  --color-accent: #0066cc;          /* Keep - good contrast */
  --color-accent-hover: #0052a3;    /* Keep */

  /* Status colors - slightly muted for softer appearance */
  --color-on-track: #16a34a;        /* Was #22c55e - slightly deeper green */
  --color-on-track-bg: #f0fdf4;     /* Keep */
  --color-at-risk: #ca8a04;         /* Was #eab308 - deeper amber */
  --color-at-risk-bg: #fefce8;      /* Keep */
  --color-off-track: #dc2626;       /* Was #ef4444 - slightly deeper red */
  --color-off-track-bg: #fef2f2;    /* Keep */

  /* Priority colors - match status adjustments */
  --color-priority-high: #dc2626;   /* Was #ef4444 */
  --color-priority-medium: #a16207; /* Keep - already warm */
  --color-priority-low: #15803d;    /* Keep */

  /* Component colors */
  --color-card-bg: #fafafa;         /* Match --color-bg */
  --color-card-border: var(--color-border);
  --color-table-header: #f5f5f4;    /* Match --color-bg-alt */
  --color-table-row-alt: rgba(0, 0, 0, 0.02);
  --color-table-hover: #e7e5e4;     /* Match --color-bg-tertiary */
}
```

**Color philosophy:**
- Shifted from pure grays to "stone" palette (slight warm undertone)
- Main background: #fafafa (98% white) instead of #ffffff (100%)
- Borders more visible but not harsh
- Status/priority colors slightly deeper for better readability on softer backgrounds

**Acceptance:**
- [ ] No pure white (#ffffff) backgrounds
- [ ] Text remains highly readable (WCAG AA contrast)
- [ ] Overall appearance feels "warmer" and softer
- [ ] Status badges still clearly distinguishable

---

### Task 10.22: Verify Contrast and Readability

After applying new colors, verify accessibility:

1. **Manual check:** View all pages (Dashboard, Board, Tasks, Timeline)
2. **Contrast verification:** Text should meet WCAG AA (4.5:1 for body text)

Key contrast checks:
| Element | Foreground | Background | Required |
|---------|------------|------------|----------|
| Body text | #292524 | #fafafa | 4.5:1 ✓ |
| Muted text | #78716c | #fafafa | 4.5:1 ✓ |
| Accent links | #0066cc | #fafafa | 4.5:1 ✓ |
| Table header text | #78716c | #f5f5f4 | 4.5:1 ✓ |

Calculated contrasts (verify with tool like WebAIM):
- #292524 on #fafafa = ~13.5:1 ✓
- #78716c on #fafafa = ~4.8:1 ✓
- #0066cc on #fafafa = ~5.4:1 ✓

**Acceptance:**
- [ ] All text passes WCAG AA contrast (4.5:1)
- [ ] No accessibility regressions
- [ ] Theme looks professional, not washed out
- [ ] Print stylesheet still works (may need separate check)

---

## Phase 10 Completion Checklist

**Session 10-A (Code Quality):**
- [ ] Biome installed and configured
- [ ] Lint scripts added to package.json
- [ ] CI pipeline includes lint step

**Session 10-B (Robustness):**
- [ ] Date handling uses UTC normalization
- [ ] Error state displays when CSV fails
- [ ] CSV validation logs warnings

**Session 10-C (Accessibility):**
- [ ] Filter toggle has ARIA attributes
- [ ] Tables have scope attributes
- [ ] Status indicators have distinct shapes (●▲■)
- [ ] Build script has clear error messages

**Session 10-D (Display Configuration):**
- [ ] Config parser handles display settings
- [ ] Tab visibility controls navigation
- [ ] Tasks table respects column settings
- [ ] Timeline table respects column settings
- [ ] Board cards respect item settings
- [ ] Example config documented

**Session 10-E (Duration Bar):**
- [ ] `calculateDuration` function implemented
- [ ] Tasks have elapsed/remaining day counts
- [ ] Duration bar shows progress (left-to-right fill)
- [ ] Day count text displayed inside bar
- [ ] Color states: gray/blue/green/red
- [ ] Duration tests pass

**Session 10-F (Light Theme):**
- [ ] Background shifted from pure white to off-white (#fafafa)
- [ ] Borders and muted text use warm stone tones
- [ ] Status colors slightly deeper for contrast
- [ ] All text passes WCAG AA contrast (4.5:1)
- [ ] Theme feels softer but professional

**Final Verification:**
- [ ] All tests pass: `npm test`
- [ ] Lint passes: `npm run lint`
- [ ] Site builds: `npm run build`
- [ ] Test with modified config (hide some tabs/columns)
- [ ] Duration bars display correctly on timeline page

---

## How to Start This Phase

### Session 10-A (Code Quality Tooling)
```
Read plans/PHASE-10-ROBUSTNESS.md and implement session 10-A.
```

### Session 10-B (Date Handling & Error States)
```
/clear
Read plans/PHASE-10-ROBUSTNESS.md and implement session 10-B.
```

### Session 10-C (Accessibility)
```
/clear
Read plans/PHASE-10-ROBUSTNESS.md and implement session 10-C.
```

### Session 10-D (Display Configuration)
```
/clear
Read plans/PHASE-10-ROBUSTNESS.md and implement session 10-D.
```

### Session 10-E (Duration Bar Refactor)
```
/clear
Read plans/PHASE-10-ROBUSTNESS.md and implement session 10-E.
```

### Session 10-F (Light Theme Refinement)
```
/clear
Read plans/PHASE-10-ROBUSTNESS.md and implement session 10-F.
```

---

## Reference: Original Code Review

This phase implements findings from the January 2026 code review. The full analysis with additional low-priority recommendations is preserved in `plans/CODE-REVIEW-2026-01.md`.

### Priority Matrix

| Improvement | Impact | Effort | Status |
|------------|--------|--------|--------|
| Add Biome linting | High | Low | Task 10.1-10.3 |
| Fix date timezone handling | High | Low | Task 10.4 |
| Improve error handling | High | Low | Task 10.5-10.6 |
| Add filter toggle ARIA | Medium | Low | Task 10.8 |
| Add colorblind-friendly indicators | High | Medium | Task 10.10 |
| Input validation for CSV | Medium | Low | Task 10.7 |
| Build script error handling | Medium | Low | Task 10.11 |
| Table accessibility | Medium | Low | Task 10.9 |
| Display configuration | High | Medium | Task 10.12-10.16 |
| **Duration bar refactor** | **High** | **Medium** | Task 10.17-10.20 |
| **Light theme refinement** | **High** | **Low** | Task 10.21-10.22 |
