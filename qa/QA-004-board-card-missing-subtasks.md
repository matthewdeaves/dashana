# QA-004: Board card shows only same-section subtasks, not total subtask count

## Summary
On the Kanban board view, a parent task card only displays subtasks that are in the same board column/section. When subtasks have moved to different columns (e.g., some in "To do", some in "Doing"), the parent card only shows subtasks that share its section. This can mislead users into thinking a task has fewer subtasks than it actually does.

## Steps to Reproduce
1. Open the Board view
2. Find "Implement biometric authentication" in the "Doing" column
3. Observe: Only 1 subtask is shown ("iOS biometric setup")
4. Navigate to the Tasks view
5. Find "Implement biometric authentication"
6. Observe: 3 subtasks are shown (iOS, Android, UI components)

## Expected Behavior
User should have a clear understanding of the total number of subtasks for a parent task, regardless of which column they're viewing.

## Actual Behavior
The board card shows only 1 subtask, while the Tasks table correctly shows all 3 subtasks. This discrepancy can cause confusion.

## Root Cause Analysis
The board column rendering logic only shows subtasks that are in the **same section** as their parent task.

### Data
From `data/project.csv`:
- **"Implement biometric authentication"** - Section: Doing
- **"SUBTASK: iOS biometric setup"** - Section: Doing (same as parent)
- **"SUBTASK: Android biometric setup"** - Section: To do (different)
- **"SUBTASK: Biometric UI components"** - Section: To do (different)

### Code Flow
1. `src/_data/tasks.js:306-311` builds `subtasksInSection` array containing only subtasks in the same section as parent
2. `src/_includes/components/board-column.njk:27` iterates over `task.subtasksInSection` to render subtasks

```javascript
// tasks.js:306-311
if (!task.isSubtask) {
  task.subtasksInSection =
    subtasksByParentInSection[section]?.[task.name] || [];
  task.hasSubtasksInSection = task.subtasksInSection.length > 0;
}
```

```njk
{# board-column.njk:27 #}
{% for t in task.subtasksInSection %}
```

### Affected Files
- `src/_data/tasks.js` (lines 306-311) - subtask grouping logic
- `src/_includes/components/board-column.njk` (lines 22-49) - board rendering

## Design Consideration
The current behavior is **intentional** for a Kanban board - each column represents a workflow stage, and subtasks that have moved to different stages appear in their respective columns. This follows standard Kanban principles.

However, from a **UX perspective**, users may want to:
1. See the total subtask count on the parent card
2. Know when some subtasks exist in other columns
3. Have a quick way to find all subtasks of a parent task

## Potential Solutions

### Option 1: Add subtask count indicator (Recommended)
Show total subtask count on parent cards with a visual indicator, e.g., "3 subtasks (1 here, 2 elsewhere)".

Requires:
- Calculate total subtasks for each parent in `tasks.js`
- Display count in `task-card.njk` or `board-column.njk`

### Option 2: Visual cross-reference
Add a small badge or icon indicating "subtasks in other columns exist" without changing the grouping behavior.

### Option 3: Keep current behavior (document only)
Current behavior is valid for Kanban. Document in user guide that subtasks appear in their assigned columns.

### Option 4: Configuration option
Add a config flag like `BOARD_SHOW_ALL_SUBTASKS=YES/NO` to let users choose whether to group all subtasks under parent regardless of section.

## Timeline View Verification
The timeline view (`src/timeline.njk`) was also reviewed. It correctly sorts all tasks chronologically by `startDate` (falling back to `dueDate`). No issues found - the sorting logic at `tasks.js:382-390` is correct.

## Priority
Low - Behavior is intentional and follows Kanban principles. Impact is UX clarity, not functionality.

## Status
Fixed

## Resolution
Implemented Option 1: Added a subtask count indicator that displays on parent task cards when subtasks exist in other columns.

### Changes Made
1. **`src/_data/tasks.js`** - Added tracking for total subtasks across all sections:
   - `allSubtasksByParent` map tracks all subtasks regardless of section
   - `totalSubtaskCount` property on parent tasks shows total subtask count
   - `subtasksElsewhereCount` property shows how many subtasks are in other columns

2. **`src/_includes/components/board-column.njk`** - Added indicator display:
   - When parent has subtasks in current section AND elsewhere: shows "X subtasks total (Y in other columns)"
   - When parent has ALL subtasks elsewhere: shows "X subtask(s) in other columns"

3. **`src/css/styles.css`** - Added `.subtasks-elsewhere-indicator` styling:
   - Muted text, small font, subtle background
   - Visual connection to subtasks container when both present
