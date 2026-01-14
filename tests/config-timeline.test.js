/**
 * Timeline Column Config Tests
 *
 * Tests that TIMELINE_COL_* options correctly show/hide columns.
 * Uses config-timeline-disabled.config fixture.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const cheerio = require("cheerio");

const FIXTURE_CSV = path.join(__dirname, "fixtures/test-project.csv");
const TEST_CONFIG = path.join(
  __dirname,
  "fixtures/config-timeline-disabled.config",
);
const PRODUCTION_CSV = path.join(__dirname, "../data/project.csv");
const PRODUCTION_CONFIG = path.join(__dirname, "../dashana.config");
const BACKUP_CSV = path.join(__dirname, "fixtures/timeline-test-backup.csv");
const BACKUP_CONFIG = path.join(
  __dirname,
  "fixtures/timeline-test-backup.config",
);
const SITE_DIR = path.join(__dirname, "../_site");

function loadPage(pagePath) {
  const filePath = path.join(SITE_DIR, pagePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const html = fs.readFileSync(filePath, "utf-8");
  return cheerio.load(html);
}

beforeAll(() => {
  if (fs.existsSync(PRODUCTION_CSV)) {
    fs.copyFileSync(PRODUCTION_CSV, BACKUP_CSV);
  }
  if (fs.existsSync(PRODUCTION_CONFIG)) {
    fs.copyFileSync(PRODUCTION_CONFIG, BACKUP_CONFIG);
  }

  fs.copyFileSync(FIXTURE_CSV, PRODUCTION_CSV);
  fs.copyFileSync(TEST_CONFIG, PRODUCTION_CONFIG);

  execSync("npm run build", { cwd: path.join(__dirname, ".."), stdio: "pipe" });
});

afterAll(() => {
  if (fs.existsSync(BACKUP_CSV)) {
    fs.copyFileSync(BACKUP_CSV, PRODUCTION_CSV);
    fs.unlinkSync(BACKUP_CSV);
  }
  if (fs.existsSync(BACKUP_CONFIG)) {
    fs.copyFileSync(BACKUP_CONFIG, PRODUCTION_CONFIG);
    fs.unlinkSync(BACKUP_CONFIG);
  }
  if (fs.existsSync(PRODUCTION_CSV)) {
    execSync("npm run build", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
  }
});

/*
 * Test config: config-timeline-disabled.config
 * Timeline columns disabled:
 * - TIMELINE_COL_PROGRESS=NO
 * - TIMELINE_COL_SECTION=NO
 * - TIMELINE_COL_START=NO
 * - TIMELINE_COL_DUE=NO
 * - TIMELINE_COL_DURATION=NO
 * - TIMELINE_COL_STATUS=NO
 * - TIMELINE_COL_TAGS=NO
 * - TIMELINE_COL_PARENT=NO
 * - TIMELINE_COL_NOTES=NO
 * - TIMELINE_COL_CUSTOM=NO
 *
 * Only TIMELINE_COL_NAME=YES is enabled
 */

describe("Timeline Column Config", () => {
  let $;
  let headers;

  beforeAll(() => {
    $ = loadPage("timeline/index.html");
    headers = $(".timeline-table th")
      .map((_i, el) => $(el).text().trim())
      .get();
  });

  // Disabled columns (=NO in config)
  test("Progress column is hidden when TIMELINE_COL_PROGRESS=NO", () => {
    expect(headers).not.toContain("Progress");
  });

  test("Section column is hidden when TIMELINE_COL_SECTION=NO", () => {
    expect(headers).not.toContain("Section");
  });

  test("Start column is hidden when TIMELINE_COL_START=NO", () => {
    expect(headers).not.toContain("Start");
  });

  test("Due column is hidden when TIMELINE_COL_DUE=NO", () => {
    expect(headers).not.toContain("Due");
  });

  test("Duration column is hidden when TIMELINE_COL_DURATION=NO", () => {
    expect(headers).not.toContain("Duration");
    // Also verify no duration bars
    const durationBars = $(".duration-bar-container").length;
    expect(durationBars).toBe(0);
  });

  test("Status column is hidden when TIMELINE_COL_STATUS=NO", () => {
    expect(headers).not.toContain("Status");
  });

  test("Tags column is hidden when TIMELINE_COL_TAGS=NO", () => {
    expect(headers).not.toContain("Tags");
    // Also verify no tag badges in timeline
    const tagBadges = $(".timeline-table .tag-badge").length;
    expect(tagBadges).toBe(0);
  });

  test("Parent column is hidden when TIMELINE_COL_PARENT=NO", () => {
    expect(headers).not.toContain("Parent");
  });

  test("Notes column is hidden when TIMELINE_COL_NOTES=NO", () => {
    expect(headers).not.toContain("Notes");
  });

  test("Custom field columns are hidden when TIMELINE_COL_CUSTOM=NO", () => {
    // Test fixture has Sprint and Story Points custom fields
    expect(headers).not.toContain("Sprint");
    expect(headers).not.toContain("Story Points");
  });

  // Enabled column (=YES in config)
  test("Name column still appears when TIMELINE_COL_NAME=YES", () => {
    expect(headers).toContain("Task");
  });

  test("Timeline table renders with only name column", () => {
    // Should have task names
    const taskNames = $(".timeline-table td")
      .map((_i, el) => $(el).text().trim())
      .get();
    expect(taskNames.length).toBeGreaterThan(0);
  });
});

describe("Timeline Tab Visibility", () => {
  test("Timeline tab is visible when SHOW_TIMELINE=YES", () => {
    const $ = loadPage("index.html");
    const navLinks = $(".nav-link")
      .map((_i, el) => $(el).text().trim())
      .get();

    expect(navLinks).toContain("Timeline");
  });

  test("Timeline page renders content (not disabled message)", () => {
    const $ = loadPage("timeline/index.html");
    const pageContent = $("body").text();

    // Should have timeline table, not disabled message
    expect($(".timeline-table").length).toBe(1);
    expect(pageContent).not.toContain("This view has been disabled");
  });
});
