# Phase 5: Task List Page

> **Goal:** Create the task list table view with sorting and badges.
> **Sessions:** 1
> **Prerequisites:** Phase 4 complete

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 5-A | 5.1 - 5.3 | Full table implementation |

## Task List Requirements

- Table columns: Name, Section, Assignee, Due Date, Priority, Status
- Pre-sorted by section, then priority (done in data layer)
- Visual badges for priority and status
- Alternating row colors
- Clean, scannable layout

## Session 5-A: Task List Implementation

### Task 5.1: Create Task List Page

Create `src/tasks.njk`:

```njk
---
layout: layouts/base.njk
title: Tasks
permalink: /tasks/
---

<div class="tasks-page">
  <div class="page-header">
    <h2>Task List</h2>
    <p class="page-subtitle">{{ tasks.stats.total }} tasks sorted by section and priority</p>
  </div>

  <div class="table-container">
    <table class="task-table">
      <thead>
        <tr>
          <th class="col-name">Name</th>
          <th class="col-section">Section</th>
          <th class="col-assignee">Assignee</th>
          <th class="col-due">Due Date</th>
          <th class="col-priority">Priority</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        {% for task in tasks.all %}
        <tr class="{% if task.isOverdue %}row-overdue{% endif %}">
          <td class="col-name">{{ task.name }}</td>
          <td class="col-section">
            <span class="section-badge">{{ task.section }}</span>
          </td>
          <td class="col-assignee">{{ task.assignee if task.assignee != 'Unassigned' else '—' }}</td>
          <td class="col-due {% if task.isOverdue %}overdue{% endif %}">
            {{ task.dueDate if task.dueDate else '—' }}
          </td>
          <td class="col-priority">
            {% if task.priority %}
              <span class="priority-badge priority-{{ task.priority | lower }}">{{ task.priority }}</span>
            {% else %}
              —
            {% endif %}
          </td>
          <td class="col-status">
            {% if task.status %}
              <span class="status-badge status-{{ task.status | lower | replace(' ', '-') }}">{{ task.status }}</span>
            {% else %}
              —
            {% endif %}
          </td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>
</div>
```

**Acceptance:**
- [ ] Page loads at /tasks/
- [ ] All tasks display in table
- [ ] Tasks sorted by section then priority
- [ ] All columns populated

---

### Task 5.2: Add Table Styles

Update `src/css/styles.css` with table styles:

```css
/* Task List Page */
.tasks-page {
  padding: 2rem;
}

.table-container {
  overflow-x: auto;
}

/* Table */
.task-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.task-table th,
.task-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.task-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #666;
}

.task-table tbody tr:hover {
  background: #f8f9fa;
}

/* Alternating rows */
.task-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.task-table tbody tr:nth-child(even):hover {
  background: #f0f0f0;
}

/* Overdue row */
.task-table .row-overdue {
  background: #fef2f2 !important;
}

/* Column widths */
.col-name { min-width: 200px; }
.col-section { width: 100px; }
.col-assignee { width: 120px; }
.col-due { width: 100px; }
.col-priority { width: 80px; }
.col-status { width: 100px; }

/* Overdue text */
.col-due.overdue {
  color: var(--color-off-track);
  font-weight: 500;
}

/* Section Badge */
.section-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #e5e5e5;
  border-radius: 3px;
  font-size: 0.75rem;
}
```

**Acceptance:**
- [ ] Table has clean styling
- [ ] Alternating row colors work
- [ ] Overdue rows highlighted
- [ ] Columns sized appropriately

---

### Task 5.3: Add Status Badge Styles

Add status badge styles (may reuse from board):

```css
/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.status-on-track {
  background: #f0fdf4;
  color: #15803d;
}

.status-badge.status-at-risk {
  background: #fefce8;
  color: #a16207;
}

.status-badge.status-off-track {
  background: #fef2f2;
  color: var(--color-off-track);
}
```

**Acceptance:**
- [ ] Status badges have correct colors
- [ ] Priority badges consistent with board
- [ ] Badges readable and clear

---

## Phase 5 Completion Checklist

- [ ] Task list page loads at /tasks/
- [ ] All tasks displayed in table
- [ ] Sorting correct (section → priority)
- [ ] All badges styled correctly
- [ ] Alternating rows work
- [ ] Overdue highlighting works
- [ ] Table scrolls on mobile
- [ ] Ready for Phase 6 (Timeline)

## How to Start This Phase

```
Read plans/PHASE-5-TASKS.md and implement session 5-A.
```
