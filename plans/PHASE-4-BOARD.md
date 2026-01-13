# Phase 4: Kanban Board Page

> **Goal:** Create the Kanban board view with task cards in columns.
> **Sessions:** 1-2
> **Prerequisites:** Phase 3 complete (dashboard working)

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 4-A | 4.1 - 4.3 | Board layout, columns, task cards |
| 4-B | 4.4 - 4.5 | Card details, styling (if needed) |

## Board Requirements

- 5 columns: To do, Doing, Testing, Reviewing, Done
- Task cards showing: Name, Assignee, Due date, Priority badge, Status indicator
- Color-coded by status
- Clean, scannable layout

## Session 4-A: Board Structure

### Task 4.1: Create Board Page

Create `src/board.njk`:

```njk
---
layout: layouts/base.njk
title: Board
permalink: /board/
---

<div class="board-page">
  <div class="page-header">
    <h2>Kanban Board</h2>
    <p class="page-subtitle">{{ tasks.stats.total }} tasks across {{ tasks.stats.bySection | length }} columns</p>
  </div>

  <div class="board">
    {% for sectionName in ['To do', 'Doing', 'Testing', 'Reviewing', 'Done'] %}
      {% include "components/board-column.njk" %}
    {% endfor %}
  </div>
</div>
```

**Acceptance:**
- [ ] Page loads at /board/
- [ ] Shows 5 column placeholders
- [ ] Header displays correctly

---

### Task 4.2: Create Board Column Component

Create `src/_includes/components/board-column.njk`:

```njk
{% set columnTasks = tasks.sections[sectionName] %}

<div class="board-column">
  <div class="column-header">
    <h3 class="column-title">{{ sectionName }}</h3>
    <span class="column-count">{{ columnTasks.length }}</span>
  </div>
  <div class="column-cards">
    {% for task in columnTasks %}
      {% include "components/task-card.njk" %}
    {% endfor %}
  </div>
</div>
```

**Acceptance:**
- [ ] Each column shows correct title
- [ ] Column count is accurate
- [ ] Tasks appear in correct columns

---

### Task 4.3: Create Task Card Component

Create `src/_includes/components/task-card.njk`:

```njk
<div class="task-card {% if task.isOverdue %}is-overdue{% endif %}">
  <div class="card-header">
    <span class="task-name">{{ task.name }}</span>
    {% if task.status %}
      <span class="status-dot status-{{ task.status | lower | replace(' ', '-') }}"></span>
    {% endif %}
  </div>

  <div class="card-meta">
    {% if task.assignee and task.assignee != 'Unassigned' %}
      <span class="task-assignee">{{ task.assignee }}</span>
    {% endif %}

    {% if task.dueDate %}
      <span class="task-due {% if task.isOverdue %}overdue{% endif %}">
        {{ task.dueDate }}
      </span>
    {% endif %}
  </div>

  {% if task.priority %}
    <span class="priority-badge priority-{{ task.priority | lower }}">
      {{ task.priority }}
    </span>
  {% endif %}
</div>
```

**Acceptance:**
- [ ] Cards show task name
- [ ] Status dot appears with correct color
- [ ] Assignee shows when present
- [ ] Due date shows, red when overdue
- [ ] Priority badge appears when set

---

## Session 4-B: Styling (if needed)

### Task 4.4: Add Board Styles

Update `src/css/styles.css` with board styles:

```css
/* Board Layout */
.board-page {
  padding: 2rem;
}

.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  min-height: 600px;
}

/* Columns */
.board-column {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
}

.column-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.column-count {
  background: var(--color-border);
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

.column-cards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Task Cards */
.task-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.75rem;
}

.task-card.is-overdue {
  border-left: 3px solid var(--color-off-track);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.task-name {
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.3;
}

/* Status Dot */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.status-dot.status-on-track { background: var(--color-on-track); }
.status-dot.status-at-risk { background: var(--color-at-risk); }
.status-dot.status-off-track { background: var(--color-off-track); }

/* Card Meta */
.card-meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #666;
}

.task-due.overdue {
  color: var(--color-off-track);
  font-weight: 500;
}

/* Priority Badge */
.priority-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.priority-high {
  background: #fef2f2;
  color: var(--color-priority-high);
}

.priority-badge.priority-medium {
  background: #fefce8;
  color: #a16207;
}

.priority-badge.priority-low {
  background: #f0fdf4;
  color: #15803d;
}
```

**Acceptance:**
- [ ] Columns display horizontally
- [ ] Cards stack vertically in columns
- [ ] All colors match design system
- [ ] Overdue cards have left border

---

### Task 4.5: Responsive Adjustments

Add responsive styles for smaller screens:

```css
/* Board Responsive */
@media (max-width: 1200px) {
  .board {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .board {
    grid-template-columns: 1fr;
  }

  .board-column {
    max-height: 400px;
    overflow-y: auto;
  }
}
```

**Acceptance:**
- [ ] Board stacks on mobile
- [ ] Columns scrollable when content overflows
- [ ] Usable at all screen sizes

---

## Phase 4 Completion Checklist

- [ ] Board page loads at /board/
- [ ] All 5 columns display
- [ ] Task cards show in correct columns
- [ ] Cards display all required info
- [ ] Status colors work
- [ ] Priority badges work
- [ ] Overdue highlighting works
- [ ] Ready for Phase 5 (Task List)

## How to Start This Phase

```
Read plans/PHASE-4-BOARD.md and implement session 4-A.
```

If needed:
```
/clear
Read plans/PHASE-4-BOARD.md and implement session 4-B.
```
