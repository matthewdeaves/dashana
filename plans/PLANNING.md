# Dashana - Project Overview

## What We're Building

A **template repository** that transforms Asana CSV exports into beautiful static report websites.

### Template Model

```
dashana (GitHub template repo)
    ├── "Use this template" → customer-a-dashana
    ├── "Use this template" → customer-b-dashana
    └── "Use this template" → customer-c-dashana
```

- **GitHub Template Repository** - Customers click "Use this template" to create independent repos
- Customer repos can pull updates from the template via git remote + merge
- `.gitattributes` ensures `data/project.csv` and `dashana.config` are never overwritten during syncs
- Each customer repo has its own data and config
- Builds triggered by pushing tags (e.g., `v2026-01-15`)
- Template repo includes sample data for a working demo site

## Requirements

| Requirement | Details |
|-------------|---------|
| Views | Dashboard, Kanban board, Task list table, Timeline table |
| Versioning | Build historical versions from git history, organized by date |
| Style | Clean minimal, professional/corporate, light/dark mode |
| Interactivity | Static HTML only, no JavaScript |
| Data | Single CSV file per repo (`data/project.csv`) |
| **Dynamic Data** | Handle any number of sections, statuses, priorities, and tasks |
| Config | `dashana.config` for project/customer name |
| Print | Print-optimized stylesheet for PDF exports |
| Deployment | GitHub Pages, triggered by tag push |

## Dynamic Data Handling

The tool must handle varying Asana board structures without code changes:

### What Can Vary
- **Sections/Columns**: Any names (e.g., "Backlog", "In Progress", "QA", "Shipped")
- **Number of sections**: 3 columns or 10 columns
- **Status values**: Any custom status names the customer uses
- **Priority values**: Any priority scheme (High/Medium/Low, P1/P2/P3, etc.)
- **Number of tasks**: From 10 to 1000+ tasks
- **Assignees**: Any number of team members

### How It Works
- Sections discovered dynamically from CSV in order of first appearance
- "Done" sections detected by pattern matching: done, complete, completed, finished, closed, resolved
- Status/priority values collected dynamically from data
- All templates iterate over dynamic data, never hardcode values
- CSS classes generated from data values (e.g., "On track" → `status-on-track`)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
├─────────────────────────────────────────────────────────────┤
│  data/project.csv          ← Customer's Asana export         │
│  dashana.config            ← Customer name, project name     │
│  .gitattributes            ← Protects customer files on sync │
├─────────────────────────────────────────────────────────────┤
│  src/_data/tasks.js        ← Parses CSV into data            │
│  src/_data/config.js       ← Reads dashana.config            │
├─────────────────────────────────────────────────────────────┤
│  src/*.njk                 ← Page templates                  │
│  src/_includes/            ← Components & layouts            │
│  src/css/                  ← Styles + print.css              │
├─────────────────────────────────────────────────────────────┤
│  .github/workflows/        ← Tag-triggered build & deploy    │
│  scripts/build-versions.sh ← Builds all historical versions  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (_site/)                     │
├─────────────────────────────────────────────────────────────┤
│  /                    → Latest report                        │
│  /2026-01-13/         → Report as of Jan 13                  │
│  /2026-01-15/         → Report as of Jan 15                  │
│  /versions/           → Index of all versions                │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
dashana/
├── .gitattributes              # Merge strategy for customer files
├── .github/
│   └── workflows/
│       └── build.yml           # GitHub Actions (tag-triggered)
├── data/
│   └── project.csv             # Asana export
├── src/
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── base.njk        # Base HTML layout
│   │   └── components/
│   │       ├── header.njk      # Site header with version nav
│   │       ├── dashboard.njk   # Dashboard metrics
│   │       ├── board.njk       # Kanban board
│   │       ├── table.njk       # Task list table
│   │       └── timeline.njk    # Timeline table
│   ├── _data/
│   │   ├── tasks.js            # CSV parser
│   │   └── config.js           # Config reader
│   ├── css/
│   │   ├── styles.css          # Main styles
│   │   └── print.css           # Print styles
│   ├── index.njk               # Dashboard page
│   ├── board.njk               # Kanban page
│   ├── tasks.njk               # Task list page
│   └── timeline.njk            # Timeline page
├── scripts/
│   └── build-versions.sh       # Version builder
├── plans/                      # Implementation plans
├── dashana.config              # Project config
├── .eleventy.js                # 11ty config
├── package.json
├── CLAUDE.md                   # Quick reference
└── README.md
```

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Static Generator | 11ty (Eleventy) | Fast, flexible, great for data-driven sites |
| Templating | Nunjucks | Powerful, readable, good 11ty integration |
| Styling | Pure CSS | No build step, print-friendly, minimal |
| Hosting | GitHub Pages | Free, integrates with Actions |
| CI/CD | GitHub Actions | Tag-triggered, builds all versions |

## Page Designs

### Dashboard (index.njk)
- Task counts by section (dynamically discovered from data)
- Priority breakdown with visual bars (any priority values)
- Status breakdown with color coding (any status values)
- Completion percentage with progress bar
- Overdue task count
- Tasks grouped by assignee
- Navigation to other views
- Version selector

### Kanban Board (board.njk)
- Dynamic columns matching sections from data
- Task cards with: Name, Assignee, Due date, Priority badge, Status indicator
- Color-coded status indicators

### Task List (tasks.njk)
- Table with columns: Name, Section, Assignee, Due Date, Priority, Status
- Pre-sorted by section, then priority
- Visual badges for priority/status
- Alternating row colors

### Timeline (timeline.njk)
- Columns: Task Name, Start Date, Due Date, Duration Bar, Status
- Visual bars showing date ranges
- Overdue tasks highlighted

## CSS Design System

### Colors
```css
/* Background & Text */
--color-bg: #ffffff;
--color-text: #333333;
--color-border: #e5e5e5;
--color-accent: #0066cc;

/* Status */
--color-on-track: #22c55e;
--color-at-risk: #eab308;
--color-off-track: #ef4444;

/* Priority */
--color-priority-high: #ef4444;
--color-priority-medium: #eab308;
--color-priority-low: #22c55e;
```

### Typography
- System font stack
- 16px base size
- Clear hierarchy with weight/size

### Components
- Cards with subtle shadows
- 4px border radius
- Generous whitespace

## Phase Overview

| Phase | Focus | Sessions |
|-------|-------|----------|
| 1 | Project Setup | 1 |
| 2 | Data Layer | 1 |
| 3 | Dashboard | 2 |
| 4 | Kanban Board | 1-2 |
| 5 | Task List | 1 |
| 6 | Timeline | 1 |
| 7 | Versioning | 2 |
| 8 | GitHub Actions | 1 |
| 9 | Polish | 1-2 |
| 10 | Robustness & Code Quality | 3 |

See individual `PHASE-*.md` files for detailed implementation plans.

## Deployment Workflow

### For Template Development
```bash
npm run dev    # Local development
npm run build  # Test production build
```

### For Customer Repos
```bash
# Update data
cp ~/Downloads/asana-export.csv data/project.csv
git add data/project.csv
git commit -m "Update project data"
git tag v2026-01-15
git push && git push --tags
# GitHub Actions builds and deploys automatically
```

### Syncing Template Updates
```bash
# In customer repo (one-time setup)
git remote add template <template-repo-url>

# To sync updates
git fetch template
git merge template/main --allow-unrelated-histories
# .gitattributes ensures data/project.csv and dashana.config are preserved
git push && git tag vYYYY-MM-DD && git push --tags
```
