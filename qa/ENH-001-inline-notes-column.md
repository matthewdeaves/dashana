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

Two display modes should be available (configurable per view):

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
# Enable/disable the inline notes column (default: YES)
TASKS_COL_NOTES_TEXT=YES
TIMELINE_COL_NOTES_TEXT=YES

# Display mode per view: FULL or PREVIEW (default: PREVIEW)
TASKS_NOTES_TEXT_MODE=PREVIEW
TIMELINE_NOTES_TEXT_MODE=FULL

# Preview character limit - global setting (default: 100)
NOTES_TEXT_PREVIEW_LENGTH=100
```

## Implementation Tasks

### Session 1: Config & Tests ✅
- [x] Add to `CONFIG_SCHEMA` in `src/_data/config.js`:
  - `TASKS_COL_NOTES_TEXT` → `tasksColumns.notesText` (boolean)
  - `TASKS_NOTES_TEXT_MODE` → `tasksColumns.notesTextMode` (string)
  - `TIMELINE_COL_NOTES_TEXT` → `timelineColumns.notesText` (boolean)
  - `TIMELINE_NOTES_TEXT_MODE` → `timelineColumns.notesTextMode` (string)
  - `NOTES_TEXT_PREVIEW_LENGTH` → `notesTextPreviewLength` (number)
- [x] Add defaults to config object:
  - `tasksColumns.notesText: true`
  - `tasksColumns.notesTextMode: 'preview'`
  - `timelineColumns.notesText: true`
  - `timelineColumns.notesTextMode: 'preview'`
  - `notesTextPreviewLength: 100`
- [x] Add tests to `tests/config.test.js`:
  - Schema has new entries
  - Defaults applied correctly
  - Mode values parsed as strings
  - Preview length parsed as number

### Session 2: CSS ✅
- [x] Add `.col-notes-text` base column styling
- [x] Add `.notes-text-preview` with line-clamp truncation and tooltip
- [x] Add `.notes-text-full` for variable-height cells with word-wrap
- [x] Ensure tooltip reuses existing `.notes-icon` tooltip pattern
- [x] Add print styles if needed (full mode for print)

### Session 3: Templates ✅
- [x] Add notes text column to `src/tasks.njk`:
  - Header: `{% if config.tasksColumns.notesText %}<th>Notes</th>{% endif %}`
  - Cell: Conditional rendering based on `config.tasksColumns.notesTextMode`
- [x] Add notes text column to `src/timeline.njk`:
  - Same pattern using `config.timelineColumns.notesText` and `notesTextMode`
- [x] Add view tests to `tests/views.test.js`:
  - Column renders when enabled
  - Column hidden when disabled
  - Preview mode truncates text
  - Full mode shows complete text

### Session 4: Documentation ✅
- [x] Update `CLAUDE.md` Configuration section:
  - Add new options to Tasks Table Columns
  - Add new options to Timeline Table Columns
  - Document NOTES_TEXT_PREVIEW_LENGTH

### Session 5: Verification ✅
- [x] Run `npm test` - all tests pass
- [x] Run `npm run dev` - visual verification
- [x] Test tasks view: preview mode, full mode, disabled
- [x] Test timeline view: preview mode, full mode, disabled
- [x] Test print output with full mode enabled
- [x] Test mobile viewport with preview mode

## Acceptance Criteria

1. `TASKS_COL_NOTES_TEXT=YES` shows inline notes column in tasks table
2. `TIMELINE_COL_NOTES_TEXT=YES` shows inline notes column in timeline table
3. `TASKS_NOTES_TEXT_MODE=PREVIEW` truncates to `NOTES_TEXT_PREVIEW_LENGTH` chars
4. `TIMELINE_NOTES_TEXT_MODE=FULL` shows complete text (independent of tasks setting)
5. Preview mode shows ellipsis when text exceeds limit
6. Hover/focus on preview shows full text tooltip
7. Full mode shows complete text with word-wrap
8. Empty notes show em-dash (—) not blank cell
9. Existing notes icon column (`TASKS_COL_NOTES`) continues to work independently
10. All existing tests continue to pass
11. `CLAUDE.md` documents all new configuration options

## Technical Research

### Files to Modify

1. **`src/_data/config.js`**
   - Add 5 new schema entries (see Session 1)
   - Add defaults for new options

2. **`src/tasks.njk`**
   - Add new column header and cell after existing notes column
   - Implement conditional rendering based on per-view mode setting

3. **`src/timeline.njk`**
   - Same changes as tasks.njk, using timeline-specific config

4. **`src/css/styles.css`**
   - `.col-notes-text` - Column styling
   - `.notes-text-full` - Full mode styling (word-wrap, variable height)
   - `.notes-text-preview` - Preview mode styling (truncation, ellipsis, tooltip)

5. **`tests/config.test.js`**
   - Tests for new schema entries and parsing

6. **`tests/views.test.js`**
   - Tests for column rendering in both modes

7. **`CLAUDE.md`**
   - Document new configuration options

### Schema Additions

```javascript
// In CONFIG_SCHEMA
TASKS_COL_NOTES_TEXT: { path: "tasksColumns.notesText", type: "boolean" },
TASKS_NOTES_TEXT_MODE: { path: "tasksColumns.notesTextMode", type: "string" },
TIMELINE_COL_NOTES_TEXT: { path: "timelineColumns.notesText", type: "boolean" },
TIMELINE_NOTES_TEXT_MODE: { path: "timelineColumns.notesTextMode", type: "string" },
NOTES_TEXT_PREVIEW_LENGTH: { path: "notesTextPreviewLength", type: "number" },
```

### Template Structure

```njk
{# Tasks view - uses tasksColumns config #}
{% if config.tasksColumns.notesText %}
<td class="col-notes-text">
  {% if task.notes %}
    {% if config.tasksColumns.notesTextMode == 'full' %}
      <span class="notes-text-full">{{ task.notes }}</span>
    {% else %}
      <span class="notes-text-preview"
            data-notes="{{ task.notes }}"
            tabindex="0"
            role="button"
            aria-label="View full notes">
        {{ task.notes | truncate(config.notesTextPreviewLength) }}
      </span>
    {% endif %}
  {% else %}
    —
  {% endif %}
</td>
{% endif %}

{# Timeline view - uses timelineColumns config #}
{% if config.timelineColumns.notesText %}
<td class="col-notes-text">
  {% if task.notes %}
    {% if config.timelineColumns.notesTextMode == 'full' %}
      <span class="notes-text-full">{{ task.notes }}</span>
    {% else %}
      <span class="notes-text-preview"
            data-notes="{{ task.notes }}"
            tabindex="0"
            role="button"
            aria-label="View full notes">
        {{ task.notes | truncate(config.notesTextPreviewLength) }}
      </span>
    {% endif %}
  {% else %}
    —
  {% endif %}
</td>
{% endif %}
```

### CSS

```css
/* Base column styling */
.col-notes-text {
  min-width: 150px;
  max-width: 300px;
}

/* Preview mode - truncated with tooltip */
.notes-text-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
}

/* Reuse tooltip pattern from .notes-icon */
.notes-text-preview::after {
  /* Same tooltip styles as .notes-icon::after */
}

/* Full mode - variable height, word-wrap */
.notes-text-full {
  white-space: pre-wrap;
  word-wrap: break-word;
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
6. **Per-view flexibility**: Different modes per view allows tasks=preview, timeline=full

### Alternative Approaches Considered

1. **Replace icon with text** - Rejected: some users prefer compact icon view
2. **Expandable rows** - More complex, requires JavaScript for toggle
3. **Modal popup** - Overkill, tooltip system already works well
4. **Global mode setting** - Rejected: per-view mode offers more flexibility

## Priority

Low - Enhancement request, not a bug fix.

## Status

✅ **Complete** - All sessions implemented and verified

## Related

- QA-001: Mobile notes tooltip (established tooltip pattern)
- QA-003: Tooltip clipping fix (tooltip positioning)
