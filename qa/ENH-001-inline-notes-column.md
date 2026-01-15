# ENH-001: Inline Notes Text Column

## Summary
Add a new configurable column to Tasks and Timeline views that displays the notes/description text inline within the row, rather than only showing the notes icon (📝) with tooltip.

## User Request
Allow users to see notes content directly in the table without needing to hover/tap on an icon. This is useful for:
- Quick scanning of task details
- Printing/exporting where tooltips don't work
- Users who prefer to see all information at a glance

## Proposed Feature

### Display Modes
Two display modes should be available:

**A) Full Text Mode**
- Shows complete notes content in the cell
- Row heights will vary based on content length
- Best for detailed review or printing

**B) Preview Mode** (Recommended default)
- Shows truncated text (e.g., first 100 characters or 2 lines)
- On hover/focus, shows full text using existing tooltip system
- Maintains equal row heights for cleaner table layout
- Provides visual indication that more content exists (ellipsis)

### Configuration Options

```ini
# Enable/disable the inline notes column (default: NO)
TASKS_COL_NOTES_TEXT=YES
TIMELINE_COL_NOTES_TEXT=YES

# Display mode: FULL or PREVIEW (default: PREVIEW)
NOTES_TEXT_MODE=PREVIEW

# Preview character limit (default: 100)
NOTES_TEXT_PREVIEW_LENGTH=100
```

## Technical Research

### Files to Modify

1. **`src/_data/config.js`**
   - Add new config options:
     - `TASKS_COL_NOTES_TEXT` → `tasksColumns.notesText`
     - `TIMELINE_COL_NOTES_TEXT` → `timelineColumns.notesText`
     - `NOTES_TEXT_MODE` → `notesTextMode` (enum: 'full' | 'preview')
     - `NOTES_TEXT_PREVIEW_LENGTH` → `notesTextPreviewLength` (number)

2. **`src/tasks.njk`**
   - Add new column header and cell after existing notes column
   - Implement conditional rendering based on display mode

3. **`src/timeline.njk`**
   - Same changes as tasks.njk

4. **`src/css/styles.css`**
   - `.col-notes-text` - Column styling
   - `.notes-text-full` - Full mode styling (word-wrap, variable height)
   - `.notes-text-preview` - Preview mode styling (truncation, ellipsis)
   - Reuse existing tooltip system for preview hover

### Implementation Approach

#### Template Structure (Preview Mode)
```njk
{% if config.tasksColumns.notesText %}
<td class="col-notes-text">
  {% if task.notes %}
    {% if config.notesTextMode == 'preview' %}
      <span class="notes-text-preview"
            data-notes="{{ task.notes }}"
            tabindex="0"
            role="button"
            aria-label="View full notes">
        {{ task.notes | truncate(config.notesTextPreviewLength) }}
      </span>
    {% else %}
      <span class="notes-text-full">{{ task.notes }}</span>
    {% endif %}
  {% else %}
    —
  {% endif %}
</td>
{% endif %}
```

#### CSS for Preview Mode
```css
.notes-text-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  max-width: 300px;
}

/* Reuse tooltip styles */
.notes-text-preview::after {
  /* Same as .notes-icon::after */
}
```

#### CSS for Full Mode
```css
.notes-text-full {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 400px;
}
```

### Interaction with Existing Notes Column
- The existing `TASKS_COL_NOTES` (icon) and new `TASKS_COL_NOTES_TEXT` are independent
- Users can enable both, either, or neither
- When both enabled: icon provides quick visual indicator, text provides inline content

### Considerations

1. **Column Width**: Notes text could be long; need `max-width` constraint
2. **Mobile**: Preview mode essential on mobile for space constraints
3. **Print**: Full mode better for print output (tooltips don't work)
4. **Performance**: Large notes content increases page size; preview mode mitigates this
5. **Accessibility**: Preview mode needs proper ARIA attributes for tooltip interaction

### Alternative Approaches Considered

1. **Replace icon with text** - Rejected: some users prefer compact icon view
2. **Expandable rows** - More complex, requires JavaScript for toggle
3. **Modal popup** - Overkill, tooltip system already works well

## Estimated Complexity
Medium - Leverages existing patterns (config system, tooltip CSS), but requires new column in multiple templates.

## Priority
Low - Enhancement request, not a bug fix.

## Status
Proposed - Awaiting prioritization

## Related
- QA-001: Mobile notes tooltip (established tooltip pattern)
- QA-003: Tooltip clipping fix (tooltip positioning)
