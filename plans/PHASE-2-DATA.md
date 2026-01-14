# Phase 2: Data Layer

> **Status:** ✅ COMPLETE (with enhancements beyond plan)
> **Goal:** Parse CSV data and config, provide computed fields to templates.
> **Sessions:** 1
> **Prerequisites:** Phase 1 complete
>
> **Enhancements Added:**
> - Custom field support (auto-discovered from CSV)
> - Tags parsing and display
> - Parent task relationships and subtask handling
> - Section inheritance for subtasks

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 2-A | 2.1 - 2.4 | Full data layer implementation |

## Dynamic Data Principle

**Critical:** The data layer must handle ANY Asana board structure:
- Any section/column names (not just "To do", "Doing", "Done")
- Any number of sections (3, 5, 10, etc.)
- Any status values (not just "On track", "At risk", "Off track")
- Any priority values (not just "High", "Medium", "Low")
- Any number of tasks and assignees

Templates iterate over dynamic data - never hardcode field values.

## CSV Structure Reference

The Asana export CSV has these columns:
```
Task ID, Created At, Completed At, Last Modified, Name, Section/Column,
Assignee, Assignee Email, Start Date, Due Date, Tags, Notes, Projects,
Parent task, Blocked By, Blocking, Priority, Status
```

Key fields we use:
- `Name` - Task title
- `Section/Column` - Kanban column (any names customer uses)
- `Assignee` - Person assigned
- `Start Date`, `Due Date` - Date range
- `Priority` - Any priority scheme
- `Status` - Any status values

## Session 2-A: Data Layer Implementation

### Task 2.1: Create Config Parser

Create `src/_data/config.js` to read `dashana.config`:

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function() {
  const configPath = path.join(__dirname, '../../dashana.config');
  const config = {
    projectName: 'Project Report',
    customerName: 'Customer'
  };

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        if (key.trim() === 'PROJECT_NAME') config.projectName = value.trim();
        if (key.trim() === 'CUSTOMER_NAME') config.customerName = value.trim();
      }
    });
  } catch (e) {
    console.warn('dashana.config not found, using defaults');
  }

  return config;
};
```

**Acceptance:**
- [x] Config loads in templates as `{{ config.projectName }}`
- [x] Falls back to defaults if file missing

---

### Task 2.2: Create CSV Parser

Create `src/_data/tasks.js` to parse the Asana CSV:

```javascript
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = function() {
  const csvPath = path.join(__dirname, '../../data/project.csv');

  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    });

    return processRecords(records);
  } catch (e) {
    console.warn('data/project.csv not found');
    return { all: [], sections: {}, sectionNames: [], stats: {} };
  }
};
```

**Acceptance:**
- [x] CSV parses without errors
- [x] Records accessible in templates

---

### Task 2.3: Add Computed Fields with Dynamic Sections

Extend `tasks.js` with dynamic section discovery and computed fields:

```javascript
function processRecords(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // DYNAMIC: Extract unique section names in order of first appearance
  const sectionNamesSet = new Set();
  records.forEach(record => {
    const section = record['Section/Column'] || 'Uncategorized';
    sectionNamesSet.add(section);
  });
  const sectionNames = Array.from(sectionNamesSet);

  // Create section order map based on appearance order
  const sectionOrderMap = {};
  sectionNames.forEach((name, index) => {
    sectionOrderMap[name] = index + 1;
  });

  const tasks = records.map(record => {
    const section = record['Section/Column'] || 'Uncategorized';
    return {
      id: record['Task ID'],
      name: record['Name'],
      section: section,
      assignee: record['Assignee'] || 'Unassigned',
      assigneeEmail: record['Assignee Email'] || '',
      startDate: record['Start Date'] || null,
      dueDate: record['Due Date'] || null,
      priority: record['Priority'] || null,
      status: record['Status'] || null,
      notes: record['Notes'] || '',
      // Computed
      isOverdue: isOverdue(record['Due Date'], section, today),
      isDone: isDoneSection(section),
      daysUntilDue: daysUntil(record['Due Date'], today),
      priorityOrder: priorityOrder(record['Priority']),
      sectionOrder: sectionOrderMap[section] || 999
    };
  });

  // Sort by section order, then priority
  tasks.sort((a, b) => {
    if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
    return a.priorityOrder - b.priorityOrder;
  });

  // DYNAMIC: Group by section
  const sections = {};
  sectionNames.forEach(name => {
    sections[name] = tasks.filter(t => t.section === name);
  });

  const stats = calculateStats(tasks, sections, sectionNames);

  // Return sectionNames array for ordered iteration in templates
  return { all: tasks, sections, sectionNames, stats };
}

