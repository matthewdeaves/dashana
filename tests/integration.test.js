/**
 * Integration tests for production data validation.
 *
 * Run with: npm run test:integration
 *
 * These tests validate the actual production CSV data and generated views.
 * Tests are data-independent - they verify structure and consistency,
 * not specific row counts (which change as your Asana export updates).
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { parse } = require("csv-parse/sync");
const cheerio = require("cheerio");

// Skip if not running integration tests or if production CSV doesn't exist
const isIntegration = process.env.TEST_TYPE === "integration";
const productionCsvExists = fs.existsSync(
  path.join(__dirname, "../data/project.csv"),
);

const describeIntegration =
  isIntegration && productionCsvExists ? describe : describe.skip;

function loadProductionCSV() {
  const csvPath = path.join(__dirname, "../data/project.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function loadPage(pagePath) {
  const filePath = path.join(__dirname, "../_site", pagePath);
  const html = fs.readFileSync(filePath, "utf-8");
  return cheerio.load(html);
}

describeIntegration("Production Data Integration Tests", () => {
  let records;
  let $dashboard;

  beforeAll(() => {
    // Build with production data
    execSync("npm run build", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
    records = loadProductionCSV();
    $dashboard = loadPage("index.html");
  });

  describe("CSV Structure Validation", () => {
    test("CSV has at least one task", () => {
      expect(records.length).toBeGreaterThan(0);
    });

    test("all records have required Name field", () => {
      records.forEach((record) => {
        expect(record.Name).toBeDefined();
        expect(typeof record.Name).toBe("string");
      });
    });

    test("CSV has expected Asana columns", () => {
      if (records.length === 0) return;
      const fields = Object.keys(records[0]);
      // Core fields that should exist in Asana exports
      expect(fields).toContain("Name");
      // Section/Column is recommended but may be missing
    });
  });

  describe("View Consistency", () => {
    test("all views show same task count as CSV", () => {
      const board = loadPage("board/index.html");
      const tasks = loadPage("tasks/index.html");
      const timeline = loadPage("timeline/index.html");

      expect(board(".task-card").length).toBe(records.length);
      expect(tasks(".task-table tbody tr").length).toBe(records.length);
      expect(timeline(".timeline-table tbody tr").length).toBe(records.length);
    });

    test("dashboard total matches CSV row count", () => {
      const subtitle = $dashboard(".dashboard-subtitle").text();
      expect(subtitle).toContain(`${records.length} total tasks`);
    });

    test("all metric sums equal total task count", () => {
      let sectionSum = 0;
      $dashboard(".metric-sections .section-count").each((_i, el) => {
        sectionSum += parseInt($dashboard(el).text(), 10);
      });

      let statusSum = 0;
      $dashboard(".metric-status .status-count").each((_i, el) => {
        statusSum += parseInt($dashboard(el).text(), 10);
      });

      let prioritySum = 0;
      $dashboard(".metric-priority .priority-count").each((_i, el) => {
        prioritySum += parseInt($dashboard(el).text(), 10);
      });

      let assigneeSum = 0;
      $dashboard(".metric-assignees .assignee-count").each((_i, el) => {
        assigneeSum += parseInt($dashboard(el).text(), 10);
      });

      expect(sectionSum).toBe(records.length);
      expect(statusSum).toBe(records.length);
      expect(prioritySum).toBe(records.length);
      expect(assigneeSum).toBe(records.length);
    });
  });

  describe("Data Integrity", () => {
    test("every task from CSV appears in task list", () => {
      const tasks = loadPage("tasks/index.html");
      const taskNames = [];
      tasks(".col-name").each((_i, el) => {
        taskNames.push(tasks(el).text().trim());
      });

      records.forEach((record) => {
        expect(taskNames.some((name) => name.includes(record.Name))).toBe(true);
      });
    });

    test("all sections have at least one task", () => {
      const sectionCounts = [];
      $dashboard(".metric-sections .section-count").each((_i, el) => {
        sectionCounts.push(parseInt($dashboard(el).text(), 10));
      });

      sectionCounts.forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });

    test("completion percentage is valid", () => {
      const percent = $dashboard(".completion-percent").text();
      const value = parseInt(percent, 10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  describe("No Rendering Errors", () => {
    test("no NaN values in rendered HTML", () => {
      const board = loadPage("board/index.html");
      const tasks = loadPage("tasks/index.html");
      const timeline = loadPage("timeline/index.html");

      expect($dashboard.html()).not.toContain("NaN");
      expect(board.html()).not.toContain("NaN");
      expect(tasks.html()).not.toContain("NaN");
      expect(timeline.html()).not.toContain("NaN");
    });

    test("no undefined values in rendered HTML", () => {
      const board = loadPage("board/index.html");
      const tasks = loadPage("tasks/index.html");
      const timeline = loadPage("timeline/index.html");

      // Check for literal "undefined" text (not undefined in JS)
      expect($dashboard.html()).not.toMatch(/\bundefined\b/);
      expect(board.html()).not.toMatch(/\bundefined\b/);
      expect(tasks.html()).not.toMatch(/\bundefined\b/);
      expect(timeline.html()).not.toMatch(/\bundefined\b/);
    });
  });
});
