/**
 * Config Rendering Tests
 *
 * Tests that config YES/NO options correctly affect rendered HTML.
 * Uses a disabled config fixture to verify columns/tabs are hidden.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const cheerio = require("cheerio");

const FIXTURE_CSV = path.join(__dirname, "fixtures/test-project.csv");
const DISABLED_CONFIG = path.join(
  __dirname,
  "fixtures/test-config-disabled.config",
);
const SITE_DIR = path.join(__dirname, "../_site");

// Helper to load a page
function loadPage(pagePath) {
  const filePath = path.join(SITE_DIR, pagePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const html = fs.readFileSync(filePath, "utf-8");
  return cheerio.load(html);
}

// Build site using fixture data via environment variables (never touches production files)
beforeAll(() => {
  execSync("npm run build", {
    cwd: path.join(__dirname, ".."),
    stdio: "pipe",
    env: {
      ...process.env,
      DASHANA_CSV_PATH: FIXTURE_CSV,
      DASHANA_CONFIG_PATH: DISABLED_CONFIG,
    },
  });
});

/*
 * Test config: test-config-disabled.config
 * - SHOW_TIMELINE=NO
 * - TASKS_COL_PRIORITY=NO, TASKS_COL_TAGS=NO, TASKS_COL_PARENT=NO, TASKS_COL_NOTES=NO, TASKS_COL_CUSTOM=NO
 * - CARD_SHOW_PRIORITY=NO, CARD_SHOW_TAGS=NO, CARD_SHOW_PARENT=NO, CARD_SHOW_NOTES=NO, CARD_SHOW_CUSTOM=NO
 */

describe("Tab Visibility Config", () => {
  test("Timeline tab is hidden when SHOW_TIMELINE=NO", () => {
    const $ = loadPage("index.html");
    const navLinks = $(".nav-link")
      .map((_i, el) => $(el).text().trim())
      .get();

    expect(navLinks).toContain("Dashboard");
    expect(navLinks).toContain("Board");
    expect(navLinks).toContain("Tasks");
    expect(navLinks).not.toContain("Timeline");
  });

  test("Timeline page shows disabled message", () => {
    const $ = loadPage("timeline/index.html");
    expect($).not.toBeNull();

    const pageContent = $("body").text();
    expect(pageContent).toContain("disabled");
  });
});

describe("Tasks Table Column Config", () => {
  let $;
  let headers;

  beforeAll(() => {
    $ = loadPage("tasks/index.html");
    headers = $(".task-table th")
      .map((_i, el) => $(el).text().trim())
      .get();
  });

  // Disabled columns (=NO in config)
  test("Progress column is hidden when TASKS_COL_PROGRESS=NO", () => {
    expect(headers).not.toContain("Progress");
  });

  test("Assignee column is hidden when TASKS_COL_ASSIGNEE=NO", () => {
    expect(headers).not.toContain("Assignee");
  });

  test("Priority column is hidden when TASKS_COL_PRIORITY=NO", () => {
    expect(headers).not.toContain("Priority");
  });

  test("Tags column is hidden when TASKS_COL_TAGS=NO", () => {
    expect(headers).not.toContain("Tags");
  });

  test("Parent column is hidden when TASKS_COL_PARENT=NO", () => {
    expect(headers).not.toContain("Parent");
  });

  test("Notes column is hidden when TASKS_COL_NOTES=NO", () => {
    expect(headers).not.toContain("Notes");
  });

  test("Custom field columns are hidden when TASKS_COL_CUSTOM=NO", () => {
    // Our test fixture has Sprint and Story Points custom fields
    expect(headers).not.toContain("Sprint");
    expect(headers).not.toContain("Story Points");
  });

  // Enabled columns (=YES in config)
  test("Enabled columns still appear", () => {
    expect(headers).toContain("Name");
    expect(headers).toContain("Section");
    expect(headers).toContain("Due Date");
    expect(headers).toContain("Status");
  });
});

describe("Board Card Config", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("board/index.html");
  });

  // Disabled card items (=NO in config)
  test("Progress labels are hidden when CARD_SHOW_PROGRESS=NO", () => {
    const progressLabels = $(".completion-label").length;
    expect(progressLabels).toBe(0);
  });

  test("Assignees are hidden when CARD_SHOW_ASSIGNEE=NO", () => {
    const assignees = $(".task-assignee").length;
    expect(assignees).toBe(0);
  });

  test("Priority badges are hidden when CARD_SHOW_PRIORITY=NO", () => {
    const priorityBadges = $(".priority-badge").length;
    expect(priorityBadges).toBe(0);
  });

  test("Tags are hidden when CARD_SHOW_TAGS=NO", () => {
    const cardTags = $(".card-tags").length;
    expect(cardTags).toBe(0);
  });

  test("Parent references are hidden when CARD_SHOW_PARENT=NO", () => {
    const cardParents = $(".card-parent").length;
    expect(cardParents).toBe(0);
  });

  test("Notes icons are hidden when CARD_SHOW_NOTES=NO", () => {
    const notesIcons = $(".card-notes-icon").length;
    expect(notesIcons).toBe(0);
  });

  test("Custom fields are hidden when CARD_SHOW_CUSTOM=NO", () => {
    const customFields = $(".card-custom-fields").length;
    expect(customFields).toBe(0);
  });

  // Enabled card items (=YES in config)
  test("Enabled card items still appear", () => {
    // Due dates should still appear (CARD_SHOW_DUE=YES)
    const dueDates = $(".task-due").length;
    expect(dueDates).toBeGreaterThan(0);

    // Status badges should still appear (CARD_SHOW_STATUS=YES)
    const statusBadges = $(".task-status").length;
    expect(statusBadges).toBeGreaterThan(0);
  });
});

describe("Config Defaults", () => {
  test("Project name from config appears in page", () => {
    const $ = loadPage("index.html");
    const title = $("title").text();
    expect(title).toContain("Test Project Disabled");
  });
});
