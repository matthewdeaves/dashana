# Phase 3: Dashboard Page

> **Goal:** Build the main dashboard with all metrics and navigation.
> **Sessions:** 2
> **Prerequisites:** Phase 2 complete (data layer working)

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 3-A | 3.1 - 3.3 | Layout structure, header, basic metrics |
| 3-B | 3.4 - 3.6 | Remaining metrics, styling, polish |

## Dashboard Requirements

The dashboard shows:
- Task counts by section
- Priority breakdown with visual bars
- Status breakdown with color coding
- Completion percentage with progress bar
- Overdue task count
- Tasks by assignee
- Navigation to other views
- Version selector (placeholder for Phase 7)

## Session 3-A: Dashboard Structure

### Task 3.1: Update Header Component

Enhance `src/_includes/components/header.njk` with full navigation and project title:

```njk
<header class="site-header">
  <div class="header-top">
    <h1 class="site-title">{{ config.projectName }}</h1>
    <span class="customer-name">{{ config.customerName }}</span>
  </div>
  <nav class="main-nav">
    <a href="/" class="nav-link {% if page.url == '/' %}active{% endif %}">Dashboard</a>
    <a href="/board/" class="nav-link {% if page.url == '/board/' %}active{% endif %}">Board</a>
    <a href="/tasks/" class="nav-link {% if page.url == '/tasks/' %}active{% endif %}">Tasks</a>
    <a href="/timeline/" class="nav-link {% if page.url == '/timeline/' %}active{% endif %}">Timeline</a>
  </nav>
  <div class="version-selector">
    <!-- Version dropdown added in Phase 7 -->
    <span class="version-label">Latest Report</span>
  </div>
</header>
```

**Acceptance:**
- [ ] Header shows project and customer name
- [ ] Navigation links work
- [ ] Active state shows on current page

---

### Task 3.2: Create Dashboard Layout

Update `src/index.njk` with dashboard structure:

```njk
---
layout: layouts/base.njk
title: Dashboard
---

<div class="dashboard">
  <div class="dashboard-header">
    <h2>Project Overview</h2>
    <p class="dashboard-subtitle">{{ tasks.stats.total }} total tasks</p>
  </div>

  <div class="metrics-grid">
    {% include "components/metric-completion.njk" %}
    {% include "components/metric-sections.njk" %}
    {% include "components/metric-status.njk" %}
    {% include "components/metric-priority.njk" %}
    {% include "components/metric-overdue.njk" %}
    {% include "components/metric-assignees.njk" %}
  </div>
</div>
```

**Acceptance:**
- [ ] Dashboard layout renders
- [ ] Total task count displays
- [ ] Grid structure in place

---

### Task 3.3: Create Completion Metric

Create `src/_includes/components/metric-completion.njk`:

```njk
<div class="metric-card metric-completion">
  <h3 class="metric-title">Completion</h3>
  <div class="completion-display">
    <span class="completion-percent">{{ tasks.stats.completionPercent }}%</span>
    <span class="completion-detail">{{ tasks.stats.done }} of {{ tasks.stats.total }} done</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: {{ tasks.stats.completionPercent }}%"></div>
  </div>
</div>
```

**Acceptance:**
- [ ] Shows percentage
- [ ] Shows X of Y done
- [ ] Progress bar fills correctly

---

## Session 3-B: Metrics and Styling

### Task 3.4: Create Section Counts Metric

Create `src/_includes/components/metric-sections.njk`:

```njk
<div class="metric-card metric-sections">
  <h3 class="metric-title">By Section</h3>
  <ul class="section-list">
    {% for section, count in tasks.stats.bySection %}
    <li class="section-item">
      <span class="section-name">{{ section }}</span>
      <span class="section-count">{{ count }}</span>
    </li>
    {% endfor %}
  </ul>
</div>
```

Create `src/_includes/components/metric-status.njk`:

```njk
<div class="metric-card metric-status">
  <h3 class="metric-title">Status</h3>
  <ul class="status-list">
    <li class="status-item status-on-track">
      <span class="status-name">On track</span>
      <span class="status-count">{{ tasks.stats.byStatus['On track'] }}</span>
    </li>
    <li class="status-item status-at-risk">
      <span class="status-name">At risk</span>
      <span class="status-count">{{ tasks.stats.byStatus['At risk'] }}</span>
    </li>
    <li class="status-item status-off-track">
      <span class="status-name">Off track</span>
      <span class="status-count">{{ tasks.stats.byStatus['Off track'] }}</span>
    </li>
  </ul>
</div>
```

