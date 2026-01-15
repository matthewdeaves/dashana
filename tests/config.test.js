const fs = require("fs");
const path = require("path");

// Import the functions for unit testing
const {
  parseYesNo,
  parseNumber,
  CONFIG_SCHEMA,
  setNestedValue,
} = require("../src/_data/config.js");

describe("parseYesNo", () => {
  test('returns true for "YES"', () => {
    expect(parseYesNo("YES")).toBe(true);
  });

  test('returns true for "yes" (case-insensitive)', () => {
    expect(parseYesNo("yes")).toBe(true);
  });

  test('returns true for "Yes" (mixed case)', () => {
    expect(parseYesNo("Yes")).toBe(true);
  });

  test('returns true for "Y"', () => {
    expect(parseYesNo("Y")).toBe(true);
  });

  test('returns true for "y"', () => {
    expect(parseYesNo("y")).toBe(true);
  });

  test('returns true for "TRUE"', () => {
    expect(parseYesNo("TRUE")).toBe(true);
  });

  test('returns true for "true"', () => {
    expect(parseYesNo("true")).toBe(true);
  });

  test('returns true for "1"', () => {
    expect(parseYesNo("1")).toBe(true);
  });

  test('returns false for "NO"', () => {
    expect(parseYesNo("NO")).toBe(false);
  });

  test('returns false for "no"', () => {
    expect(parseYesNo("no")).toBe(false);
  });

  test('returns false for "FALSE"', () => {
    expect(parseYesNo("FALSE")).toBe(false);
  });

  test('returns false for "false"', () => {
    expect(parseYesNo("false")).toBe(false);
  });

  test('returns false for "0"', () => {
    expect(parseYesNo("0")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(parseYesNo("")).toBe(false);
  });

  test("returns false for random text", () => {
    expect(parseYesNo("maybe")).toBe(false);
    expect(parseYesNo("unknown")).toBe(false);
  });

  test("trims whitespace before parsing", () => {
    expect(parseYesNo("  YES  ")).toBe(true);
    expect(parseYesNo("  NO  ")).toBe(false);
  });
});

describe("parseNumber", () => {
  test("parses valid integer", () => {
    expect(parseNumber("100")).toBe(100);
  });

  test("parses zero", () => {
    expect(parseNumber("0")).toBe(0);
  });

  test("parses negative numbers", () => {
    expect(parseNumber("-50")).toBe(-50);
  });

  test("trims whitespace before parsing", () => {
    expect(parseNumber("  200  ")).toBe(200);
  });

  test("returns 0 for invalid input by default", () => {
    expect(parseNumber("abc")).toBe(0);
    expect(parseNumber("")).toBe(0);
  });

  test("returns custom default for invalid input", () => {
    expect(parseNumber("abc", 100)).toBe(100);
    expect(parseNumber("", 50)).toBe(50);
  });

  test("truncates decimal values to integer", () => {
    expect(parseNumber("100.5")).toBe(100);
    expect(parseNumber("99.9")).toBe(99);
  });
});

describe("Config Module", () => {
  // Use temp file for tests (never touch production config)
  const tempConfigPath = path.join(__dirname, "fixtures/temp-test.config");

  afterEach(() => {
    // Clear require cache to reload config module fresh
    delete require.cache[require.resolve("../src/_data/config.js")];
    // Clean up temp config
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    // Reset environment variable
    delete process.env.DASHANA_CONFIG_PATH;
  });

  test("returns default values when config file is missing", () => {
    // Silence expected "config not found" warning
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Point to non-existent file
    process.env.DASHANA_CONFIG_PATH = path.join(
      __dirname,
      "fixtures/nonexistent.config",
    );

    const configFn = require("../src/_data/config.js");
    const config = configFn();

    // Check default values
    expect(config.projectName).toBe("Project Report");
    expect(config.customerName).toBe("Customer");
    expect(config.siteBase).toBe("");

    // All tabs default to true
    expect(config.tabs.dashboard).toBe(true);
    expect(config.tabs.board).toBe(true);
    expect(config.tabs.tasks).toBe(true);
    expect(config.tabs.timeline).toBe(true);

    // All column options default to true
    expect(config.tasksColumns.name).toBe(true);
    expect(config.tasksColumns.notes).toBe(true);
    expect(config.timelineColumns.duration).toBe(true);
    expect(config.cardItems.tags).toBe(true);

    // Notes text columns default to true (shown by default)
    expect(config.tasksColumns.notesText).toBe(true);
    expect(config.tasksColumns.notesTextMode).toBe("preview");
    expect(config.timelineColumns.notesText).toBe(true);
    expect(config.timelineColumns.notesTextMode).toBe("preview");
    expect(config.notesTextPreviewLength).toBe(100);

    warnSpy.mockRestore();
  });

  test("parses tab visibility settings", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test Project
SHOW_BOARD=NO
SHOW_TIMELINE=NO
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.tabs.dashboard).toBe(true); // Default
    expect(config.tabs.board).toBe(false);
    expect(config.tabs.tasks).toBe(true); // Default
    expect(config.tabs.timeline).toBe(false);
  });

  test("parses tasks column settings", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test
TASKS_COL_NOTES=NO
TASKS_COL_TAGS=NO
TASKS_COL_CUSTOM=NO
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.tasksColumns.name).toBe(true); // Default
    expect(config.tasksColumns.notes).toBe(false);
    expect(config.tasksColumns.tags).toBe(false);
    expect(config.tasksColumns.custom).toBe(false);
  });

  test("parses timeline column settings", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test
TIMELINE_COL_START=NO
TIMELINE_COL_DURATION=NO
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.timelineColumns.name).toBe(true); // Default
    expect(config.timelineColumns.start).toBe(false);
    expect(config.timelineColumns.duration).toBe(false);
    expect(config.timelineColumns.due).toBe(true); // Default
  });

  test("parses card item settings", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test
CARD_SHOW_TAGS=NO
CARD_SHOW_NOTES=NO
CARD_SHOW_CUSTOM=NO
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.cardItems.progress).toBe(true); // Default
    expect(config.cardItems.tags).toBe(false);
    expect(config.cardItems.notes).toBe(false);
    expect(config.cardItems.custom).toBe(false);
  });

  test("parses notes text column settings", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test
TASKS_COL_NOTES_TEXT=YES
TASKS_NOTES_TEXT_MODE=full
TIMELINE_COL_NOTES_TEXT=YES
TIMELINE_NOTES_TEXT_MODE=preview
NOTES_TEXT_PREVIEW_LENGTH=150
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.tasksColumns.notesText).toBe(true);
    expect(config.tasksColumns.notesTextMode).toBe("full");
    expect(config.timelineColumns.notesText).toBe(true);
    expect(config.timelineColumns.notesTextMode).toBe("preview");
    expect(config.notesTextPreviewLength).toBe(150);
  });

  test("parses notes text preview length as number", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test
NOTES_TEXT_PREVIEW_LENGTH=200
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.notesTextPreviewLength).toBe(200);
    expect(typeof config.notesTextPreviewLength).toBe("number");
  });

  test("ignores comment lines starting with #", () => {
    fs.writeFileSync(
      tempConfigPath,
      `# This is a comment
PROJECT_NAME=Test Project
# Another comment
SHOW_BOARD=NO
`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe("Test Project");
    expect(config.tabs.board).toBe(false);
  });

  test("ignores empty lines", () => {
    fs.writeFileSync(
      tempConfigPath,
      `PROJECT_NAME=Test Project

CUSTOMER_NAME=Acme Corp

`,
    );
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe("Test Project");
    expect(config.customerName).toBe("Acme Corp");
  });

  test("handles values with equals signs", () => {
    fs.writeFileSync(tempConfigPath, `PROJECT_NAME=Test = Project\n`);
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe("Test = Project");
  });

  test("handles very long config values", () => {
    const longValue = "A".repeat(1000);
    fs.writeFileSync(tempConfigPath, `PROJECT_NAME=${longValue}\n`);
    process.env.DASHANA_CONFIG_PATH = tempConfigPath;

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe(longValue);
  });
});

