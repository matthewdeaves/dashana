# QA-002: Set default print orientation to landscape

## Summary
When printing any view (Dashboard, Board, Tasks, Timeline), the browser uses portrait orientation by default. The wide table layouts and board columns would benefit from landscape orientation as the default.

## Context
Currently `src/css/print.css` sets page margins but does not specify orientation:
```css
@page {
  margin: 1.5cm;
}
```

## Research: CSS Print Orientation Options

### The `@page` size Property
CSS provides the `size` property within `@page` rules to suggest orientation:

```css
@page {
  size: landscape;  /* Suggests landscape orientation */
  margin: 1.5cm;
}
```

Or with specific paper size:
```css
@page {
  size: A4 landscape;
  margin: 1.5cm;
}
```

### Browser Support & Limitations

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | Partial | Shows in print preview, user can override |
| Firefox | Partial | Shows in print preview, user can override |
| Safari | Limited | May not respect `size` property |
| Edge | Partial | Shows in print preview, user can override |

**Important**: The `size` property is a *suggestion* to the browser, not a hard requirement. Users can always override it in the print dialog. Browsers cannot force orientation without user consent.

### Per-Page Orientation
Named page rules allow different orientations per view:

```css
/* Default for most pages */
@page {
  size: landscape;
  margin: 1.5cm;
}

/* Dashboard might work in portrait */
@page dashboard {
  size: portrait;
  margin: 1.5cm;
}
```

Then in HTML:
```css
.dashboard {
  page: dashboard;
}
```

## Recommended Implementation

### Option 1: Global landscape default
Set all pages to landscape since tables and boards are wide:

```css
@page {
  size: A4 landscape;
  margin: 1.5cm;
}
```

### Option 2: Per-view orientation (more complex)
Define named pages for each view with appropriate orientation. This requires:
1. CSS `@page` rules for each view
2. CSS `page` property on each view container

### Option 3: Print button with orientation hint
Add a "Print (Landscape)" button that uses JavaScript to provide user guidance, since CSS cannot truly enforce orientation.

## Files to Modify
- `src/css/print.css` - Add `size` property to `@page` rule

## Priority
Low - Enhancement for better print experience, but users can manually select landscape.

## Status
Fixed

## Resolution
Added `size: landscape` to the `@page` rule in print.css. This sets landscape as the default orientation in the browser print dialog. Users can still override if needed.
