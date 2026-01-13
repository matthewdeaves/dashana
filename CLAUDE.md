# Dashana - Quick Reference

## What Is This?

GitHub template repository that transforms Asana CSV exports into static report websites. Customers use "Use this template" to create their own repo, then push data updates with tags to trigger builds.

## Tech Stack

- **11ty (Eleventy)** - Static site generator
- **Nunjucks** - Templating language
- **Pure CSS** - No frameworks, clean minimal design
- **GitHub Actions** - Build on tag push, deploy to GitHub Pages

## Key Constraints

- **No JavaScript in output** - Static HTML only
- **Light/dark mode** - Uses `prefers-color-scheme` CSS media query
- **Print-friendly** - Must work without JS for PDF exports
- **Template-based** - Customer repos created via GitHub's "Use this template" feature
- **Sync-friendly** - `.gitattributes` protects customer data during template merges
- **Tag-triggered builds** - Push a tag (e.g., `v2026-01-15`) to build and deploy

## File Paths

| Purpose | Path |
|---------|------|
| Templates | `src/*.njk` |
| Components | `src/_includes/components/` |
| Layouts | `src/_includes/layouts/` |
| Data files | `src/_data/` |
| Styles | `src/css/` |
| Customer data | `data/project.csv` |
| Config | `dashana.config` |
| Merge config | `.gitattributes` |

## Data Flow

```
data/project.csv → src/_data/tasks.js → templates → _site/
```

## CSS Color Tokens

```css
/* Status */
--color-on-track: #22c55e;
--color-at-risk: #eab308;
--color-off-track: #ef4444;

/* Priority (same colors, semantic names) */
--color-priority-high: #ef4444;
--color-priority-medium: #eab308;
--color-priority-low: #22c55e;

/* Base */
--color-bg: #ffffff;
--color-text: #333333;
--color-border: #e5e5e5;
--color-accent: #0066cc;
```

## Dynamic Data Handling

The tool handles ANY Asana board structure:
- **Sections**: Discovered dynamically from CSV (any names, any count)
- **Status/Priority**: Collected from data, not hardcoded
- **Done detection**: Pattern matches: done, complete, completed, finished, closed, resolved
- **Templates**: Always iterate dynamically, never hardcode field values

```njk
{# GOOD: Dynamic #}
{% for section, count in tasks.stats.bySection %}...{% endfor %}

{# BAD: Hardcoded #}
{{ tasks.stats.bySection['To do'] }}
```

## Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Local dev server
npm run build        # Production build
```

## Template Workflow

1. Click "Use this template" on GitHub to create customer repo
2. Update `dashana.config` with customer name
3. Replace `data/project.csv` with customer's Asana export
4. Push with tag to trigger build: `git tag v2026-01-15 && git push --tags`

## Syncing Template Updates

Customer repos can pull template changes. The `.gitattributes` file ensures `data/project.csv` and `dashana.config` are never overwritten during merges.

```bash
git remote add template git@github.com:org/dashana.git
git fetch template
git merge template/main --allow-unrelated-histories
```
