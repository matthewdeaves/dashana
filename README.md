# Dashana

Share project status with customers who don't have access to your Asana instance. Export your Asana project to CSV, push to this template repo, and get a configurable status report published to GitHub Pages.

**[Live Demo](https://matthewdeaves.github.io/dashana/)**

## How It Works

Dashana displays your Asana data exactly as exported - tasks stay in their sections, statuses remain unchanged. This makes it ideal for projects used as process checklists where task placement is intentional. The only calculated field is **Duration** (days between start and due dates).

## Quick Start

1. **Click "Use this template"** on GitHub to create your repo
2. **Update config** in `dashana.config`
3. **Add data** - export from Asana and save to `data/project.csv`
4. **Push a tag** to deploy:
   ```bash
   git add .
   git commit -m "Update project data"
   git tag v2026-01-15
   git push && git push --tags
   ```

## Setup GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", select **GitHub Actions**
3. Push a tag to trigger the first build

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:8080

## Updating Data

1. Export CSV from Asana (Project → Export → CSV)
2. Replace `data/project.csv`
3. Commit and tag:
   ```bash
   git add data/project.csv
   git commit -m "Update: 2026-01-15"
   git tag v2026-01-15
   git push && git push --tags
   ```

## Syncing Template Updates

Pull improvements from the main Dashana template. Your `data/project.csv` and `dashana.config` are protected by `.gitattributes` and won't be overwritten.

```bash
# One-time setup
git remote add template https://github.com/matthewdeaves/dashana.git

# To sync
git fetch template
git merge template/main --allow-unrelated-histories
git push && git tag v$(date +%Y-%m-%d) && git push --tags
```

## Configuration

Edit `dashana.config` to customise your report. All options use `YES`/`NO` values (defaults to `YES` if omitted).

### Core Settings

```ini
PROJECT_NAME=My Project      # Report title
CUSTOMER_NAME=Acme Corp      # Shown in header
SITE_BASE=                   # Optional: for custom domain paths (auto-detected on GitHub Pages)
```

### View Names and Page Headings

Customise navigation labels and page titles:

```ini
# Navigation buttons and browser tab titles
DASHBOARD_NAME=Dashboard
BOARD_NAME=Board
TASKS_NAME=Tasks
TIMELINE_NAME=Timeline

# Main h2 heading on each page
DASHBOARD_HEADING=Project Overview
BOARD_HEADING=Kanban Board
TASKS_HEADING=Task List
TIMELINE_HEADING=Timeline
```

### Tab Visibility

Hide views you don't need:

```ini
SHOW_DASHBOARD=YES
SHOW_BOARD=YES
SHOW_TASKS=YES
SHOW_TIMELINE=YES
```

### Tasks Table Columns

```ini
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
TASKS_COL_NOTES_TEXT=YES      # Inline text column
TASKS_NOTES_TEXT_MODE=PREVIEW # PREVIEW (truncated) or FULL
TASKS_COL_CUSTOM=YES
```

### Timeline Columns

```ini
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
TIMELINE_COL_NOTES_TEXT=YES      # Inline text column
TIMELINE_NOTES_TEXT_MODE=PREVIEW # PREVIEW (truncated) or FULL
TIMELINE_COL_CUSTOM=YES
```

### Notes Text Settings

```ini
NOTES_TEXT_PREVIEW_LENGTH=100 # Character limit for PREVIEW mode
```

### Board Card Items

```ini
CARD_SHOW_PROGRESS=YES
CARD_SHOW_ASSIGNEE=YES
CARD_SHOW_DUE=YES
CARD_SHOW_STATUS=YES
CARD_SHOW_PRIORITY=YES
CARD_SHOW_TAGS=YES
CARD_SHOW_PARENT=YES
CARD_SHOW_NOTES=YES
CARD_SHOW_CUSTOM=YES
```

## Views

- **Dashboard** - Metrics overview and status summary
- **Board** - Kanban view with task cards
- **Tasks** - Sortable table of all tasks
- **Timeline** - Visual date range display
