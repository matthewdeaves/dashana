const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Import the processing logic by reading and extracting functions from tasks.js
// We'll recreate the key functions here for testing
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

function priorityOrder(priority) {
  const order = { 'High': 1, 'Medium': 2, 'Low': 3 };
  return order[priority] || 4;
}

function processRecords(records, today = new Date()) {
  today.setHours(0, 0, 0, 0);

  const sectionNamesSet = new Set();
  records.forEach(record => {
    const section = record['Section/Column'] || 'Uncategorized';
    sectionNamesSet.add(section);
  });
  const sectionNames = Array.from(sectionNamesSet);

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
      isOverdue: isOverdue(record['Due Date'], section, today),
      isDone: isDoneSection(section),
      priorityOrder: priorityOrder(record['Priority']),
      sectionOrder: sectionOrderMap[section] || 999
    };
  });

  const sections = {};
  sectionNames.forEach(name => {
    sections[name] = tasks.filter(t => t.section === name);
  });

  const stats = calculateStats(tasks, sections, sectionNames);

  return { all: tasks, sections, sectionNames, stats };
}

function calculateStats(tasks, sections, sectionNames) {
  const total = tasks.length;
  const done = tasks.filter(t => t.isDone).length;
  const overdue = tasks.filter(t => t.isOverdue).length;

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

  const byAssignee = {};
  tasks.forEach(t => {
    byAssignee[t.assignee] = (byAssignee[t.assignee] || 0) + 1;
  });

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

// Load test fixture
function loadTestData() {
  const csvPath = path.join(__dirname, 'fixtures/test-project.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });
}


describe('isDoneSection', () => {
  test('recognizes "Done" section', () => {
    expect(isDoneSection('Done')).toBe(true);
  });

  test('recognizes "Completed" section', () => {
    expect(isDoneSection('Completed')).toBe(true);
  });

  test('recognizes case variations', () => {
    expect(isDoneSection('DONE')).toBe(true);
    expect(isDoneSection('done')).toBe(true);
    expect(isDoneSection('Completed Tasks')).toBe(true);
  });

  test('returns false for non-done sections', () => {
    expect(isDoneSection('To do')).toBe(false);
    expect(isDoneSection('In Progress')).toBe(false);
    expect(isDoneSection('Testing')).toBe(false);
  });

  test('handles null/undefined', () => {
    expect(isDoneSection(null)).toBe(false);
    expect(isDoneSection(undefined)).toBe(false);
    expect(isDoneSection('')).toBe(false);
  });
});

describe('isOverdue', () => {
  const today = new Date('2026-01-15');

  test('returns true for past due dates in active sections', () => {
    expect(isOverdue('2026-01-10', 'To do', today)).toBe(true);
    expect(isOverdue('2026-01-14', 'In Progress', today)).toBe(true);
  });

  test('returns false for future due dates', () => {
    expect(isOverdue('2026-01-20', 'To do', today)).toBe(false);
    expect(isOverdue('2026-01-16', 'In Progress', today)).toBe(false);
  });

  test('returns false for done sections regardless of date', () => {
    expect(isOverdue('2026-01-01', 'Done', today)).toBe(false);
    expect(isOverdue('2026-01-01', 'Completed', today)).toBe(false);
  });

  test('returns false for null/empty due dates', () => {
    expect(isOverdue(null, 'To do', today)).toBe(false);
    expect(isOverdue('', 'To do', today)).toBe(false);
  });
});

describe('priorityOrder', () => {
  test('High priority is first', () => {
    expect(priorityOrder('High')).toBe(1);
  });

  test('Medium priority is second', () => {
    expect(priorityOrder('Medium')).toBe(2);
  });

  test('Low priority is third', () => {
    expect(priorityOrder('Low')).toBe(3);
  });

  test('Unknown/null priority is last', () => {
    expect(priorityOrder(null)).toBe(4);
    expect(priorityOrder('Unknown')).toBe(4);
    expect(priorityOrder('')).toBe(4);
  });
});

describe('Data Processing with Test Fixture', () => {
  let data;

  beforeAll(() => {
    const records = loadTestData();
    // Use a fixed date for consistent testing
    data = processRecords(records, new Date('2026-01-15'));
  });

  test('counts total tasks correctly', () => {
    expect(data.stats.total).toBe(8);
  });

  test('counts done tasks correctly', () => {
    // Done section: Task Five, Task Six
    // Completed section: Task Eight
    expect(data.stats.done).toBe(3);
  });

  test('calculates completion percentage', () => {
    // 3 done out of 8 = 37.5% rounds to 38%
    expect(data.stats.completionPercent).toBe(38);
  });

  test('counts overdue tasks correctly', () => {
    // With today = 2026-01-15:
    // Task One: due 2026-01-10 (overdue, in To do)
    // Task Two: due 2026-01-05 (overdue, in To do)
    // Task Three: due 2026-01-08 (overdue, in In Progress)
    // Task Five: due 2026-01-03 (NOT overdue, in Done section)
    expect(data.stats.overdue).toBe(3);
  });

  test('groups tasks by section', () => {
    expect(data.stats.bySection['To do']).toBe(3);
    expect(data.stats.bySection['In Progress']).toBe(2);
    expect(data.stats.bySection['Done']).toBe(2);
    expect(data.stats.bySection['Completed']).toBe(1);
  });

  test('groups tasks by status including "No status"', () => {
    // On track: Task One, Task Three, Task Five = 3
    // At risk: Task Two = 1
    // Off track: Task Four = 1
    // No status: Task Six, Task Seven, Task Eight = 3
    expect(data.stats.byStatus['On track']).toBe(3);
    expect(data.stats.byStatus['At risk']).toBe(1);
    expect(data.stats.byStatus['Off track']).toBe(1);
    expect(data.stats.byStatus['No status']).toBe(3);
  });

  test('status counts sum to total', () => {
    const statusSum = Object.values(data.stats.byStatus).reduce((a, b) => a + b, 0);
    expect(statusSum).toBe(data.stats.total);
  });

  test('groups tasks by priority including "No priority"', () => {
    expect(data.stats.byPriority['High']).toBe(2);
    expect(data.stats.byPriority['Medium']).toBe(2);
    expect(data.stats.byPriority['Low']).toBe(1);
    expect(data.stats.byPriority['No priority']).toBe(3);
  });

  test('priority counts sum to total', () => {
    const prioritySum = Object.values(data.stats.byPriority).reduce((a, b) => a + b, 0);
    expect(prioritySum).toBe(data.stats.total);
  });

  test('groups tasks by assignee', () => {
    expect(data.stats.byAssignee['Alice']).toBe(3);
    expect(data.stats.byAssignee['Bob']).toBe(2);
    expect(data.stats.byAssignee['Unassigned']).toBe(3);
  });

  test('assignee counts sum to total', () => {
    const assigneeSum = Object.values(data.stats.byAssignee).reduce((a, b) => a + b, 0);
    expect(assigneeSum).toBe(data.stats.total);
  });

  test('section counts sum to total', () => {
    const sectionSum = Object.values(data.stats.bySection).reduce((a, b) => a + b, 0);
    expect(sectionSum).toBe(data.stats.total);
  });

  test('all tasks array contains all tasks', () => {
    expect(data.all.length).toBe(8);
  });

  test('tasks have correct isDone flag', () => {
    const taskFive = data.all.find(t => t.name === 'Task Five');
    const taskSix = data.all.find(t => t.name === 'Task Six');
    const taskEight = data.all.find(t => t.name === 'Task Eight');
    const taskOne = data.all.find(t => t.name === 'Task One');

    expect(taskFive.isDone).toBe(true);
    expect(taskSix.isDone).toBe(true);
    expect(taskEight.isDone).toBe(true);
    expect(taskOne.isDone).toBe(false);
  });

  test('tasks have correct isOverdue flag', () => {
    const taskTwo = data.all.find(t => t.name === 'Task Two');
    const taskFive = data.all.find(t => t.name === 'Task Five');
    const taskOne = data.all.find(t => t.name === 'Task One');

    expect(taskTwo.isOverdue).toBe(true); // Due 2026-01-05, today is 2026-01-15
    expect(taskFive.isOverdue).toBe(false); // In Done section
    expect(taskOne.isOverdue).toBe(true); // Due 2026-01-10, today is 2026-01-15
  });
});

