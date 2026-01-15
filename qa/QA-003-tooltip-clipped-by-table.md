# QA-003: Notes tooltip clipped at top of table in Tasks/Timeline views

## Summary
On the Tasks and Timeline views, when hovering/tapping the notes icon (📝) for rows near the top of the table, the tooltip popup gets cut off. The tooltip displays inside the table container and cannot overflow past the table header.

## Steps to Reproduce
1. Navigate to Tasks or Timeline view
2. Scroll so a task with a notes icon is near the top of the visible table area
3. Hover over (desktop) or tap (mobile) the notes icon
4. Observe the tooltip is clipped/cut off at the top

## Expected Behavior
The tooltip should be fully visible regardless of the row's position in the table.

## Actual Behavior
Tooltips for rows near the top of the table are partially or fully hidden because they extend above the table container boundary.

## Root Cause Analysis

### HTML Structure
```
.tasks-page / .timeline-page
  └── .table-container          ← overflow-x: auto (creates clipping boundary)
        └── table.task-table
              └── tbody
                    └── tr
                          └── td.col-notes
                                └── span.notes-icon   ← tooltip attached here
                                      └── ::after    ← tooltip (position: absolute)
```

### CSS Issue
The `.table-container` has `overflow-x: auto` (styles.css:1131) to enable horizontal scrolling on small screens. This creates a containing block that clips any absolutely positioned descendants.

```css
.table-container {
  overflow-x: auto;  /* This clips the tooltip */
}
```

The tooltip uses `position: absolute` with `bottom: 100%` to appear above the icon:
```css
.notes-icon::after {
  position: absolute;
  bottom: 100%;      /* Shows above the icon */
  /* ... */
}
```

When `bottom: 100%` positions the tooltip above the table boundary, it gets clipped.

## Potential Solutions

### Option 1: Temporary overflow:visible with :has()
Temporarily remove the overflow clipping when a tooltip is active using CSS `:has()`.

```css
.table-container:has(.notes-icon:hover),
.table-container:has(.notes-icon:focus) {
  overflow-x: visible;
}
```

**Pros**:
- Pure CSS, no JavaScript
- Works for both top AND bottom rows
- `:has()` now has excellent browser support (Chrome 105+, Firefox 121+, Safari 15.4+)

**Cons**:
- If table is wider than viewport, horizontal scrollbar disappears during hover
- Can cause layout shifts when scrollbar appears/disappears
- Tooltip direction is static (always above) regardless of available space

**Verdict**: Simple but has UX drawbacks with layout shifts.

### Option 2: Show tooltip to the left (horizontal positioning)
Position tooltip to the left of the icon instead of above/below, avoiding vertical clipping entirely.

```css
.task-table .notes-icon::after,
.timeline-table .notes-icon::after {
  bottom: auto;
  top: 50%;
  left: auto;
  right: 100%;
  transform: translateY(-50%);
  margin-right: 8px;
  margin-bottom: 0;
}
```

**Pros**:
- Avoids both top and bottom clipping
- No overflow manipulation needed

**Cons**:
- May overlap with adjacent columns on narrow screens
- Arrow direction needs adjustment
- Less conventional tooltip placement

**Verdict**: Viable alternative if horizontal space allows.

### Option 3: JavaScript position detection with CSS classes (Recommended)
Small JavaScript snippet that detects if icon is near top/bottom of viewport and adds a class to flip tooltip direction.

```javascript
// Add to base.njk with other event handlers
document.querySelectorAll('.notes-icon').forEach(function(icon) {
  function updatePosition() {
    var rect = icon.getBoundingClientRect();
    icon.classList.toggle('tooltip-below', rect.top < 150);
  }
  icon.addEventListener('mouseenter', updatePosition);
  icon.addEventListener('focus', updatePosition);
});
```

```css
/* Flip tooltip below when near top of viewport */
.notes-icon.tooltip-below::after {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: 8px;
}

.notes-icon.tooltip-below::before {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: -4px;
  transform: rotate(180deg);
}
```

**Pros**:
- Smart flipping based on actual viewport position
- Works perfectly in all cases - tooltip always visible
- Minimal JavaScript (~10 lines, class toggling only)
- Consistent with existing JS pattern (theme toggle, filter toggle, version select)
- No layout shifts or scrollbar changes
- Progressive enhancement - works without JS, just may clip

**Cons**:
- Adds JavaScript (but project already has ~40 lines for other features)

**Verdict**: Best UX with minimal complexity. The project's "minimal JavaScript" constraint is about avoiding heavy frameworks, not zero JS - there's already JS for theme, filter, and version select.

### Option 4: Always show below (FLAWED)
~~Change table tooltips to always show below the icon.~~

**Verdict**: REJECTED - Just moves the problem from top rows to bottom rows.

### Option 5: Position fixed with JavaScript
Use `position: fixed` and calculate viewport coordinates.

**Verdict**: Works but requires significant JavaScript. Overkill for this use case.

### Option 6: CSS Anchor Positioning (Future)
Use CSS anchor positioning API when widely supported.

**Verdict**: Not viable yet - experimental, limited browser support.

## Recommended Solution

**Option 3 (JavaScript position detection)** provides the best user experience:

| Criteria | Option 1 | Option 2 | Option 3 |
|----------|----------|----------|----------|
| Works for top rows | ✅ | ✅ | ✅ |
| Works for bottom rows | ✅ | ✅ | ✅ |
| No layout shifts | ❌ | ✅ | ✅ |
| Smart positioning | ❌ | ❌ | ✅ |
| Consistent with codebase | ⚠️ | ⚠️ | ✅ |
| Complexity | Low | Medium | Low |

**Implementation** - Add to `base.njk` after existing script block:

```javascript
// Tooltip position detection for table views
document.querySelectorAll('.notes-icon').forEach(function(icon) {
  function updatePosition() {
    var rect = icon.getBoundingClientRect();
    icon.classList.toggle('tooltip-below', rect.top < 150);
  }
  icon.addEventListener('mouseenter', updatePosition);
  icon.addEventListener('focus', updatePosition);
});
```

**CSS** - Add to `styles.css` after existing tooltip styles:

```css
/* Flip tooltip below when near top of viewport */
.notes-icon.tooltip-below::after {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: 8px;
}

.notes-icon.tooltip-below::before {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: -4px;
  transform: rotate(180deg);
}
```

**Why Option 3 over Option 1**:
- Option 1's `:has()` overflow toggle causes scrollbar to disappear during hover, which can trigger layout shifts
- Option 3's smart positioning shows the tooltip where there's actually room
- The ~10 lines of JS is consistent with existing patterns (theme toggle: 15 lines, filter toggle: 12 lines)

## Files to Modify
- `src/_includes/layouts/base.njk` - Add tooltip position detection script
- `src/css/styles.css` - Add `.tooltip-below` flip styles

## Priority
Medium - Affects usability of notes feature in table views.

## Status
Fixed - Combined approach: `:has()` removes clipping + JS flips tooltip direction when near top
