# Dashana - Asana Export to Static Report Website

## Overview
A template repository that transforms Asana CSV exports into beautiful static report websites using 11ty and GitHub Pages. One repo per customer, auto-updates on data commits. Uses git commit history to provide version snapshots of the report over time.

## Requirements Summary
- **Views**: Dashboard, Kanban board, Task list table, Timeline table
- **Versioning**: Build all historical versions, organized by date (e.g., `/2026-01-13/`)
- **Style**: Clean minimal, white background, professional/corporate
- **Interactivity**: Static HTML only, no JavaScript
- **Data**: Single CSV file per repo (`data/project.csv`)
- **Config**: `dashana.config` file for project/customer name (safe to commit)
- **Print**: Print-optimized stylesheet for clean PDF exports

---

## Repository Structure

```
dashana/
├── .github/
│   └── workflows/
│       └── build.yml           # GitHub Actions workflow
├── data/
│   └── project.csv             # Asana export (user commits updates here)
├── src/
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── base.njk        # Base HTML layout
│   │   └── components/
│   │       ├── header.njk      # Site header with version nav
│   │       ├── dashboard.njk   # Dashboard metrics component
│   │       ├── board.njk       # Kanban board component
│   │       ├── table.njk       # Task list table component
│   │       └── timeline.njk    # Timeline table component
│   ├── _data/
│   │   ├── tasks.js            # 11ty data file - parses CSV
│   │   └── config.js           # Reads dashana.config
│   ├── css/
│   │   ├── styles.css          # All styles (clean minimal theme)
│   │   └── print.css           # Print-optimized styles
│   ├── index.njk               # Main page (dashboard + navigation)
│   ├── board.njk               # Kanban board page
│   ├── tasks.njk               # Task list page
│   └── timeline.njk            # Timeline page
├── scripts/
│   └── build-versions.sh       # Script to build all historical versions
├── dashana.config              # Project config (name, customer)
├── .eleventy.js                # 11ty configuration
├── package.json
└── README.md
```

### dashana.config format
Simple key=value format (safe to commit, no GitHub warnings):
```
PROJECT_NAME=Cross-functional Project Plan
CUSTOMER_NAME=Acme Corp
```

---

## Page Designs

### 1. Dashboard (index.njk)
Comprehensive metrics overview:
- **Task Counts**: Total tasks, tasks per section (To do, Doing, Testing, Reviewing, Done)
- **Priority Breakdown**: High/Medium/Low counts with visual bars
- **Status Breakdown**: On track/At risk/Off track counts with color coding
- **Completion %**: Visual progress bar
- **Overdue Tasks**: Count of tasks past due date
- **By Assignee**: Task counts grouped by assignee
- **Navigation**: Links to Board, Tasks, Timeline pages
- **Version Selector**: List of available report versions by date

### 2. Kanban Board (board.njk)
- 5 columns: To do | Doing | Testing | Reviewing | Done
- Each task card shows: Name, Assignee, Due date, Priority badge, Status indicator
- Color-coded status: green (On track), yellow (At risk), red (Off track)

### 3. Task List (tasks.njk)
- Sortable-looking table (pre-sorted by section, then priority)
- Columns: Name, Section, Assignee, Due Date, Priority, Status
- Visual priority badges (High=red, Medium=yellow, Low=green)
- Alternating row colors for readability

### 4. Timeline (timeline.njk)
- Table with columns: Task Name, Start Date, Due Date, Duration Bar, Status
- Visual progress bars showing date ranges relative to project span
- Highlights overdue tasks in red

---

## Versioning System

### How it works:
1. User commits updated `data/project.csv` to the repo
2. GitHub Action triggers on push
3. Build script iterates through all commits that modified the CSV
4. Generates a separate build for each version in `/YYYY-MM-DD/` folders
5. Latest version is also built at root `/`

### URL Structure:
```
/                    → Latest report
/2026-01-13/         → Report as of Jan 13
/2026-01-15/         → Report as of Jan 15
/versions/           → Index of all available versions
```

### Version Navigation:
- Each page has a version dropdown/list in the header
- `/versions/` page lists all snapshots with dates

---

## GitHub Actions Workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for versioning

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Build all versions
        run: ./scripts/build-versions.sh

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

---

## CSS Design System (Clean Minimal)

### Colors:
- Background: #ffffff
- Text: #333333
- Borders: #e5e5e5
- Accent: #0066cc (links, highlights)
- Status colors:
  - On track: #22c55e (green)
  - At risk: #eab308 (yellow)
  - Off track: #ef4444 (red)
- Priority colors:
  - High: #ef4444
  - Medium: #eab308
  - Low: #22c55e

### Typography:
- Font: System font stack (clean, fast loading)
- Headings: Bold, slightly larger
- Body: 16px base

### Components:
- Cards with subtle shadows
- Rounded corners (4px)
- Generous whitespace
- Clear visual hierarchy

---

## Implementation Steps

### Phase 1: Project Setup
1. Initialize npm project with 11ty
2. Create directory structure
3. Set up base 11ty config (.eleventy.js)
4. Create base layout template

### Phase 2: Data Layer
1. Create config parser in `_data/config.js` (reads dashana.config)
2. Create CSV parser in `_data/tasks.js`
3. Add computed fields (overdue, duration, etc.)
4. Create helper filters for templates

### Phase 3: Dashboard Page
1. Build dashboard layout
2. Implement all metric calculations
3. Style with clean minimal CSS

### Phase 4: Board Page
1. Create Kanban column layout
2. Build task card component
3. Style columns and cards

### Phase 5: Task List Page
1. Create table structure
2. Add sorting logic (section → priority)
3. Style table with badges

### Phase 6: Timeline Page
1. Build timeline table
2. Calculate date range bars (CSS widths)
3. Highlight overdue items

### Phase 7: Versioning System
1. Create build-versions.sh script
2. Modify 11ty config for version paths
3. Add version navigation to header
4. Create versions index page

### Phase 8: GitHub Actions
1. Create workflow file
2. Test build process
3. Configure GitHub Pages deployment

### Phase 9: Polish
1. Responsive design tweaks
2. Print stylesheet (print.css) - clean layout for PDF export, hide navigation
3. Final testing across versions

---

## Verification Plan
1. Run `npm run build` locally to verify 11ty generates all pages
2. Check each page renders correctly: Dashboard, Board, Tasks, Timeline
3. Commit a second CSV version, verify both versions build
4. Push to GitHub, verify Actions workflow succeeds
5. Check deployed GitHub Pages site loads all versions
