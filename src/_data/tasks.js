const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Standard Asana CSV fields - anything else is a custom field
const KNOWN_FIELDS = [
  "Task ID",
  "Name",
  "Section/Column",
  "Assignee",
  "Assignee Email",
  "Start Date",
  "Due Date",
  "Priority",
  "Status",
  "Notes",
  "Created At",
  "Completed At",
  "Last Modified",
  "Tags",
  "Projects",
  "Parent task",
  "Blocked By (Dependencies)",
  "Blocking (Dependencies)",
];

module.exports = function () {
  const csvPath = path.join(__dirname, "../../data/project.csv");

  try {
    const content = fs.readFileSync(csvPath, "utf-8");
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });

    return processRecords(records);
  } catch (e) {
    console.warn("data/project.csv not found:", e.message);
    return {
      all: [],
      sections: {},
      sectionNames: [],
      stats: {},
      timeline: [],
      projectRange: { start: null, end: null, days: 0 },
      customFieldNames: [],
    };
  }
};

function processRecords(records, today = null) {
  if (!today) {
    today = new Date();
  }
  today.setHours(0, 0, 0, 0);

  // Collect all custom field names (columns not in KNOWN_FIELDS)
  const customFieldNames =
    records.length > 0
      ? [
          ...new Set(
            records.flatMap((r) =>
              Object.keys(r).filter((k) => !KNOWN_FIELDS.includes(k)),
            ),
          ),
        ]
      : [];

  // Build a map of task names to their sections (for subtask inheritance)
  const taskSectionMap = {};
  records.forEach((record) => {
    if (record.Name && record["Section/Column"]) {
      taskSectionMap[record.Name] = record["Section/Column"];
    }
  });

  // Extract unique section names in order of first appearance
  // Subtasks inherit parent's section, skip "Uncategorized" if it only contains subtasks
  const sectionNamesSet = new Set();
  records.forEach((record) => {
    let section = record["Section/Column"];
    // If no section but has parent task, inherit parent's section
    if (!section && record["Parent task"]) {
      section = taskSectionMap[record["Parent task"]] || "Uncategorized";
    } else if (!section) {
      section = "Uncategorized";
    }
    sectionNamesSet.add(section);
  });
  const sectionNames = Array.from(sectionNamesSet);

  // Create section order map based on appearance order
  const sectionOrderMap = {};
  sectionNames.forEach((name, index) => {
    sectionOrderMap[name] = index + 1;
  });

  const tasks = records.map((record) => {
    // Subtasks inherit parent's section if they don't have one
    let section = record["Section/Column"];
    if (!section && record["Parent task"]) {
      section = taskSectionMap[record["Parent task"]] || "Uncategorized";
    } else if (!section) {
      section = "Uncategorized";
    }

    // Extract custom field values for this record
    const customFields =
      customFieldNames.length > 0
        ? Object.fromEntries(
            customFieldNames.map((name) => [name, record[name] || null]),
          )
        : null;

    return {
      id: record["Task ID"],
      name: record.Name,
      section: section,
      assignee: record.Assignee || "Unassigned",
      assigneeEmail: record["Assignee Email"] || "",
      startDate: record["Start Date"] || null,
      dueDate: record["Due Date"] || null,
      priority: record.Priority || null,
      status: record.Status || null,
      notes: record.Notes || "",
      tags: record.Tags
        ? record.Tags.split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      parentTask: record["Parent task"] || null,
      isSubtask: !!record["Parent task"],
      customFields: customFields,
      // Computed
      isOverdue: isOverdue(record["Due Date"], section, today),
      isDone: isDoneSection(section),
      daysUntilDue: daysUntil(record["Due Date"], today),
      priorityOrder: priorityOrder(record.Priority),
      sectionOrder: sectionOrderMap[section] || 999,
    };
  });

  // Sort by section order, then priority, with subtasks grouped after their parent
  // First, build a map of parent task names to their index for grouping
  const parentTasks = tasks.filter((t) => !t.isSubtask);
  const subtasksByParent = {};
  tasks.forEach((t) => {
    if (t.isSubtask && t.parentTask) {
      if (!subtasksByParent[t.parentTask]) {
        subtasksByParent[t.parentTask] = [];
      }
      subtasksByParent[t.parentTask].push(t);
    }
  });

  // Sort parent tasks by section order, then priority
  parentTasks.sort((a, b) => {
    if (a.sectionOrder !== b.sectionOrder)
      return a.sectionOrder - b.sectionOrder;
    return a.priorityOrder - b.priorityOrder;
  });

  // Rebuild tasks array with subtasks immediately after their parent
  const sortedTasks = [];
  parentTasks.forEach((parent) => {
    sortedTasks.push(parent);
    const subtasks = subtasksByParent[parent.name] || [];
    subtasks.forEach((subtask) => sortedTasks.push(subtask));
  });

  // Replace tasks array with sorted version
  tasks.length = 0;
  sortedTasks.forEach((t) => tasks.push(t));

  // Group by section dynamically
  const sections = {};
  sectionNames.forEach((name) => {
    sections[name] = tasks.filter((t) => t.section === name);
  });

  // For each section, mark subtasks that have their parent in the same section
  // and add subtasks array to parent tasks for easy template rendering
  Object.keys(sections).forEach((sectionName) => {
    const sectionTasks = sections[sectionName];
    const taskNamesInSection = new Set(sectionTasks.map((t) => t.name));

    sectionTasks.forEach((task) => {
      // Check if this is a subtask with parent in same section
      task.parentInSameSection =
        task.isSubtask &&
        task.parentTask &&
        taskNamesInSection.has(task.parentTask);

      // For parent tasks, collect their subtasks that are in same section
      if (!task.isSubtask) {
        task.subtasksInSection = sectionTasks.filter(
          (t) => t.parentTask === task.name,
        );
        task.hasSubtasksInSection = task.subtasksInSection.length > 0;
      }
    });
  });

  // Calculate stats
  const stats = calculateStats(tasks, sections, sectionNames);

  // Calculate project date range for timeline
  const tasksWithDates = tasks.filter((t) => t.startDate || t.dueDate);
  let projectStart = null;
  let projectEnd = null;

  tasksWithDates.forEach((t) => {
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.dueDate ? new Date(t.dueDate) : null;

    if (start && (!projectStart || start < projectStart)) projectStart = start;
    if (end && (!projectEnd || end > projectEnd)) projectEnd = end;
    // Also consider start dates for project end if no due date
    if (start && (!projectEnd || start > projectEnd)) projectEnd = start;
  });

  const projectSpan =
    projectStart && projectEnd
      ? Math.max(
          1,
          Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24)) + 1,
        )
      : 30; // default 30 days

  // Add timeline position to each task
  tasks.forEach((task) => {
    if (task.startDate || task.dueDate) {
      const start = task.startDate
        ? new Date(task.startDate)
        : new Date(task.dueDate);
      const end = task.dueDate ? new Date(task.dueDate) : start;

      const startOffset = projectStart
        ? Math.ceil((start - projectStart) / (1000 * 60 * 60 * 24))
        : 0;
      const duration = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
      );

      const startPercent = Math.max(
        0,
        Math.min(100, (startOffset / projectSpan) * 100),
      );
      const rawWidth = (duration / projectSpan) * 100;
      const widthPercent = Math.max(1, Math.min(rawWidth, 100 - startPercent));

      task.timeline = {
        startPercent,
        widthPercent,
      };
    } else {
      task.timeline = null;
    }
  });

  // Sort for timeline view - keep subtasks with their parent
  // First, sort parent tasks by section and date
  const timelineParents = tasks.filter((t) => !t.isSubtask);
  timelineParents.sort((a, b) => {
    if (a.sectionOrder !== b.sectionOrder) {
      return a.sectionOrder - b.sectionOrder;
    }
    const aDate = a.startDate || a.dueDate;
    const bDate = b.startDate || b.dueDate;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return new Date(aDate) - new Date(bDate);
  });

  // Rebuild timeline with subtasks after their parent
  const timelineTasks = [];
  timelineParents.forEach((parent) => {
    timelineTasks.push(parent);
    const subtasks = subtasksByParent[parent.name] || [];
    subtasks.forEach((subtask) => timelineTasks.push(subtask));
  });

  return {
    all: tasks,
    sections,
    sectionNames,
    stats,
    timeline: timelineTasks,
    projectRange: {
      start: projectStart ? projectStart.toISOString().split("T")[0] : null,
      end: projectEnd ? projectEnd.toISOString().split("T")[0] : null,
      days: projectSpan,
    },
    customFieldNames,
  };
}

