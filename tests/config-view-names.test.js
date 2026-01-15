/**
 * View Names and Page Headings Config Tests
 *
 * Tests custom DASHBOARD_NAME, BOARD_NAME, etc. config options
 * render correctly in navigation, browser titles, and page headings.
 *
 * Uses config-view-names.config fixture.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const cheerio = require("cheerio");

const FIXTURE_CSV = path.join(__dirname, "fixtures/test-project.csv");
const TEST_CONFIG = path.join(__dirname, "fixtures/config-view-names.config");
const SITE_DIR = path.join(__dirname, "../_site");

function loadPage(pagePath) {
  const filePath = path.join(SITE_DIR, pagePath);
  if (!fs.existsSync(filePath)) return null;
  const html = fs.readFileSync(filePath, "utf-8");
  return cheerio.load(html);
}

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

describe("View Names - Navigation Labels", () => {
  let $;
  let navLinks;

  beforeAll(() => {
    $ = loadPage("index.html");
    navLinks = $(".nav-link")
      .map((_i, el) => $(el).text().trim())
      .get();
  });

  test("Dashboard nav shows custom DASHBOARD_NAME", () => {
    expect(navLinks).toContain("Home");
  });

  test("Board nav shows custom BOARD_NAME", () => {
    expect(navLinks).toContain("Sprint Board");
  });

  test("Tasks nav shows custom TASKS_NAME", () => {
    expect(navLinks).toContain("Backlog");
  });

  test("Timeline nav shows custom TIMELINE_NAME", () => {
    expect(navLinks).toContain("Roadmap");
  });
});

describe("View Names - Browser Tab Titles", () => {
  test("Dashboard page title uses custom DASHBOARD_NAME", () => {
    const $ = loadPage("index.html");
    const title = $("title").text();
    expect(title).toContain("Home");
  });

  test("Board page title uses custom BOARD_NAME", () => {
    const $ = loadPage("board/index.html");
    const title = $("title").text();
    expect(title).toContain("Sprint Board");
  });

  test("Tasks page title uses custom TASKS_NAME", () => {
    const $ = loadPage("tasks/index.html");
    const title = $("title").text();
    expect(title).toContain("Backlog");
  });

  test("Timeline page title uses custom TIMELINE_NAME", () => {
    const $ = loadPage("timeline/index.html");
    const title = $("title").text();
    expect(title).toContain("Roadmap");
  });
});

describe("Page Headings", () => {
  test("Dashboard shows custom DASHBOARD_HEADING", () => {
    const $ = loadPage("index.html");
    const heading = $("h2").first().text().trim();
    expect(heading).toBe("Welcome Dashboard");
  });

  test("Board shows custom BOARD_HEADING", () => {
    const $ = loadPage("board/index.html");
    const heading = $("h2").first().text().trim();
    expect(heading).toBe("Current Sprint");
  });

  test("Tasks shows custom TASKS_HEADING", () => {
    const $ = loadPage("tasks/index.html");
    const heading = $("h2").first().text().trim();
    expect(heading).toBe("Product Backlog");
  });

  test("Timeline shows custom TIMELINE_HEADING", () => {
    const $ = loadPage("timeline/index.html");
    const heading = $("h2").first().text().trim();
    expect(heading).toBe("Release Roadmap");
  });
});
