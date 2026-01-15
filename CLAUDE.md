# Dashana - Developer Reference

## What Is This?

GitHub template repository that transforms Asana CSV exports into static report websites. Customers use "Use this template" to create their own repo, then push data updates with tags to trigger builds.

## Tech Stack

- **11ty (Eleventy) 3.x** - Static site generator
- **Nunjucks** - Templating language
- **Pure CSS** - No frameworks, CSS custom properties for theming
- **GitHub Actions** - Build on tag push, deploy to GitHub Pages
- **Jest** - Testing framework

## Key Constraints

- **Minimal JavaScript** - Theme toggle only, everything else is static HTML
- **Light/dark mode** - Class-based toggle with `prefers-color-scheme` fallback
- **Print-friendly** - Optimized print.css for PDF exports
- **Template-based** - Customer repos created via GitHub's "Use this template"
- **Sync-friendly** - `.gitattributes` protects customer data during merges
- **Tag-triggered builds** - Supports various formats: `v2026-01-15`, `2026-01-15`, `release-2026.01.15`

## Project Structure

```
dashana/
├── src/
│   ├── _data/           # Data processing layer
│   │   ├── tasks.js     # CSV parsing, stats calculation
│   │   ├── config.js    # Customer configuration
│   │   └── versions.js  # Version history for navigation
│   ├── _includes/
│   │   ├── layouts/     # Base HTML template
│   │   └── components/  # Reusable UI components
│   ├── css/
│   │   ├── styles.css   # Main stylesheet (~1100 lines)
│   │   └── print.css    # Print-optimized styles
│   ├── index.njk        # Dashboard page
│   ├── board.njk        # Kanban board view
│   ├── tasks.njk        # Task list table
│   ├── timeline.njk     # Gantt-style timeline
│   └── versions.njk     # Version history page
├── data/
│   └── project.csv      # Customer's Asana export
├── scripts/
│   └── build-versions.sh # Multi-version build script
├── tests/
│   ├── data-processing.test.js
│   ├── views.test.js
│   ├── integration.test.js
│   └── fixtures/
├── .github/workflows/
│   └── build.yml        # CI/CD pipeline
├── dashana.config       # Customer configuration
├── .eleventy.js         # 11ty configuration
└── .gitattributes       # Merge strategy for customer files
```

## Data Flow

```
data/project.csv
       │
       ▼
src/_data/tasks.js ──────► Global `tasks` object
       │                   ├── all: Task[]
       │                   ├── sections: { [name]: Task[] }
       │                   ├── sectionNames: string[]
       │                   ├── stats: Statistics
       │                   ├── timeline: Task[]
       │                   └── projectRange: DateRange
       ▼
Templates (*.njk) ──────► _site/ (static HTML)
```

## Configuration

