# Dashana

Transform Asana CSV exports into beautiful static report websites.

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
git remote add template <template-repo-url>

# To sync
git fetch template
git merge template/main --allow-unrelated-histories
git push && git tag v$(date +%Y-%m-%d) && git push --tags
```

## Configuration

Edit `dashana.config`:
```
PROJECT_NAME=My Project
CUSTOMER_NAME=Acme Corp
```

## Views

- **Dashboard** - Metrics overview and status summary
- **Board** - Kanban view with task cards
- **Tasks** - Sortable table of all tasks
- **Timeline** - Visual date range display
