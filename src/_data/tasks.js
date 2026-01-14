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

// CSV validation constants
const REQUIRED_FIELDS = ["Name"];
const RECOMMENDED_FIELDS = ["Section/Column", "Assignee", "Due Date"];

/**
 * Validate CSV records and log warnings for missing/invalid data.
 * Returns array of warnings (non-blocking).
 */
function validateRecords(records) {
  const warnings = [];

  records.forEach((record, index) => {
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!record[field]?.trim()) {
        warnings.push(`Row ${index + 2}: Missing required field "${field}"`);
      }
    }
  });

  // Check if recommended fields exist in header
  if (records.length > 0) {
    const fields = Object.keys(records[0]);
    for (const field of RECOMMENDED_FIELDS) {
      if (!fields.includes(field)) {
        warnings.push(`CSV missing recommended column "${field}"`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn("CSV validation warnings:");
    warnings.slice(0, 10).forEach((w) => console.warn(`  ${w}`));
    if (warnings.length > 10) {
      console.warn(`  ... and ${warnings.length - 10} more warnings`);
    }
  }

  return warnings;
}

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
    console.warn("CSV load error:", e.message);
    return {
      all: [],
      sections: {},
      sectionNames: [],
      stats: {
        total: 0,
        done: 0,
        open: 0,
        overdue: 0,
        completionPercent: 0,
        bySection: {},
        byStatus: {},
        byPriority: {},
        byAssignee: {},
      },
      timeline: [],
      projectRange: { start: null, end: null, days: 0 },
      customFieldNames: [],
      error: {
        message: e.message,
        type: e.code === "ENOENT" ? "CSV_NOT_FOUND" : "CSV_PARSE_ERROR",
        hint:
          e.code === "ENOENT"
            ? "Ensure data/project.csv exists"
            : "Check CSV format matches Asana export",
      },
    };
  }
};

