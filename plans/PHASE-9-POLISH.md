# Phase 9: Polish

> **Goal:** Add responsive design, dark mode, print styles, and final refinements.
> **Sessions:** 2
> **Prerequisites:** Phase 8 complete (deployment working)

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 9-A | 9.1 - 9.3 | Light/dark mode, CSS variables |
| 9-B | 9.4 - 9.6 | Print styles, responsive refinements |

## Session 9-A: Light/Dark Mode

### Task 9.1: Update CSS Variables for Theming

Update `src/css/styles.css` to use CSS custom properties that change based on system preference:

```css
/* Light theme (default) */
:root {
  /* Base colors */
  --color-bg: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #f0f0f0;
  --color-text: #333333;
  --color-text-secondary: #666666;
  --color-border: #e5e5e5;
  --color-accent: #0066cc;
  --color-accent-hover: #0052a3;

  /* Status colors */
  --color-on-track: #22c55e;
  --color-on-track-bg: #f0fdf4;
  --color-at-risk: #eab308;
  --color-at-risk-bg: #fefce8;
  --color-off-track: #ef4444;
  --color-off-track-bg: #fef2f2;

  /* Priority colors */
  --color-priority-high: #ef4444;
  --color-priority-medium: #a16207;
  --color-priority-low: #15803d;

  /* Component colors */
  --color-card-bg: #ffffff;
  --color-card-border: var(--color-border);
  --color-table-header: #f8f9fa;
  --color-table-row-alt: #fafafa;
  --color-table-hover: #f0f0f0;
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  :root {
    /* Base colors */
    --color-bg: #1a1a1a;
    --color-bg-secondary: #242424;
    --color-bg-tertiary: #2d2d2d;
    --color-text: #e5e5e5;
    --color-text-secondary: #a0a0a0;
    --color-border: #3d3d3d;
    --color-accent: #4da3ff;
    --color-accent-hover: #7ab8ff;

    /* Status colors (slightly muted for dark mode) */
    --color-on-track: #4ade80;
    --color-on-track-bg: #14532d;
    --color-at-risk: #facc15;
    --color-at-risk-bg: #422006;
    --color-off-track: #f87171;
    --color-off-track-bg: #450a0a;

    /* Priority colors */
    --color-priority-high: #f87171;
    --color-priority-medium: #fbbf24;
    --color-priority-low: #4ade80;

    /* Component colors */
    --color-card-bg: #242424;
    --color-card-border: var(--color-border);
    --color-table-header: #2d2d2d;
    --color-table-row-alt: #1f1f1f;
    --color-table-hover: #2d2d2d;
  }
}
```

**Acceptance:**
- [ ] Light mode looks correct
- [ ] Dark mode activates with system preference
- [ ] All colors have dark mode variants

---

### Task 9.2: Update Components to Use Theme Variables

Update all components to use the CSS variables instead of hardcoded colors:

```css
/* Body */
body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

/* Header */
.site-header {
  background: var(--color-card-bg);
  border-bottom: 1px solid var(--color-border);
}

.customer-name {
  color: var(--color-text-secondary);
}

.nav-link {
  color: var(--color-text);
}

.nav-link:hover,
.nav-link.active {
  background: var(--color-bg-tertiary);
}

/* Cards */
.metric-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
}

.metric-title {
  color: var(--color-text-secondary);
}

/* Progress bars */
.progress-bar {
  background: var(--color-border);
}

.progress-fill {
  background: var(--color-accent);
}

/* Tables */
.task-table th,
.timeline-table th {
  background: var(--color-table-header);
  color: var(--color-text-secondary);
}

.task-table tbody tr:nth-child(even),
.timeline-table tbody tr:nth-child(even) {
  background: var(--color-table-row-alt);
}

.task-table tbody tr:hover,
.timeline-table tbody tr:hover {
  background: var(--color-table-hover);
}

/* Board */
.board-column {
  background: var(--color-bg-secondary);
}

.task-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
}

/* Badges */
.status-badge.status-on-track {
  background: var(--color-on-track-bg);
  color: var(--color-on-track);
}

.status-badge.status-at-risk {
  background: var(--color-at-risk-bg);
  color: var(--color-at-risk);
}

.status-badge.status-off-track {
  background: var(--color-off-track-bg);
  color: var(--color-off-track);
}

/* Priority badges */
.priority-badge.priority-high {
  background: var(--color-off-track-bg);
  color: var(--color-priority-high);
}

.priority-badge.priority-medium {
  background: var(--color-at-risk-bg);
  color: var(--color-priority-medium);
}

.priority-badge.priority-low {
  background: var(--color-on-track-bg);
  color: var(--color-priority-low);
}

/* Overdue highlights */
.metric-overdue.has-overdue,
.task-table .row-overdue,
.timeline-table .row-overdue {
  background: var(--color-off-track-bg) !important;
}

/* Timeline bar */
.timeline-bar-container {
  background: var(--color-bg-tertiary);
}

/* Links */
a {
  color: var(--color-accent);
}

a:hover {
  color: var(--color-accent-hover);
}

/* Version badge */
.version-badge {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.version-badge.current {
  background: var(--color-accent);
  color: white;
}
```

**Acceptance:**
- [ ] All hardcoded colors replaced
- [ ] Light mode unchanged visually
- [ ] Dark mode fully styled
- [ ] No color contrast issues

---

