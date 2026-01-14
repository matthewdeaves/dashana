const fs = require("fs");
const path = require("path");

/**
 * Parse YES/NO value to boolean (case-insensitive).
 * Accepts: YES, Y, TRUE, 1 as truthy values.
 */
function parseYesNo(value) {
  const v = value.trim().toUpperCase();
  return v === "YES" || v === "Y" || v === "TRUE" || v === "1";
}

module.exports = function () {
  const configPath = path.join(__dirname, "../../dashana.config");

  // Default config - everything shown
  const config = {
    projectName: "Project Report",
    customerName: "Customer",
    siteBase: "",

    // Tab visibility (all shown by default)
    tabs: {
      dashboard: true,
      board: true,
      tasks: true,
      timeline: true,
    },

    // Tasks table columns (all shown by default)
    tasksColumns: {
      name: true,
      progress: true,
      section: true,
      assignee: true,
      due: true,
      priority: true,
      status: true,
      tags: true,
      parent: true,
      notes: true,
      custom: true,
    },

    // Timeline table columns (all shown by default)
    timelineColumns: {
      name: true,
      progress: true,
      section: true,
      start: true,
      due: true,
      duration: true,
      status: true,
      tags: true,
      parent: true,
      notes: true,
      custom: true,
    },

    // Board card items (all shown by default)
    cardItems: {
      progress: true,
      assignee: true,
      due: true,
      status: true,
      priority: true,
      tags: true,
      parent: true,
      notes: true,
      custom: true,
    },
  };

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    content.split("\n").forEach((line) => {
      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) return;

      const key = line.substring(0, eqIndex).trim();
      const value = line.substring(eqIndex + 1).trim();

      // Core settings
      if (key === "PROJECT_NAME") config.projectName = value;
      if (key === "CUSTOMER_NAME") config.customerName = value;
      if (key === "SITE_BASE") config.siteBase = value;

      // Tab visibility
      if (key === "SHOW_DASHBOARD") config.tabs.dashboard = parseYesNo(value);
      if (key === "SHOW_BOARD") config.tabs.board = parseYesNo(value);
      if (key === "SHOW_TASKS") config.tabs.tasks = parseYesNo(value);
      if (key === "SHOW_TIMELINE") config.tabs.timeline = parseYesNo(value);

      // Tasks columns
      if (key === "TASKS_COL_NAME")
        config.tasksColumns.name = parseYesNo(value);
      if (key === "TASKS_COL_PROGRESS")
        config.tasksColumns.progress = parseYesNo(value);
      if (key === "TASKS_COL_SECTION")
        config.tasksColumns.section = parseYesNo(value);
      if (key === "TASKS_COL_ASSIGNEE")
        config.tasksColumns.assignee = parseYesNo(value);
      if (key === "TASKS_COL_DUE") config.tasksColumns.due = parseYesNo(value);
      if (key === "TASKS_COL_PRIORITY")
        config.tasksColumns.priority = parseYesNo(value);
      if (key === "TASKS_COL_STATUS")
        config.tasksColumns.status = parseYesNo(value);
      if (key === "TASKS_COL_TAGS")
        config.tasksColumns.tags = parseYesNo(value);
      if (key === "TASKS_COL_PARENT")
        config.tasksColumns.parent = parseYesNo(value);
      if (key === "TASKS_COL_NOTES")
        config.tasksColumns.notes = parseYesNo(value);
      if (key === "TASKS_COL_CUSTOM")
        config.tasksColumns.custom = parseYesNo(value);

      // Timeline columns
      if (key === "TIMELINE_COL_NAME")
        config.timelineColumns.name = parseYesNo(value);
      if (key === "TIMELINE_COL_PROGRESS")
        config.timelineColumns.progress = parseYesNo(value);
      if (key === "TIMELINE_COL_SECTION")
        config.timelineColumns.section = parseYesNo(value);
      if (key === "TIMELINE_COL_START")
        config.timelineColumns.start = parseYesNo(value);
      if (key === "TIMELINE_COL_DUE")
        config.timelineColumns.due = parseYesNo(value);
      if (key === "TIMELINE_COL_DURATION")
        config.timelineColumns.duration = parseYesNo(value);
      if (key === "TIMELINE_COL_STATUS")
        config.timelineColumns.status = parseYesNo(value);
      if (key === "TIMELINE_COL_TAGS")
        config.timelineColumns.tags = parseYesNo(value);
      if (key === "TIMELINE_COL_PARENT")
        config.timelineColumns.parent = parseYesNo(value);
      if (key === "TIMELINE_COL_NOTES")
        config.timelineColumns.notes = parseYesNo(value);
      if (key === "TIMELINE_COL_CUSTOM")
        config.timelineColumns.custom = parseYesNo(value);

      // Card items
      if (key === "CARD_SHOW_PROGRESS")
        config.cardItems.progress = parseYesNo(value);
      if (key === "CARD_SHOW_ASSIGNEE")
        config.cardItems.assignee = parseYesNo(value);
      if (key === "CARD_SHOW_DUE") config.cardItems.due = parseYesNo(value);
      if (key === "CARD_SHOW_STATUS")
        config.cardItems.status = parseYesNo(value);
      if (key === "CARD_SHOW_PRIORITY")
        config.cardItems.priority = parseYesNo(value);
      if (key === "CARD_SHOW_TAGS") config.cardItems.tags = parseYesNo(value);
      if (key === "CARD_SHOW_PARENT")
        config.cardItems.parent = parseYesNo(value);
      if (key === "CARD_SHOW_NOTES") config.cardItems.notes = parseYesNo(value);
      if (key === "CARD_SHOW_CUSTOM")
        config.cardItems.custom = parseYesNo(value);
    });
  } catch (_e) {
    console.warn("dashana.config not found, using defaults");
  }

  return config;
};

// Export parseYesNo for testing
module.exports.parseYesNo = parseYesNo;