**dashana.config** - Customer settings (key=value format, supports # comments):

```ini
# Core Settings
PROJECT_NAME=My Project
CUSTOMER_NAME=Acme Corp
SITE_BASE=              # Optional: for subdirectory deployment (e.g., /dashana)

# View Names (navigation buttons and browser tab titles)
DASHBOARD_NAME=Dashboard
BOARD_NAME=Board
TASKS_NAME=Tasks
TIMELINE_NAME=Timeline

# Page Headings (main h2 on each page)
DASHBOARD_HEADING=Project Overview
BOARD_HEADING=Kanban Board
TASKS_HEADING=Task List
TIMELINE_HEADING=Timeline

# Tab Visibility (all YES by default, set NO to hide)
SHOW_DASHBOARD=YES
SHOW_BOARD=YES
SHOW_TASKS=YES
SHOW_TIMELINE=YES

# Tasks Table Columns (all YES by default)
TASKS_COL_NAME=YES
TASKS_COL_PROGRESS=YES
TASKS_COL_SECTION=YES
TASKS_COL_ASSIGNEE=YES
TASKS_COL_DUE=YES
TASKS_COL_PRIORITY=YES
TASKS_COL_STATUS=YES
TASKS_COL_TAGS=YES
TASKS_COL_PARENT=YES
TASKS_COL_NOTES=YES           # Icon with tooltip
TASKS_COL_NOTES_TEXT=YES      # Inline text column (default: YES)
TASKS_NOTES_TEXT_MODE=PREVIEW # PREVIEW (truncated) or FULL
TASKS_COL_CUSTOM=YES

# Timeline Table Columns (all YES by default)
TIMELINE_COL_NAME=YES
TIMELINE_COL_PROGRESS=YES
TIMELINE_COL_SECTION=YES
TIMELINE_COL_START=YES
TIMELINE_COL_DUE=YES
TIMELINE_COL_DURATION=YES
TIMELINE_COL_STATUS=YES
TIMELINE_COL_TAGS=YES
TIMELINE_COL_PARENT=YES
TIMELINE_COL_NOTES=YES           # Icon with tooltip
TIMELINE_COL_NOTES_TEXT=YES      # Inline text column (default: YES)
TIMELINE_NOTES_TEXT_MODE=PREVIEW # PREVIEW (truncated) or FULL
TIMELINE_COL_CUSTOM=YES

# Board Card Items (all YES by default)
CARD_SHOW_PROGRESS=YES
CARD_SHOW_ASSIGNEE=YES
CARD_SHOW_DUE=YES
CARD_SHOW_STATUS=YES
CARD_SHOW_PRIORITY=YES
CARD_SHOW_TAGS=YES
CARD_SHOW_PARENT=YES
CARD_SHOW_NOTES=YES
CARD_SHOW_CUSTOM=YES

# Notes Text Settings
NOTES_TEXT_PREVIEW_LENGTH=100 # Character limit for PREVIEW mode (default: 100)
```

**Minimal config** (only override what you need):
```ini
PROJECT_NAME=My Project
CUSTOMER_NAME=Acme Corp
SHOW_TIMELINE=NO
TASKS_COL_NOTES=NO
```

## CSS Architecture

### Color Tokens
```css
/* Status */
--color-on-track: #22c55e;
--color-at-risk: #eab308;
--color-off-track: #ef4444;

/* Priority */
--color-priority-high: #ef4444;
--color-priority-medium: #a16207;
--color-priority-low: #15803d;

/* Base */
--color-bg: #ffffff;
--color-bg-alt: #f9fafb;
--color-text: #333333;
--color-text-muted: #666666;
--color-border: #e5e5e5;
--color-accent: #0066cc;
```

### Theme System
- `html.dark` / `html.light` classes set by JavaScript
- `@media (prefers-color-scheme: dark)` fallback for no-JS
- Theme preference persisted to `localStorage`

### Responsive Breakpoints
- 1200px: 3-column board
- 900px: 2-column board, stacked header
- 768px: Single column, hide table columns
- 600px: Compact navigation

## Dynamic Data Handling

The tool adapts to ANY Asana board structure:

- **Sections**: Discovered from CSV `Section/Column` field
- **Status/Priority**: Collected dynamically, not hardcoded
- **Done detection**: Pattern matches section names containing: done, complete, completed, finished, closed, resolved

```njk
{# CORRECT: Dynamic iteration #}
{% for section, count in tasks.stats.bySection %}...{% endfor %}

{# WRONG: Hardcoded values #}
{{ tasks.stats.bySection['To do'] }}
```

## Key Functions (tasks.js)

```javascript
// Check if section represents completed tasks
isDoneSection(section)  // → boolean

// Check if task is past due
isOverdue(dueDate, section, today)  // → boolean

// Get sort order for priority
priorityOrder(priority)  // → 1-4 (High=1, Medium=2, Low=3, None=4)

// Main processing function
processRecords(records, today?)  // → { all, sections, stats, timeline, ... }
```

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Local dev server (http://localhost:8080)
npm run build            # Production build to _site/
npm test                 # Run unit and view tests
npm run test:watch       # Watch mode for tests
npm run test:integration # Test against actual CSV data

# Development with mock versions
DEV_VERSIONS=true npm run dev
```

## Version System

### Tag Formats Supported
- `v2026-01-15` (recommended)
- `2026-01-15`
- `release-2026-01-15`
- `2026.01.15`

### Build Process
1. Latest data built to `_site/`
2. Each tagged version built to `_site/<date>/`
3. `versions.json` generated for navigation

### Triggering Builds
```bash
git tag v2026-01-15
git push --tags
```

## Template Workflow

1. Click "Use this template" on GitHub
2. Update `dashana.config` with project/customer names
3. Replace `data/project.csv` with Asana export
4. Push with tag to build and deploy

## Syncing Template Updates

```bash
git remote add template git@github.com:org/dashana.git
git fetch template
git merge template/main --allow-unrelated-histories
```

The `.gitattributes` ensures `data/project.csv` and `dashana.config` keep customer values.

## Testing

### Unit Tests (data-processing.test.js)
- `isDoneSection()` - Done section detection
- `isOverdue()` - Overdue calculation
- `priorityOrder()` - Priority sorting
- `processRecords()` - Full CSV processing

### View Tests (views.test.js)
- Dashboard metrics rendering
- Board column structure
- Task table content
- Timeline visualization

### Integration Tests
```bash
npm run test:integration  # Tests against actual data/project.csv
```

## Exported Functions

`src/_data/tasks.js` exports for testing:
```javascript
const { isDoneSection, isOverdue, priorityOrder, processRecords } = require('./src/_data/tasks.js');
```