**Acceptance:**
- [ ] All 5 sections show with counts
- [ ] Status shows with color coding
- [ ] Counts are accurate

---

### Task 3.5: Create Priority and Overdue Metrics

Create `src/_includes/components/metric-priority.njk`:

```njk
<div class="metric-card metric-priority">
  <h3 class="metric-title">Priority</h3>
  <ul class="priority-list">
    <li class="priority-item priority-high">
      <span class="priority-name">High</span>
      <div class="priority-bar">
        <div class="priority-fill" style="width: {{ (tasks.stats.byPriority['High'] / tasks.stats.total * 100) | round }}%"></div>
      </div>
      <span class="priority-count">{{ tasks.stats.byPriority['High'] }}</span>
    </li>
    <li class="priority-item priority-medium">
      <span class="priority-name">Medium</span>
      <div class="priority-bar">
        <div class="priority-fill" style="width: {{ (tasks.stats.byPriority['Medium'] / tasks.stats.total * 100) | round }}%"></div>
      </div>
      <span class="priority-count">{{ tasks.stats.byPriority['Medium'] }}</span>
    </li>
    <li class="priority-item priority-low">
      <span class="priority-name">Low</span>
      <div class="priority-bar">
        <div class="priority-fill" style="width: {{ (tasks.stats.byPriority['Low'] / tasks.stats.total * 100) | round }}%"></div>
      </div>
      <span class="priority-count">{{ tasks.stats.byPriority['Low'] }}</span>
    </li>
  </ul>
</div>
```

Create `src/_includes/components/metric-overdue.njk`:

```njk
<div class="metric-card metric-overdue {% if tasks.stats.overdue > 0 %}has-overdue{% endif %}">
  <h3 class="metric-title">Overdue</h3>
  <div class="overdue-display">
    <span class="overdue-count">{{ tasks.stats.overdue }}</span>
    <span class="overdue-label">tasks past due</span>
  </div>
</div>
```

**Acceptance:**
- [ ] Priority shows with visual bars
- [ ] Bars sized proportionally
- [ ] Overdue count displays
- [ ] Overdue card highlights when > 0

---

### Task 3.6: Create Assignee Metric and Dashboard Styles

Create `src/_includes/components/metric-assignees.njk`:

```njk
<div class="metric-card metric-assignees">
  <h3 class="metric-title">By Assignee</h3>
  <ul class="assignee-list">
    {% for assignee, count in tasks.stats.byAssignee %}
    <li class="assignee-item">
      <span class="assignee-name">{{ assignee }}</span>
      <span class="assignee-count">{{ count }}</span>
    </li>
    {% endfor %}
  </ul>
</div>
```

Update `src/css/styles.css` with dashboard styles:

```css
/* Dashboard Layout */
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Metric Cards */
.metric-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1.5rem;
}

.metric-title {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: #666;
  margin: 0 0 1rem 0;
}

/* Progress Bar */
.progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s;
}

/* Status Colors */
.status-on-track .status-count { color: var(--color-on-track); }
.status-at-risk .status-count { color: var(--color-at-risk); }
.status-off-track .status-count { color: var(--color-off-track); }

/* Priority Colors */
.priority-high .priority-fill { background: var(--color-priority-high); }
.priority-medium .priority-fill { background: var(--color-priority-medium); }
.priority-low .priority-fill { background: var(--color-priority-low); }

/* Overdue Highlight */
.metric-overdue.has-overdue {
  border-color: var(--color-off-track);
  background: #fef2f2;
}
```

**Acceptance:**
- [ ] All assignees listed with counts
- [ ] Grid layout works responsively
- [ ] Cards have consistent styling
- [ ] Colors match design system

---

## Phase 3 Completion Checklist

- [ ] All 6 metric components created
- [ ] Dashboard displays all metrics correctly
- [ ] Header shows project info
- [ ] Navigation works
- [ ] Styling matches design system
- [ ] Ready for Phase 4 (Kanban Board)

## How to Start This Phase

```
Read plans/PHASE-3-DASHBOARD.md and implement session 3-A.
```

After session 3-A:
```
/clear
Read plans/PHASE-3-DASHBOARD.md and implement session 3-B.
```
