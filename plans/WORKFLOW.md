# Dashana - Implementation Workflow

## How to Use These Plans with Claude Code

### Starting a Session

Each phase has defined sessions. Start a session with:

```
Read plans/PHASE-N-NAME.md and implement session N-A.
```

Example:
```
Read plans/PHASE-3-DASHBOARD.md and implement session 3-A.
```

### During a Session

1. Claude reads the phase file and understands the tasks
2. Implementation proceeds task by task
3. Each task has acceptance criteria - verify before moving on
4. Mark tasks complete as you go

### Between Sessions

Run `/clear` to reset context, then start the next session:

```
/clear
Read plans/PHASE-3-DASHBOARD.md and implement session 3-B.
```

### Session Boundaries

Sessions are scoped to fit comfortably in Claude Code's context:
- Usually 2-5 related tasks per session
- Tasks that touch the same files are grouped
- Each session produces working, testable output

## Development Commands

```bash
# Install dependencies (run once)
npm install

# Start development server with live reload
npm run dev

# Production build
npm run build

# Build all historical versions
./scripts/build-versions.sh
```

## Verification Workflow

After each session:

1. **Check the dev server** - `npm run dev` and open http://localhost:8080
2. **Verify acceptance criteria** - Each task lists what to check
3. **Test in browser** - Navigate pages, check layouts
4. **Check for errors** - Console should be clean

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Pages | lowercase.njk | `board.njk` |
| Components | lowercase.njk | `header.njk` |
| Data files | lowercase.js | `tasks.js` |
| CSS | lowercase.css | `styles.css` |

## Git Workflow

### During Development
```bash
git add .
git commit -m "Phase N: description"
```

### Creating a Release (Customer Repos)
```bash
git tag v2026-01-15
git push --tags
```

Tags trigger the GitHub Actions build.

## Common Patterns

### Adding a New Page

1. Create `src/pagename.njk`
2. Set front matter with layout
3. Add to navigation in `header.njk`
4. Add styles to `styles.css`

### Adding a Component

1. Create `src/_includes/components/name.njk`
2. Include in page: `{% include "components/name.njk" %}`

### Adding Computed Data

Edit `src/_data/tasks.js` to add computed fields:
```javascript
tasks.forEach(task => {
  task.isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
});
```

## Troubleshooting

### 11ty not picking up changes
- Check file is in `src/` directory
- Restart dev server
- Check for syntax errors in templates

### Styles not applying
- Hard refresh (Ctrl+Shift+R)
- Check CSS file is linked in base layout
- Verify class names match

### Data not loading
- Check CSV path in `tasks.js`
- Verify CSV format matches expected columns
- Check for console errors

## Quick Reference Files

- `CLAUDE.md` - Tech stack, constraints, color tokens
- `plans/PLANNING.md` - Architecture, requirements overview
- `plans/PHASE-*.md` - Detailed implementation tasks