### Task 9.3: Add Color Scheme Meta Tag

Update `src/_includes/layouts/base.njk`:

```njk
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>{{ title }} | {{ config.projectName }}</title>
  <link rel="stylesheet" href="{{ pathPrefix }}/css/styles.css">
  <link rel="stylesheet" href="{{ pathPrefix }}/css/print.css" media="print">
</head>
<body>
  {% include "components/header.njk" %}
  <main>
    {{ content | safe }}
  </main>
</body>
</html>
```

**Acceptance:**
- [ ] `color-scheme` meta tag present
- [ ] Browser respects system preference
- [ ] No flash of wrong theme on load

---

## Session 9-B: Print Styles and Responsive

### Task 9.4: Create Print Stylesheet

Update `src/css/print.css`:

```css
@media print {
  /* Reset to light colors for printing */
  :root {
    --color-bg: #ffffff !important;
    --color-text: #000000 !important;
    --color-border: #cccccc !important;
  }

  /* Hide navigation */
  .site-header nav,
  .version-info,
  .version-link {
    display: none !important;
  }

  /* Simplify header */
  .site-header {
    border-bottom: 2px solid #000;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
  }

  /* Remove shadows and backgrounds */
  .metric-card,
  .task-card,
  .version-link-card {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
  }

  /* Improve table printing */
  .task-table,
  .timeline-table {
    font-size: 10pt;
  }

  .task-table th,
  .timeline-table th {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Ensure badges print with color */
  .status-badge,
  .priority-badge {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Board layout for print */
  .board {
    display: block;
  }

  .board-column {
    display: inline-block;
    vertical-align: top;
    width: 19%;
    margin-right: 0.5%;
    page-break-inside: avoid;
  }

  /* Links don't need underlines in print */
  a {
    text-decoration: none;
    color: inherit;
  }

  /* Page margins */
  @page {
    margin: 1.5cm;
  }

  /* Add URL after external links */
  a[href^="http"]:after {
    content: " (" attr(href) ")";
    font-size: 8pt;
    color: #666;
  }

  /* Hide elements that don't make sense in print */
  .empty-state {
    display: none;
  }
}
```

**Acceptance:**
- [ ] Print preview looks clean
- [ ] Navigation hidden
- [ ] Colors print correctly
- [ ] Tables fit on page
- [ ] Page breaks don't cut content

---

### Task 9.5: Add Responsive Refinements

Add responsive styles to `src/css/styles.css`:

```css
/* Responsive Header */
@media (max-width: 900px) {
  .site-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .main-nav {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 600px) {
  .main-nav {
    flex-wrap: wrap;
  }

  .nav-link {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
}

/* Responsive Dashboard */
@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .dashboard {
    padding: 1rem;
  }
}

/* Responsive Board */
@media (max-width: 1200px) {
  .board {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .board {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .board {
    grid-template-columns: 1fr;
  }

  .board-page {
    padding: 1rem;
  }

  .board-column {
    max-height: none;
  }
}

/* Responsive Tables */
@media (max-width: 768px) {
  .tasks-page,
  .timeline-page {
    padding: 1rem;
  }

  .table-container {
    margin: 0 -1rem;
    padding: 0 1rem;
  }

  .task-table,
  .timeline-table {
    font-size: 0.8rem;
  }

  .task-table th,
  .task-table td,
  .timeline-table th,
  .timeline-table td {
    padding: 0.5rem;
  }

  /* Hide less important columns on mobile */
  .col-section,
  .col-start {
    display: none;
  }
}

/* Responsive Versions Page */
@media (max-width: 600px) {
  .versions-page {
    padding: 1rem;
  }

  .version-link-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
```

**Acceptance:**
- [ ] Dashboard stacks on mobile
- [ ] Board columns stack on smaller screens
- [ ] Tables scroll horizontally
- [ ] Navigation wraps nicely
- [ ] All content accessible at any width

---

### Task 9.6: Final Polish

Add finishing touches:

```css
/* Smooth transitions for theme changes */
body,
.site-header,
.metric-card,
.task-card,
.board-column {
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

/* Focus styles for accessibility */
a:focus,
button:focus,
.nav-link:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Better link underlines */
a:not(.nav-link):not(.version-link-card) {
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

/* Prevent layout shift from scrollbar */
html {
  overflow-y: scroll;
}

/* Selection color */
::selection {
  background: var(--color-accent);
  color: white;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Acceptance:**
- [ ] Theme transitions smooth
- [ ] Focus states visible
- [ ] Reduced motion respected
- [ ] No layout jank

---

## Phase 9 Completion Checklist

- [ ] Light mode looks correct
- [ ] Dark mode works with system preference
- [ ] Print stylesheet produces clean output
- [ ] Responsive at all screen sizes
- [ ] Transitions smooth
- [ ] Accessibility basics covered
- [ ] Ready for production use!

## How to Start This Phase

```
Read plans/PHASE-9-POLISH.md and implement session 9-A.
```

After session 9-A:
```
/clear
Read plans/PHASE-9-POLISH.md and implement session 9-B.
```

## Testing Checklist

Before marking complete:
- [ ] Test light mode in browser
- [ ] Test dark mode (change system preference)
- [ ] Test print preview (Cmd/Ctrl + P)
- [ ] Test on mobile viewport (responsive mode)
- [ ] Test keyboard navigation
- [ ] Build and verify no errors
