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
    console.warn('data/project.csv not found:', e.message);
    return { all: [], sections: {}, sectionNames: [], stats: {}, timeline: [], projectRange: { start: null, end: null, days: 0 } };
  }
};

function processRecords(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Extract unique section names in order of first appearance
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

  // Group by section dynamically
  const sections = {};
  sectionNames.forEach(name => {
    sections[name] = tasks.filter(t => t.section === name);
  });

  // Calculate stats
  const stats = calculateStats(tasks, sections, sectionNames);

  // Calculate project date range for timeline
  const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate);
  let projectStart = null;
  let projectEnd = null;

  tasksWithDates.forEach(t => {
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.dueDate ? new Date(t.dueDate) : null;

    if (start && (!projectStart || start < projectStart)) projectStart = start;
    if (end && (!projectEnd || end > projectEnd)) projectEnd = end;
    // Also consider start dates for project end if no due date
    if (start && (!projectEnd || start > projectEnd)) projectEnd = start;
  });

  const projectSpan = projectStart && projectEnd
    ? Math.max(1, Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24)) + 1)
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
    sectionNames,
    stats,
    timeline: timelineTasks,
    projectRange: {
      start: projectStart ? projectStart.toISOString().split('T')[0] : null,
      end: projectEnd ? projectEnd.toISOString().split('T')[0] : null,
      days: projectSpan
    }
  };
}

// Check if a section represents "done" tasks
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

function calculateStats(tasks, sections, sectionNames) {
  const total = tasks.length;
  const done = tasks.filter(t => t.isDone).length;
  const overdue = tasks.filter(t => t.isOverdue).length;

  // By status - dynamically collect all statuses (including "No status")
  const byStatus = {};
  let noStatusCount = 0;
  tasks.forEach(t => {
    if (t.status) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    } else {
      noStatusCount++;
    }
  });
  if (noStatusCount > 0) {
    byStatus['No status'] = noStatusCount;
  }

  // By priority - dynamically collect all priorities (including "No priority")
  const byPriority = {};
  let noPriorityCount = 0;
  tasks.forEach(t => {
    if (t.priority) {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    } else {
      noPriorityCount++;
    }
  });
  if (noPriorityCount > 0) {
    byPriority['No priority'] = noPriorityCount;
  }

  // By assignee
  const byAssignee = {};
  tasks.forEach(t => {
    byAssignee[t.assignee] = (byAssignee[t.assignee] || 0) + 1;
  });

  // By section
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