// Check if a section represents "done" tasks
function isDoneSection(section) {
  if (!section) return false;
  const lower = section.toLowerCase();
  const donePatterns = [
    "done",
    "complete",
    "completed",
    "finished",
    "closed",
    "resolved",
  ];
  return donePatterns.some((pattern) => lower.includes(pattern));
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
  const order = { High: 1, Medium: 2, Low: 3 };
  return order[priority] || 4;
}

function calculateStats(tasks, sections, sectionNames) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  const overdue = tasks.filter((t) => t.isOverdue).length;

  // By status - dynamically collect all statuses (including "No status")
  const byStatus = {};
  let noStatusCount = 0;
  tasks.forEach((t) => {
    if (t.status) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    } else {
      noStatusCount++;
    }
  });
  if (noStatusCount > 0) {
    byStatus["No status"] = noStatusCount;
  }

  // By priority - dynamically collect all priorities (including "No priority")
  const byPriority = {};
  let noPriorityCount = 0;
  tasks.forEach((t) => {
    if (t.priority) {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    } else {
      noPriorityCount++;
    }
  });
  if (noPriorityCount > 0) {
    byPriority["No priority"] = noPriorityCount;
  }

  // By assignee
  const byAssignee = {};
  tasks.forEach((t) => {
    byAssignee[t.assignee] = (byAssignee[t.assignee] || 0) + 1;
  });

  // By section
  const bySection = {};
  sectionNames.forEach((name) => {
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
    bySection,
  };
}

// Export helper functions for testing
module.exports.isDoneSection = isDoneSection;
module.exports.isOverdue = isOverdue;
module.exports.priorityOrder = priorityOrder;
module.exports.processRecords = processRecords;
module.exports.calculateStats = calculateStats;
