const fs = require("fs");
const path = require("path");

// Import the parseYesNo function for unit testing
const { parseYesNo } = require("../src/_data/config.js");

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

describe("Config Module", () => {
  const configPath = path.join(__dirname, "../dashana.config");
  let originalConfig;

  beforeAll(() => {
    // Save original config
    try {
      originalConfig = fs.readFileSync(configPath, "utf-8");
    } catch (_e) {
      originalConfig = null;
    }
  });

  afterAll(() => {
    // Restore original config
    if (originalConfig !== null) {
      fs.writeFileSync(configPath, originalConfig);
    }
  });

  afterEach(() => {
    // Clear require cache to reload config module fresh
    delete require.cache[require.resolve("../src/_data/config.js")];
  });

  test("returns default values when config file is missing", () => {
    // Temporarily rename config file
    if (fs.existsSync(configPath)) {
      fs.renameSync(configPath, `${configPath}.bak`);
    }

    try {
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
    } finally {
      // Restore config file
      if (fs.existsSync(`${configPath}.bak`)) {
        fs.renameSync(`${configPath}.bak`, configPath);
      }
    }
  });

  test("parses tab visibility settings", () => {
    fs.writeFileSync(
      configPath,
      `PROJECT_NAME=Test Project
SHOW_BOARD=NO
SHOW_TIMELINE=NO
`,
    );

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
      configPath,
      `PROJECT_NAME=Test
TASKS_COL_NOTES=NO
TASKS_COL_TAGS=NO
TASKS_COL_CUSTOM=NO
`,
    );

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
      configPath,
      `PROJECT_NAME=Test
TIMELINE_COL_START=NO
TIMELINE_COL_DURATION=NO
`,
    );

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
      configPath,
      `PROJECT_NAME=Test
CARD_SHOW_TAGS=NO
CARD_SHOW_NOTES=NO
CARD_SHOW_CUSTOM=NO
`,
    );

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.cardItems.progress).toBe(true); // Default
    expect(config.cardItems.tags).toBe(false);
    expect(config.cardItems.notes).toBe(false);
    expect(config.cardItems.custom).toBe(false);
  });

  test("ignores comment lines starting with #", () => {
    fs.writeFileSync(
      configPath,
      `# This is a comment
PROJECT_NAME=Test Project
# Another comment
SHOW_BOARD=NO
`,
    );

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe("Test Project");
    expect(config.tabs.board).toBe(false);
  });

  test("ignores empty lines", () => {
    fs.writeFileSync(
      configPath,
      `PROJECT_NAME=Test Project

CUSTOMER_NAME=Acme Corp

`,
    );

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe("Test Project");
    expect(config.customerName).toBe("Acme Corp");
  });

  test("handles values with equals signs", () => {
    fs.writeFileSync(configPath, `PROJECT_NAME=Test = Project\n`);

    delete require.cache[require.resolve("../src/_data/config.js")];
    const configFn = require("../src/_data/config.js");
    const config = configFn();

    expect(config.projectName).toBe("Test = Project");
  });
});
