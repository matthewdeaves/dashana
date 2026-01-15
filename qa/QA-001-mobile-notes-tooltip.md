# QA-001: Notes icon tooltip doesn't work on mobile Safari

## Summary
On mobile Safari, touching the notes icon (📝) does not display the task notes/description. On desktop browsers, hovering over the icon shows the note text in a tooltip popup.

## Steps to Reproduce
1. Open the site on mobile Safari (iOS)
2. Navigate to Tasks, Timeline, or Board view
3. Find a task with a notes icon (📝)
4. Tap/touch the notes icon
5. Nothing happens - no note text is displayed

## Expected Behavior
Touching the notes icon should display the note/description text in a popup, similar to how it appears on desktop when hovering.

## Actual Behavior
Tapping the icon does nothing. The note content is not accessible on mobile.

## Root Cause Analysis
The notes are displayed using the native HTML `title` attribute:
```html
<span class="notes-icon" title="{{ task.notes }}">📝</span>
```

The `title` attribute relies on hover state to display tooltips, which doesn't exist on touch devices. Mobile Safari (and most mobile browsers) do not show `title` attribute content on tap.

### Affected Files
- `src/tasks.njk` (line 101)
- `src/timeline.njk` (line 122)
- `src/_includes/components/board-column.njk` (line 45)
- `src/_includes/components/task-card.njk` (line 5)

## Potential Solutions

### Option 1: CSS-only tooltip with `:active` state
Use CSS to show a custom tooltip on `:active` (touch) state. Lightweight but limited positioning control.

### Option 2: JavaScript tap handler
Add a small JavaScript snippet that listens for touch/click events and shows a modal or popup with the note content. More reliable but adds JS complexity.

### Option 3: Progressive disclosure pattern
Show a truncated preview of notes inline, with "tap to expand" functionality.

### Option 4: Custom tooltip component
Create a reusable tooltip component using CSS with `::after` pseudo-element that responds to both hover and focus states.

## Priority
Medium - Core functionality is broken on mobile devices.

## Status
Fixed

## Resolution

### Initial Fix (CSS-based)
Replaced HTML `title` attribute with CSS-based tooltips using `data-notes` attribute and `::after` pseudo-elements. Added `tabindex="0"` for keyboard/touch focus. Tooltips show on `:hover` (desktop) and `:focus` (mobile tap).

### Final Fix (QA-005 - DOM-based for mobile)
The CSS `:focus` approach caused iOS Safari issues (scroll jump, dismiss on scroll). The final solution uses a JavaScript DOM tooltip on touch devices:

- Detects touch devices via `'ontouchstart' in window`
- Adds `.touch-device` class to `<html>` to disable CSS `::after` tooltips
- Creates a single `<div class="mobile-tooltip">` with `position: fixed` appended to `<body>`
- Shows tooltip on tap, dismisses on tap outside or tap again (toggle)
- Uses `position: fixed` to escape scroll containers without breaking table horizontal scroll

**Behavior by device:**
| Device | Method |
|--------|--------|
| Desktop | CSS `::after` on `:hover`/`:focus` |
| Touch | JS DOM tooltip on click |

**Files modified:**
- `src/_includes/layouts/base.njk` - Mobile tooltip JS handler
- `src/css/styles.css` - `.mobile-tooltip` class, `.touch-device` rules
