# Phase 6: Timeline Page

> **Goal:** Create timeline view showing task date ranges as visual bars.
> **Sessions:** 1
> **Prerequisites:** Phase 5 complete

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 6-A | 6.1 - 6.4 | Full timeline implementation |

## Timeline Requirements

- Table with: Task Name, Start Date, Due Date, Duration Bar, Status
- Visual bars showing date range relative to project span
- Overdue tasks highlighted in red
- Tasks sorted by start date or due date

## Session 6-A: Timeline Implementation

### Task 6.1: Add Timeline Data Helpers

Update `src/_data/tasks.js` to include timeline calculations:

```javascript
// Add to processRecords function
function processRecords(records) {
  // ... existing code ...

  // Calculate project date range for timeline
  const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate);
  let projectStart = null;
  let projectEnd = null;

  tasksWithDates.forEach(t => {
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.dueDate ? new Date(t.dueDate) : null;

    if (start && (!projectStart || start < projectStart)) projectStart = start;
    if (end && (!projectEnd || end > projectEnd)) projectEnd = end;
  });

  const projectSpan = projectStart && projectEnd
    ? Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24))
    : 30; // default 30 days

  // Add timeline position to each task
  tasks.forEach(task => {
    if (task.startDate || task.dueDate) {
      const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
      const end = task.dueDate ? new Date(task.dueDate) : start;

      const startOffset = projectStart
        ? Math.ceil((start - projectStart) / (1000 * 60 * 60 * 24))
        : 0;
      const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

      task.timeline = {
        startPercent: Math.max(0, (startOffset / projectSpan) * 100),
        widthPercent: Math.min(100 - (startOffset / projectSpan) * 100, (duration / projectSpan) * 100)
      };
    } else {
      task.timeline = null;
    }
  });

  // Sort for timeline view (by start date, then due date)
  const timelineTasks = [...tasks]
    .filter(t => t.startDate || t.dueDate)
    .sort((a, b) => {
      const aDate = a.startDate || a.dueDate;
      const bDate = b.startDate || b.dueDate;
      return new Date(aDate) - new Date(bDate);
    });

  return {
    all: tasks,
    sections,
    stats,
    timeline: timelineTasks,
    projectRange: {
      start: projectStart ? projectStart.toISOString().split('T')[0] : null,
      end: projectEnd ? projectEnd.toISOString().split('T')[0] : null,
      days: projectSpan
    }
  };
}
```

**Acceptance:**
- [ ] `tasks.timeline` contains date-sorted tasks
- [ ] `tasks.projectRange` has start/end dates
- [ ] Each task has `timeline.startPercent` and `widthPercent`

---

### Task 6.2: Create Timeline Page

Create `src/timeline.njk`:

```njk
---
layout: layouts/base.njk
title: Timeline
permalink: /timeline/
---

<div class="timeline-page">
  <div class="page-header">
    <h2>Timeline</h2>
    <p class="page-subtitle">
      {{ tasks.timeline.length }} tasks with dates
      {% if tasks.projectRange.start %}
        ({{ tasks.projectRange.start }} to {{ tasks.projectRange.end }})
      {% endif %}
    </p>
  </div>

  <div class="table-container">
    <table class="timeline-table">
      <thead>
        <tr>
          <th class="col-name">Task</th>
          <th class="col-start">Start</th>
          <th class="col-due">Due</th>
          <th class="col-bar">Duration</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        {% for task in tasks.timeline %}
        <tr class="{% if task.isOverdue %}row-overdue{% endif %}">
          <td class="col-name">{{ task.name }}</td>
          <td class="col-start">{{ task.startDate if task.startDate else '—' }}</td>
          <td class="col-due {% if task.isOverdue %}overdue{% endif %}">
            {{ task.dueDate if task.dueDate else '—' }}
          </td>
          <td class="col-bar">
            {% if task.timeline %}
            <div class="timeline-bar-container">
              <div class="timeline-bar {% if task.isOverdue %}overdue{% endif %}"
                   style="left: {{ task.timeline.startPercent }}%; width: {{ task.timeline.widthPercent }}%">
              </div>
            </div>
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

  {% if tasks.timeline.length == 0 %}
  <p class="empty-state">No tasks have start or due dates set.</p>
  {% endif %}
</div>
```

**Acceptance:**
- [ ] Page loads at /timeline/
- [ ] Tasks with dates appear
- [ ] Date range shown in header
- [ ] Empty state when no dated tasks

---

### Task 6.3: Add Timeline Styles

Update `src/css/styles.css`:

```css
/* Timeline Page */
.timeline-page {
  padding: 2rem;
}

.timeline-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.timeline-table th,
.timeline-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.timeline-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #666;
}

/* Column widths */
.timeline-table .col-name { min-width: 180px; }
.timeline-table .col-start { width: 100px; }
.timeline-table .col-due { width: 100px; }
.timeline-table .col-bar { width: 300px; min-width: 200px; }
.timeline-table .col-status { width: 100px; }

/* Timeline Bar */
.timeline-bar-container {
  position: relative;
  height: 20px;
  background: #f0f0f0;
  border-radius: 3px;
}

.timeline-bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  background: var(--color-accent);
  border-radius: 2px;
  min-width: 4px;
}

.timeline-bar.overdue {
  background: var(--color-off-track);
}

/* Empty state */
.empty-state {
  text-align: center;
  color: #666;
  padding: 3rem;
}
```

**Acceptance:**
- [ ] Timeline bars render correctly
- [ ] Bars positioned based on date range
- [ ] Overdue bars are red
- [ ] Table scrolls horizontally if needed

---

### Task 6.4: Add Row Hover and Polish

Add finishing touches:

```css
/* Timeline hover */
.timeline-table tbody tr:hover {
  background: #f8f9fa;
}

.timeline-table tbody tr:hover .timeline-bar-container {
  background: #e5e5e5;
}

/* Alternating rows */
.timeline-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.timeline-table .row-overdue {
  background: #fef2f2 !important;
}
```

**Acceptance:**
- [ ] Row hover works
- [ ] Alternating colors work
- [ ] Overdue rows highlighted
- [ ] All interactions smooth

---

## Phase 6 Completion Checklist

- [ ] Timeline page loads at /timeline/
- [ ] Tasks sorted by date
- [ ] Visual bars show date ranges
- [ ] Bars positioned correctly relative to project span
- [ ] Overdue highlighting works
- [ ] Empty state displays when appropriate
- [ ] Ready for Phase 7 (Versioning)

## How to Start This Phase

```
Read plans/PHASE-6-TIMELINE.md and implement session 6-A.
```
