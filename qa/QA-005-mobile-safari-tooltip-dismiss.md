# QA-005: Mobile Safari tooltip cannot be dismissed

## Summary

On mobile Safari (iOS), notes tooltips have multiple interaction issues:
1. Tooltips cannot be dismissed by tapping outside
2. Screen jumps when tapping tooltip icons (iOS auto-scrolls to focused elements)
3. Horizontal scrolling dismisses the tooltip unexpectedly

## Root Causes

### Issue 1: iOS Safari blur behavior
iOS Safari only triggers blur events when tapping on another "clickable" element - tapping empty space doesn't dismiss focus. This is a [well-documented iOS Safari limitation](https://github.com/twbs/bootstrap/issues/16028).

### Issue 2: Focus scroll jump
iOS Safari automatically scrolls to bring focused elements (`tabindex`) into view. This is a [known WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=178583) affecting elements with `tabindex` that aren't inputs. The `focus({ preventScroll: true })` option exists but doesn't help since focus is triggered by the tap, not programmatically.

### Issue 3: touchstart fires before scroll intent is known
Using `touchstart` to dismiss tooltips fires immediately when the user touches the screen, before iOS can determine if it's a tap or scroll gesture. This means any scroll attempt dismisses the tooltip.

### Issue 4: Pseudo-elements can't receive touch events
The tooltip is a `::after` pseudo-element with `pointer-events: none`. JavaScript cannot detect touches on pseudo-elements since they're not part of the DOM.

## Implementation History

### Attempt 1: Simple touchstart dismiss
```javascript
document.addEventListener('touchstart', function(e) {
  if (!e.target.closest('.notes-icon, ...')) {
    // blur all tooltips
  }
}, { passive: true });
```
**Result:** Dismissed on ANY touch, including scrolling.

### Attempt 2: Bounding box heuristic
Added coordinate checks to create a "safe zone" around the tooltip.
**Result:** Still dismisses on scroll because `touchstart` fires before scroll intent is known.

## Solution: Fixed-Position DOM Tooltip (Implemented)

The focus-based and class-toggle approaches failed because:
1. Focus triggers iOS auto-scroll
2. `overflow: visible` on table container breaks horizontal scrolling

The solution: Create a real DOM tooltip element with `position: fixed`, appended to `<body>`. This escapes all containers without affecting their overflow.

### Implementation

**CSS** (`src/css/styles.css`):
```css
/* Mobile tooltip - real DOM element with fixed positioning (QA-005) */
.mobile-tooltip {
  position: fixed;
  display: none;
  background: var(--color-bg-alt);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: pre-wrap;
  max-width: min(300px, calc(100vw - 20px));
  max-height: 200px;
  overflow-y: auto;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

**JavaScript** (`src/_includes/layouts/base.njk`):
```javascript
// Mobile tooltip - real DOM element with fixed positioning (QA-005)
(function() {
  var isTouch = 'ontouchstart' in window;
  if (!isTouch) return;

  var triggers = '.notes-icon, .notes-text-preview, .card-notes-icon';
  var activeTrigger = null;
  var tooltip = null;

  function getTooltip() {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'mobile-tooltip';
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function showTooltip(trigger) {
    var el = getTooltip();
    var notes = trigger.getAttribute('data-notes');
    var rect = trigger.getBoundingClientRect();

    el.textContent = notes;
    el.style.display = 'block';

    // Position below or above based on available space
    var tooltipRect = el.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow >= tooltipRect.height + 10 || spaceBelow > rect.top) {
      el.style.top = (rect.bottom + 8) + 'px';
    } else {
      el.style.top = (rect.top - tooltipRect.height - 8) + 'px';
    }

    // Center horizontally, constrain to viewport
    var left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
    el.style.left = left + 'px';

    activeTrigger = trigger;
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
    activeTrigger = null;
  }

  document.addEventListener('click', function(e) {
    var trigger = e.target.closest(triggers);
    if (trigger) {
      e.preventDefault();
      activeTrigger === trigger ? hideTooltip() : showTooltip(trigger);
    } else {
      hideTooltip();
    }
  });
})();
```

### Why This Works

| Issue | Previous approaches | Fixed-position DOM tooltip |
|-------|--------------------|-----------------------------|
| Scroll jump | Focus triggers iOS scroll | No focus involved |
| Table scroll breaks | `overflow:visible` removes scroll | No overflow changes needed |
| Tooltip clipped | Inside scroll container | Outside all containers |

### Behavior by Device

| Device | Hover | Tap | Keyboard |
|--------|-------|-----|----------|
| Desktop | `:hover` shows `::after` tooltip | `:focus` shows tooltip | Tab + Escape works |
| Touch | N/A | JS creates DOM tooltip | N/A |

### Previous Attempts (Failed)

1. **Simple touchstart dismiss** - Dismissed on any touch including scrolls
2. **Bounding box on touchstart** - touchstart fires before scroll intent known
3. **Touch movement tracking** - Couldn't prevent Safari's internal blur during scroll
4. **Class-toggle on `::after`** - Required `overflow:visible` which broke table scroll

## Affected Files

- `src/_includes/layouts/base.njk` - Mobile tooltip JS handler
- `src/css/styles.css` - `.mobile-tooltip` class

## Testing Checklist

- [ ] iOS Safari: Tap tooltip icon → tooltip shows (NO scroll jump)
- [ ] iOS Safari: Horizontal scroll → tooltip stays visible
- [ ] iOS Safari: Tap outside tooltip area → tooltip dismisses
- [ ] iOS Safari: Tap same icon again → tooltip closes (toggle)
- [ ] Desktop: Hover behavior unchanged
- [ ] Desktop: Escape key dismisses tooltip
- [ ] Keyboard: Tab to tooltip → shows, Tab away → hides

## Priority

**Medium-High** - Affects all mobile users; scroll-dismiss is the critical issue.

## Status

**Implemented** - Fixed-position DOM tooltip (replaces class-toggle which broke table scroll).

## References

- [MDN: Touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [web.dev: Touch and mouse](https://web.dev/articles/mobile-touchandmouse)
- [Apple: Handling Events in Safari](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html)
- [WebKit Bug #178583: preventScroll in focus()](https://bugs.webkit.org/show_bug.cgi?id=178583)
- [Bootstrap iOS tooltip issue #16028](https://github.com/twbs/bootstrap/issues/16028)
- [GitHub Gist: Preventing iOS Safari scroll on focus](https://gist.github.com/kiding/72721a0553fa93198ae2bb6eefaa3299)
