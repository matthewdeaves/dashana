# Phase 10: Robustness & Code Quality

> **Goal:** Improve error handling, date consistency, accessibility, code quality tooling, and display configuration.
> **Sessions:** 4
> **Prerequisites:** Phases 1-9 complete (working site)

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

**Out of Scope (future consideration):**
- CSS modularization (large refactor, minimal user impact)
- JSON config format (current format works well)
- CSP headers (GitHub Pages limitations)
- Test architecture refactor (tests already pass reliably)

---

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 10-A | 10.1 - 10.3 | Biome setup, lint scripts, CI integration |
| 10-B | 10.4 - 10.7 | Date handling, error states, CSV validation |
| 10-C | 10.8 - 10.11 | Accessibility improvements |
| 10-D | 10.12 - 10.16 | Display configuration (tabs, columns, cards) |

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

Update `src/_includes/components/filter-toggle.njk`:

```njk
<button id="filter-toggle"
        class="filter-btn"
        type="button"
        aria-pressed="false"
        aria-label="Filter to show open tasks only">
  <span class="filter-label">Show Open Only</span>
</button>
```

Update the JavaScript in `src/_includes/layouts/base.njk` (or wherever the toggle script lives):

```javascript
filterToggle.addEventListener('click', function() {
  const isPressed = this.getAttribute('aria-pressed') === 'true';
  this.setAttribute('aria-pressed', !isPressed);
  // ... existing toggle logic
});
```

**Acceptance:**
- [ ] Filter button has `aria-pressed` attribute
- [ ] Filter button has `aria-label` attribute
- [ ] `aria-pressed` updates when button is clicked
- [ ] Button is keyboard accessible (can activate with Enter/Space)

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

Update `src/_includes/components/task-card.njk` (or wherever status is displayed):

```njk
<span class="status-indicator status-{{ task.status | lower | replace(' ', '-') }}">
  <span class="visually-hidden">{{ task.status }}</span>
  {% if task.status == 'On track' %}
    <svg aria-hidden="true" class="status-icon" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="6"/>
    </svg>
  {% elif task.status == 'At risk' %}
    <svg aria-hidden="true" class="status-icon" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l7 14H1L8 1z"/>
    </svg>
  {% elif task.status == 'Off track' %}
    <svg aria-hidden="true" class="status-icon" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="2" width="12" height="12"/>
    </svg>
  {% else %}
    <svg aria-hidden="true" class="status-icon" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="6"/>
    </svg>
  {% endif %}
</span>
```

Shapes used:
- **On track:** Circle (universal "good" shape)
- **At risk:** Triangle (warning shape)
- **Off track:** Square (stop/alert shape)

Add styles to `src/css/styles.css`:

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

/* Status Icons */
.status-icon {
  width: 12px;
  height: 12px;
}

.status-on-track .status-icon { color: var(--color-on-track); }
.status-at-risk .status-icon { color: var(--color-at-risk); }
.status-off-track .status-icon { color: var(--color-off-track); }
```

**Acceptance:**
- [ ] Status indicators show distinct shapes (circle, triangle, square)
- [ ] Screen reader announces status text via `.visually-hidden`
- [ ] Icons maintain color coding for sighted users
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
- [ ] Status indicators have distinct shapes
- [ ] Build script has clear error messages

**Session 10-D (Display Configuration):**
- [ ] Config parser handles display settings
- [ ] Tab visibility controls navigation
- [ ] Tasks table respects column settings
- [ ] Timeline table respects column settings
- [ ] Board cards respect item settings
- [ ] Example config documented

**Final Verification:**
- [ ] All tests pass: `npm test`
- [ ] Lint passes: `npm run lint`
- [ ] Site builds: `npm run build`
- [ ] Test with modified config (hide some tabs/columns)

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