// Detect "done" sections by pattern matching
function isDoneSection(section) {
  if (!section) return false;
  const lower = section.toLowerCase();
  const donePatterns = ['done', 'complete', 'completed', 'finished', 'closed', 'resolved'];
  return donePatterns.some(pattern => lower.includes(pattern));
}

function isOverdue(dueDate, section, today) {
  if (!dueDate) return false;
  if (isDoneSection(section)) return false;
  return new Date(dueDate) < today;
}

function daysUntil(dueDate, today) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const diff = due - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function priorityOrder(priority) {
  const order = { 'High': 1, 'Medium': 2, 'Low': 3 };
  return order[priority] || 4;
}
```

**Acceptance:**
- [x] `tasks.all` contains all tasks with computed fields
- [x] `tasks.sections` groups tasks by column dynamically
- [x] `tasks.sectionNames` provides ordered array for iteration
- [x] `isDone` correctly identifies completed tasks by section name
- [x] Works with ANY section names, not just hardcoded ones

---

### Task 2.4: Calculate Statistics Dynamically

Add stats calculation that collects values dynamically:

```javascript
function calculateStats(tasks, sections, sectionNames) {
  const total = tasks.length;
  const done = tasks.filter(t => t.isDone).length;
  const overdue = tasks.filter(t => t.isOverdue).length;

  // DYNAMIC: Collect all status values from data
  const byStatus = {};
  tasks.forEach(t => {
    if (t.status) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }
  });

  // DYNAMIC: Collect all priority values from data
  const byPriority = {};
  tasks.forEach(t => {
    if (t.priority) {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    }
  });

  // DYNAMIC: Collect all assignees
  const byAssignee = {};
  tasks.forEach(t => {
    byAssignee[t.assignee] = (byAssignee[t.assignee] || 0) + 1;
  });

  // DYNAMIC: Section counts
  const bySection = {};
  sectionNames.forEach(name => {
    bySection[name] = sections[name].length;
  });

  return {
    total,
    done,
    overdue,
    completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    byStatus,
    byPriority,
    byAssignee,
    bySection
  };
}
```

**Acceptance:**
- [x] `tasks.stats.total` returns correct count
- [x] `tasks.stats.completionPercent` calculates correctly
- [x] `byStatus` contains only statuses that exist in data
- [x] `byPriority` contains only priorities that exist in data
- [x] Works with ANY field values, not hardcoded ones

---

## Data Structure Reference

After processing, templates receive:

```javascript
{
  all: [/* array of all task objects */],
  sections: {
    "Section Name 1": [/* tasks in this section */],
    "Section Name 2": [/* tasks in this section */],
    // ... dynamically created from data
  },
  sectionNames: ["Section Name 1", "Section Name 2", ...], // ordered array
  stats: {
    total: 20,
    done: 5,
    overdue: 2,
    completionPercent: 25,
    byStatus: { "On track": 10, "At risk": 5, ... },  // dynamic
    byPriority: { "High": 3, "Medium": 10, ... },     // dynamic
    byAssignee: { "Alice": 5, "Bob": 8, ... },        // dynamic
    bySection: { "To do": 5, "In Progress": 8, ... }  // dynamic
  }
}
```

## Template Usage

Templates should iterate dynamically, never hardcode values:

```njk
{# GOOD: Dynamic iteration #}
{% for section, count in tasks.stats.bySection %}
  <li>{{ section }}: {{ count }}</li>
{% endfor %}

{# GOOD: Using sectionNames for ordered iteration #}
{% for sectionName in tasks.sectionNames %}
  <div class="column">{{ sectionName }}</div>
{% endfor %}

{# BAD: Hardcoded values - DON'T DO THIS #}
<li>To do: {{ tasks.stats.bySection['To do'] }}</li>
<li>Done: {{ tasks.stats.bySection['Done'] }}</li>
```

---

## Phase 2 Completion Checklist

- [x] Config loads from `dashana.config`
- [x] CSV parses all fields correctly
- [x] Sections discovered dynamically from data
- [x] "Done" sections detected by pattern matching
- [x] Status/priority values collected dynamically
- [x] Computed fields work (isOverdue, isDone, etc.)
- [x] Stats calculate correctly for any data
- [x] Data accessible in templates
- [x] Ready for Phase 3 (Dashboard)

## How to Start This Phase

```
Read plans/PHASE-2-DATA.md and implement session 2-A.
```
