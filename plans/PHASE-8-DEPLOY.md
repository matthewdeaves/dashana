# Phase 8: GitHub Actions Deployment

> **Goal:** Set up tag-triggered builds and GitHub Pages deployment.
> **Sessions:** 1
> **Prerequisites:** Phase 7 complete (versioning working locally)

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 8-A | 8.1 - 8.3 | Full GitHub Actions setup |

## Deployment Model

This is a **GitHub Template Repository**. Customers click "Use this template" to create independent repos:

```
dashana (template)
    └── "Use this template" → customer-dashana (own repo, own data)
```

**Trigger:** Pushing a tag (e.g., `v2026-01-15`) triggers the build.
**Output:** Static site deployed to GitHub Pages.
**Sync:** `.gitattributes` protects customer data when merging template updates.

## Session 8-A: GitHub Actions Setup

### Task 8.1: Create Workflow File

Create `.github/workflows/build.yml`:

```yaml
name: Build and Deploy

on:
  # Trigger on tag push (e.g., v2026-01-15)
  push:
    tags:
      - 'v*'

  # Allow manual trigger from Actions tab
  workflow_dispatch:

# Required for GitHub Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Only one deployment at a time
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout with full history
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for versioning

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all versions
        run: ./scripts/build-versions.sh

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '_site'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Acceptance:**
- [ ] Workflow file created at correct path
- [ ] Triggers on tag push only
- [ ] Fetches full git history
- [ ] Runs build-versions script

---

### Task 8.2: Create GitHub Pages Config

Create `.github/workflows/pages.yml` for repository Pages settings:

Actually, Pages is configured via repository settings, not a file. Instead, add a README section.

Update `README.md` (or create if needed):

```markdown
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
```

**Acceptance:**
- [ ] README explains setup
- [ ] Instructions for GitHub Pages config
- [ ] Update workflow documented

---

### Task 8.3: Add .gitignore

Create/update `.gitignore`:

```gitignore
# Dependencies
node_modules/

# Build output
_site/
_site_latest/

# OS files
.DS_Store
Thumbs.db

# Editor files
.idea/
.vscode/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
```

**Acceptance:**
- [ ] node_modules ignored
- [ ] Build output ignored
- [ ] Common cruft ignored

---

## Testing the Deployment

After implementing, test locally:

```bash
# Simulate what GitHub Actions does
npm install
./scripts/build-versions.sh

# Check output
ls -la _site/
cat _site/versions.json
```

To test the full flow:

```bash
# Make sure you have changes to commit
git add .
git commit -m "Add deployment workflow"
git tag v2026-01-13
git push && git push --tags

# Check GitHub Actions tab for build status
# Check Settings → Pages for deployment URL
```

---

## Phase 8 Completion Checklist

- [ ] Workflow file created
- [ ] Triggers on tag push
- [ ] Builds all versions
- [ ] Deploys to GitHub Pages
- [ ] README documents setup
- [ ] .gitignore covers all artifacts
- [ ] Ready for Phase 9 (Polish)

## How to Start This Phase

```
Read plans/PHASE-8-DEPLOY.md and implement session 8-A.
```

## Troubleshooting

### Build fails with "permission denied"
```bash
chmod +x scripts/build-versions.sh
git add scripts/build-versions.sh
git commit -m "Fix script permissions"
```

### Pages not deploying
1. Check Settings → Pages → Source is "GitHub Actions"
2. Check Actions tab for errors
3. Verify workflow has correct permissions

### Tags not triggering build
- Tags must match pattern `v*` (e.g., `v2026-01-15`)
- Make sure to `git push --tags`
