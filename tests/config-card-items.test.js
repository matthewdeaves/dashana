/**
 * Card Items Config Tests
 *
 * Tests CARD_SHOW_DUE=NO and CARD_SHOW_STATUS=NO
 * Uses config-card-items.config fixture.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const cheerio = require("cheerio");

const FIXTURE_CSV = path.join(__dirname, "fixtures/test-project.csv");
const TEST_CONFIG = path.join(__dirname, "fixtures/config-card-items.config");
const SITE_DIR = path.join(__dirname, "../_site");

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
      DASHANA_CONFIG_PATH: TEST_CONFIG,
    },
  });
});

/*
 * Test config: config-card-items.config
 * - CARD_SHOW_DUE=NO
 * - CARD_SHOW_STATUS=NO
 * All other card items enabled
 */

describe("Board Card Config - Due and Status", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("board/index.html");
  });

  test("Due dates are hidden when CARD_SHOW_DUE=NO", () => {
    const dueDates = $(".task-due").length;
    expect(dueDates).toBe(0);
  });

  test("Status badges are hidden when CARD_SHOW_STATUS=NO", () => {
    const statusBadges = $(".task-status").length;
    expect(statusBadges).toBe(0);
  });

  test("Enabled card items still appear", () => {
    // Progress labels should appear
    const progressLabels = $(".completion-label").length;
    expect(progressLabels).toBeGreaterThan(0);

    // Assignees should appear
    const assignees = $(".task-assignee").length;
    expect(assignees).toBeGreaterThan(0);

    // Priority badges should appear
    const priorityBadges = $(".priority-badge").length;
    expect(priorityBadges).toBeGreaterThan(0);

    // Tags should appear
    const cardTags = $(".card-tags").length;
    expect(cardTags).toBeGreaterThan(0);

    // Parent references should appear
    const cardParents = $(".card-parent").length;
    expect(cardParents).toBeGreaterThan(0);

    // Notes icons should appear
    const notesIcons = $(".card-notes-icon").length;
    expect(notesIcons).toBeGreaterThan(0);

    // Custom fields should appear
    const customFields = $(".card-custom-fields").length;
    expect(customFields).toBeGreaterThan(0);
  });

  test("Card meta section is empty when only due/status items would be there", () => {
    // For cards that only have due date and status in card-meta,
    // the section should be empty or minimal
    // This verifies the config is being applied correctly
    const cardMetas = $(".card-meta");
    cardMetas.each((_i, el) => {
      const metaText = $(el).text().trim();
      // Should not contain any due date patterns (YYYY-MM-DD)
      expect(metaText).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      // Should not contain status text
      expect(metaText).not.toContain("On track");
      expect(metaText).not.toContain("At risk");
      expect(metaText).not.toContain("Off track");
    });
  });
});

describe("Config Project Name", () => {
  test("Project name from config appears in page", () => {
    const $ = loadPage("board/index.html");
    const title = $("title").text();
    expect(title).toContain("Test Card Items");
  });
});
