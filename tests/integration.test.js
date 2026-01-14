/**
 * Integration tests for production data validation.
 *
 * Run with: npm run test:integration
 *
 * These tests validate the actual production CSV data and generated views.
 * They will fail if the production data changes, which is expected -
 * update the expected values when you update your Asana export.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { parse } = require("csv-parse/sync");
const cheerio = require("cheerio");

// Skip if not running integration tests
const isIntegration = process.env.TEST_TYPE === "integration";

const describeIntegration = isIntegration ? describe : describe.skip;

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

  test("CSV has expected number of tasks", () => {
    expect(records.length).toBe(20);
  });

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
});