describe("setNestedValue", () => {
  test("sets simple property", () => {
    const obj = { projectName: "old" };
    setNestedValue(obj, "projectName", "new");
    expect(obj.projectName).toBe("new");
  });

  test("sets nested property", () => {
    const obj = { tabs: { dashboard: true } };
    setNestedValue(obj, "tabs.dashboard", false);
    expect(obj.tabs.dashboard).toBe(false);
  });

  test("sets deeply nested property", () => {
    const obj = { a: { b: { c: 1 } } };
    setNestedValue(obj, "a.b.c", 2);
    expect(obj.a.b.c).toBe(2);
  });
});

describe("CONFIG_SCHEMA", () => {
  test("has all tab visibility options", () => {
    expect(CONFIG_SCHEMA.SHOW_DASHBOARD).toEqual({
      path: "tabs.dashboard",
      type: "boolean",
    });
    expect(CONFIG_SCHEMA.SHOW_BOARD).toEqual({
      path: "tabs.board",
      type: "boolean",
    });
    expect(CONFIG_SCHEMA.SHOW_TASKS).toEqual({
      path: "tabs.tasks",
      type: "boolean",
    });
    expect(CONFIG_SCHEMA.SHOW_TIMELINE).toEqual({
      path: "tabs.timeline",
      type: "boolean",
    });
  });

  test("has core settings as string type", () => {
    expect(CONFIG_SCHEMA.PROJECT_NAME.type).toBe("string");
    expect(CONFIG_SCHEMA.CUSTOMER_NAME.type).toBe("string");
    expect(CONFIG_SCHEMA.SITE_BASE.type).toBe("string");
  });

  test("has all tasks column options", () => {
    const tasksColKeys = Object.keys(CONFIG_SCHEMA).filter((k) =>
      k.startsWith("TASKS_COL_"),
    );
    expect(tasksColKeys.length).toBe(12); // name, progress, section, assignee, due, priority, status, tags, parent, notes, notesText, custom
  });

  test("has all timeline column options", () => {
    const timelineColKeys = Object.keys(CONFIG_SCHEMA).filter((k) =>
      k.startsWith("TIMELINE_COL_"),
    );
    expect(timelineColKeys.length).toBe(12); // +notesText
  });

  test("has notes text schema entries", () => {
    expect(CONFIG_SCHEMA.TASKS_COL_NOTES_TEXT).toEqual({
      path: "tasksColumns.notesText",
      type: "boolean",
    });
    expect(CONFIG_SCHEMA.TASKS_NOTES_TEXT_MODE).toEqual({
      path: "tasksColumns.notesTextMode",
      type: "string",
    });
    expect(CONFIG_SCHEMA.TIMELINE_COL_NOTES_TEXT).toEqual({
      path: "timelineColumns.notesText",
      type: "boolean",
    });
    expect(CONFIG_SCHEMA.TIMELINE_NOTES_TEXT_MODE).toEqual({
      path: "timelineColumns.notesTextMode",
      type: "string",
    });
    expect(CONFIG_SCHEMA.NOTES_TEXT_PREVIEW_LENGTH).toEqual({
      path: "notesTextPreviewLength",
      type: "number",
    });
  });

  test("has all card item options", () => {
    const cardKeys = Object.keys(CONFIG_SCHEMA).filter((k) =>
      k.startsWith("CARD_SHOW_"),
    );
    expect(cardKeys.length).toBe(9); // progress, assignee, due, status, priority, tags, parent, notes, custom
  });
});