function processRecords(records, today = null) {
  if (!today) {
    today = new Date();
  }
  today.setHours(0, 0, 0, 0);

  // Validate records and log warnings (non-blocking)
  validateRecords(records);

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
  // First occurrence wins - warn about duplicates that may cause incorrect inheritance
  const taskSectionMap = {};
  const duplicateNames = new Set();
  records.forEach((record) => {
    if (record.Name && record["Section/Column"]) {
      if (taskSectionMap[record.Name] !== undefined) {
        duplicateNames.add(record.Name);
      } else {
        taskSectionMap[record.Name] = record["Section/Column"];
      }
    }
  });

  if (duplicateNames.size > 0) {
    const names = Array.from(duplicateNames).slice(0, 5).join(", ");
    const more =
      duplicateNames.size > 5 ? ` (and ${duplicateNames.size - 5} more)` : "";
    console.warn(
      `CSV contains ${duplicateNames.size} duplicate task name(s). Subtask section inheritance may be incorrect for: ${names}${more}`,
    );
  }

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
      isDone: isDoneSection(section) || !!record["Completed At"],
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

  // Group by section dynamically - O(n) using single pass
  const sections = {};
  sectionNames.forEach((name) => {
    sections[name] = [];
  });
  tasks.forEach((t) => {
    if (sections[t.section]) {
      sections[t.section].push(t);
    }
  });

  // Build lookup maps for O(1) access - avoids O(n²) filtering
  // Map: section -> Set of task names in that section
  const taskNamesBySection = {};
  // Map: section -> parentName -> subtasks array
  const subtasksByParentInSection = {};

  sectionNames.forEach((name) => {
    taskNamesBySection[name] = new Set();
    subtasksByParentInSection[name] = {};
  });

  // Single pass to build all lookup data - O(n)
  tasks.forEach((task) => {
    const section = task.section;
    if (taskNamesBySection[section]) {
      taskNamesBySection[section].add(task.name);
    }
    if (
      task.isSubtask &&
      task.parentTask &&
      subtasksByParentInSection[section]
    ) {
      if (!subtasksByParentInSection[section][task.parentTask]) {
        subtasksByParentInSection[section][task.parentTask] = [];
      }
      subtasksByParentInSection[section][task.parentTask].push(task);
    }
  });

  // Mark subtasks and parent relationships - O(n) with O(1) lookups
  tasks.forEach((task) => {
    const section = task.section;
    // Check if this is a subtask with parent in same section
    task.parentInSameSection =
      task.isSubtask &&
      task.parentTask &&
      taskNamesBySection[section]?.has(task.parentTask);

    // For parent tasks, collect their subtasks that are in same section
    if (!task.isSubtask) {
      task.subtasksInSection =
        subtasksByParentInSection[section]?.[task.name] || [];
      task.hasSubtasksInSection = task.subtasksInSection.length > 0;
    }
  });

  // Calculate stats
  const stats = calculateStats(tasks, sections, sectionNames);

  // Calculate project date range for timeline
  // Helper to validate date objects (invalid dates have NaN time value)
  const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

  const tasksWithDates = tasks.filter((t) => t.startDate || t.dueDate);
  let projectStart = null;
  let projectEnd = null;

  tasksWithDates.forEach((t) => {
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.dueDate ? new Date(t.dueDate) : null;

    // Only use valid dates for range calculation
    if (isValidDate(start) && (!projectStart || start < projectStart))
      projectStart = start;
    if (isValidDate(end) && (!projectEnd || end > projectEnd)) projectEnd = end;
    // Also consider start dates for project end if no due date
    if (isValidDate(start) && (!projectEnd || start > projectEnd))
      projectEnd = start;
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

    // Calculate duration info for timeline display
    task.duration = calculateDuration(task.startDate, task.dueDate, today);
  });

  // Sort for timeline view - pure chronological order by date
  const timelineTasks = [...tasks].sort((a, b) => {
    const aDate = a.startDate || a.dueDate;
    const bDate = b.startDate || b.dueDate;
    // Tasks without dates go to the end
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return new Date(aDate) - new Date(bDate);
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

/**
 * Normalize a date to UTC midnight for consistent comparisons.
 * Avoids timezone-dependent behavior in overdue calculations.
 */
function normalizeToUTC(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Calculate duration info for a task.
 * Days calculation: inclusive of start, exclusive of end (e.g., Jan 1-5 = 4 days).
 */
function calculateDuration(startDate, dueDate, today) {
  const start = startDate ? new Date(startDate) : null;
  const end = dueDate ? new Date(dueDate) : null;

  // No dates = no duration
  if (!start && !end) {
    return null;
  }

  // Use start for both if only start, or due for both if only due
  const effectiveStart = start || end;
  const effectiveEnd = end || start;

  // Duration in days (exclusive of end)
  const durationDays = Math.max(
    1,
    Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)),
  );

  // Days elapsed from start to today (capped at duration)
  const elapsedMs = today - effectiveStart;
  const elapsedDays = Math.max(
    0,
    Math.min(durationDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24))),
  );

  // Percentage elapsed (capped at 100)
  const percentElapsed = Math.min(
    100,
    Math.round((elapsedDays / durationDays) * 100),
  );

  return {
    days: durationDays,
    elapsed: elapsedDays,
    remaining: Math.max(0, durationDays - elapsedDays),
    percentElapsed: percentElapsed,
    hasStarted: elapsedMs >= 0,
    isComplete: elapsedDays >= durationDays,
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
  const dueDateUTC = normalizeToUTC(new Date(dueDate));
  const todayUTC = normalizeToUTC(today);
  return dueDateUTC < todayUTC;
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
module.exports.normalizeToUTC = normalizeToUTC;
module.exports.validateRecords = validateRecords;
module.exports.isDoneSection = isDoneSection;
module.exports.isOverdue = isOverdue;
module.exports.priorityOrder = priorityOrder;
module.exports.processRecords = processRecords;
module.exports.calculateStats = calculateStats;
module.exports.calculateDuration = calculateDuration;
