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

/**
 * Configuration schema - maps config keys to nested paths and types.
 * Adding new config options only requires adding a line here.
 */
const CONFIG_SCHEMA = {
  // Core settings (string values)
  PROJECT_NAME: { path: "projectName", type: "string" },
  CUSTOMER_NAME: { path: "customerName", type: "string" },
  SITE_BASE: { path: "siteBase", type: "string" },

  // Tab visibility (boolean values)
  SHOW_DASHBOARD: { path: "tabs.dashboard", type: "boolean" },
  SHOW_BOARD: { path: "tabs.board", type: "boolean" },
  SHOW_TASKS: { path: "tabs.tasks", type: "boolean" },
  SHOW_TIMELINE: { path: "tabs.timeline", type: "boolean" },

  // Tasks columns
  TASKS_COL_NAME: { path: "tasksColumns.name", type: "boolean" },
  TASKS_COL_PROGRESS: { path: "tasksColumns.progress", type: "boolean" },
  TASKS_COL_SECTION: { path: "tasksColumns.section", type: "boolean" },
  TASKS_COL_ASSIGNEE: { path: "tasksColumns.assignee", type: "boolean" },
  TASKS_COL_DUE: { path: "tasksColumns.due", type: "boolean" },
  TASKS_COL_PRIORITY: { path: "tasksColumns.priority", type: "boolean" },
  TASKS_COL_STATUS: { path: "tasksColumns.status", type: "boolean" },
  TASKS_COL_TAGS: { path: "tasksColumns.tags", type: "boolean" },
  TASKS_COL_PARENT: { path: "tasksColumns.parent", type: "boolean" },
  TASKS_COL_NOTES: { path: "tasksColumns.notes", type: "boolean" },
  TASKS_COL_CUSTOM: { path: "tasksColumns.custom", type: "boolean" },

  // Timeline columns
  TIMELINE_COL_NAME: { path: "timelineColumns.name", type: "boolean" },
  TIMELINE_COL_PROGRESS: { path: "timelineColumns.progress", type: "boolean" },
  TIMELINE_COL_SECTION: { path: "timelineColumns.section", type: "boolean" },
  TIMELINE_COL_START: { path: "timelineColumns.start", type: "boolean" },
  TIMELINE_COL_DUE: { path: "timelineColumns.due", type: "boolean" },
  TIMELINE_COL_DURATION: { path: "timelineColumns.duration", type: "boolean" },
  TIMELINE_COL_STATUS: { path: "timelineColumns.status", type: "boolean" },
  TIMELINE_COL_TAGS: { path: "timelineColumns.tags", type: "boolean" },
  TIMELINE_COL_PARENT: { path: "timelineColumns.parent", type: "boolean" },
  TIMELINE_COL_NOTES: { path: "timelineColumns.notes", type: "boolean" },
  TIMELINE_COL_CUSTOM: { path: "timelineColumns.custom", type: "boolean" },

  // Card items
  CARD_SHOW_PROGRESS: { path: "cardItems.progress", type: "boolean" },
  CARD_SHOW_ASSIGNEE: { path: "cardItems.assignee", type: "boolean" },
  CARD_SHOW_DUE: { path: "cardItems.due", type: "boolean" },
  CARD_SHOW_STATUS: { path: "cardItems.status", type: "boolean" },
  CARD_SHOW_PRIORITY: { path: "cardItems.priority", type: "boolean" },
  CARD_SHOW_TAGS: { path: "cardItems.tags", type: "boolean" },
  CARD_SHOW_PARENT: { path: "cardItems.parent", type: "boolean" },
  CARD_SHOW_NOTES: { path: "cardItems.notes", type: "boolean" },
  CARD_SHOW_CUSTOM: { path: "cardItems.custom", type: "boolean" },
};

/**
 * Set a nested property value using dot notation path.
 * Example: setNestedValue(obj, 'tabs.dashboard', false)
 */
function setNestedValue(obj, pathStr, value) {
  const parts = pathStr.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
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

      // Look up key in schema
      const schema = CONFIG_SCHEMA[key];
      if (schema) {
        const parsedValue =
          schema.type === "boolean" ? parseYesNo(value) : value;
        setNestedValue(config, schema.path, parsedValue);
      }
    });
  } catch (_e) {
    console.warn("dashana.config not found, using defaults");
  }

  return config;
};

// Export for testing
module.exports.parseYesNo = parseYesNo;
module.exports.CONFIG_SCHEMA = CONFIG_SCHEMA;
module.exports.setNestedValue = setNestedValue;
