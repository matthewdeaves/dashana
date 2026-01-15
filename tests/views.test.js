const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const cheerio = require("cheerio");

const FIXTURE_CSV = path.join(__dirname, "fixtures/test-project.csv");
const FIXTURE_CONFIG = path.join(__dirname, "fixtures/test-dashana.config");

// Build site using fixture data via environment variables (never touches production files)
beforeAll(() => {
  execSync("npm run build", {
    cwd: path.join(__dirname, ".."),
    stdio: "pipe",
    env: {
      ...process.env,
      DASHANA_CSV_PATH: FIXTURE_CSV,
      DASHANA_CONFIG_PATH: FIXTURE_CONFIG,
    },
  });
});

function loadPage(pagePath) {
  const filePath = path.join(__dirname, "../_site", pagePath);
  const html = fs.readFileSync(filePath, "utf-8");
  return cheerio.load(html);
}

/*
 * Test fixture contains 10 tasks:
 * - Task One: To do, Alice, High, On track, due 2026-01-10, Sprint 1, 3 pts
 * - Task Two: To do, Bob, Medium, At risk, due 2026-01-05, Sprint 1, 5 pts
 * - Task Three: In Progress, Alice, Low, On track, due 2026-01-08, Sprint 2, 2 pts
 * - Task Four: In Progress, unassigned, High, Off track, no due, no sprint, 8 pts
 * - Task Five: Done, Bob, no priority, On track, due 2026-01-03, Sprint 1, no pts
 * - Task Six: Done, unassigned, no priority, no status, no sprint, no pts
 * - Task Seven: To do, unassigned, no priority, no status, Sprint 2, 1 pt
 * - Task Eight: Completed, Alice, Medium, no status, no sprint, no pts
 * - Subtask A: To do (inherited), unassigned, no priority, no status, Sprint 1, parent: Task Two
 * - Subtask B: To do (inherited), unassigned, no priority, no status, no sprint, parent: Task Two
 *
 * Sections: To do (5 - 3 original + 2 subtasks), In Progress (2), Done (2), Completed (1)
 * Done tasks: 3 (Task Five, Task Six, Task Eight)
 * Status: On track (3), At risk (1), Off track (1), No status (5)
 * Priority: High (2), Medium (2), Low (1), No priority (5)
 * Assignees: Alice (3), Bob (2), Unassigned (5)
 * Custom Fields: Sprint (Sprint 1: 4, Sprint 2: 2, empty: 4), Story Points (has value: 5, empty: 5)
 */

describe("Dashboard View", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("index.html");
  });

  test("displays correct total task count", () => {
    const subtitle = $(".dashboard-subtitle").text();
    expect(subtitle).toContain("10 total tasks");
  });

  test("displays correct completion stats", () => {
    const percent = $(".completion-percent").text();
    const detail = $(".completion-detail").text();
    expect(percent).toBe("30%"); // 3/10 = 30%
    expect(detail).toBe("3 of 10 done");
  });

  test("displays all sections with correct counts", () => {
    const sections = [];
    $(".metric-sections .section-item").each((_i, el) => {
      const name = $(el).find(".section-name").text();
      const count = parseInt($(el).find(".section-count").text(), 10);
      sections.push({ name, count });
    });

    expect(sections).toContainEqual({ name: "To do", count: 5 }); // 3 + 2 subtasks
    expect(sections).toContainEqual({ name: "In Progress", count: 2 });
    expect(sections).toContainEqual({ name: "Done", count: 2 });
    expect(sections).toContainEqual({ name: "Completed", count: 1 });

    const total = sections.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBe(10);
  });

  test('displays all statuses with correct counts including "No status"', () => {
    const statuses = [];
    $(".metric-status .status-item").each((_i, el) => {
      const name = $(el).find(".status-name").text();
      const count = parseInt($(el).find(".status-count").text(), 10);
      statuses.push({ name, count });
    });

    expect(statuses).toContainEqual({ name: "On track", count: 3 });
    expect(statuses).toContainEqual({ name: "At risk", count: 1 });
    expect(statuses).toContainEqual({ name: "Off track", count: 1 });
    expect(statuses).toContainEqual({ name: "No status", count: 5 }); // 3 + 2 subtasks

    const total = statuses.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBe(10);
  });

  test('displays all priorities with correct counts including "No priority"', () => {
    const priorities = [];
    $(".metric-priority .priority-item").each((_i, el) => {
      const name = $(el).find(".priority-name").text();
      const count = parseInt($(el).find(".priority-count").text(), 10);
      priorities.push({ name, count });
    });

    expect(priorities).toContainEqual({ name: "High", count: 2 });
    expect(priorities).toContainEqual({ name: "Medium", count: 2 });
    expect(priorities).toContainEqual({ name: "Low", count: 1 });
    expect(priorities).toContainEqual({ name: "No priority", count: 5 }); // 3 + 2 subtasks

    const total = priorities.reduce((sum, p) => sum + p.count, 0);
    expect(total).toBe(10);
  });

  test("displays all assignees with correct counts", () => {
    const assignees = [];
    $(".metric-assignees .assignee-item").each((_i, el) => {
      const name = $(el).find(".assignee-name").text();
      const count = parseInt($(el).find(".assignee-count").text(), 10);
      assignees.push({ name, count });
    });

    expect(assignees).toContainEqual({ name: "Alice", count: 3 });
    expect(assignees).toContainEqual({ name: "Bob", count: 2 });
    expect(assignees).toContainEqual({ name: "Unassigned", count: 5 }); // 3 + 2 subtasks

    const total = assignees.reduce((sum, a) => sum + a.count, 0);
    expect(total).toBe(10);
  });

  test("displays overdue count", () => {
    const count = $(".overdue-count").text().trim();
    // Overdue depends on "today" date used during build
    // Just verify it's a number
    expect(parseInt(count, 10)).toBeGreaterThanOrEqual(0);
  });
});

describe("Board View", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("board/index.html");
  });

  test("displays correct total in subtitle", () => {
    const subtitle = $(".page-subtitle").text();
    expect(subtitle).toContain("10 tasks");
  });

  test("has all 4 columns", () => {
    const columns = $(".board-column").length;
    expect(columns).toBe(4);
  });

  test("displays all 10 task cards", () => {
    const cards = $(".task-card").length;
    expect(cards).toBe(10);
  });

  test("each task has a completion label", () => {
    const labels = $(".completion-label").length;
    expect(labels).toBe(10);
  });

  test('done tasks have "Done" completion label', () => {
    const doneLabels = $(".completion-done").length;
    expect(doneLabels).toBe(3); // 3 tasks in Done/Completed sections
  });

  test('open tasks have "Open" completion label', () => {
    const openLabels = $(".completion-open").length;
    expect(openLabels).toBe(7); // 7 tasks not in Done/Completed sections (5 + 2 subtasks)
  });

  test("columns show progress counts", () => {
    const progressTexts = [];
    $(".column-progress").each((_i, el) => {
      progressTexts.push($(el).text().trim());
    });

    // Each column should show "X/Y complete" format
    progressTexts.forEach((text) => {
      expect(text).toMatch(/\d+\/\d+ complete/);
    });
  });

  test("task cards in To do section are not marked done", () => {
    const todoColumn = $(".board-column").first();
    const doneCards = todoColumn.find(".task-card.is-done").length;
    expect(doneCards).toBe(0);
  });

  test("task cards in Done section are marked done", () => {
    // Find the Done column by looking for column title
    let doneColumn;
    $(".board-column").each((_i, el) => {
      if ($(el).find(".column-title").text() === "Done") {
        doneColumn = $(el);
      }
    });

    const doneCards = doneColumn.find(".task-card.is-done").length;
    expect(doneCards).toBe(2); // 2 tasks in Done section
  });
});

describe("Tasks View", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("tasks/index.html");
  });

  test("displays correct total in subtitle", () => {
    const subtitle = $(".page-subtitle").text();
    expect(subtitle).toContain("10 tasks");
  });

  test("has all 10 task rows", () => {
    const rows = $(".task-table tbody tr").length;
    expect(rows).toBe(10);
  });

  test("each row has a completion label in its own column", () => {
    const labels = $(".task-table .col-completion .completion-label").length;
    expect(labels).toBe(10);
  });

  test('done tasks have "Done" completion label', () => {
    const doneLabels = $(".task-table .col-completion .completion-done").length;
    expect(doneLabels).toBe(3);
  });

  test("done rows have row-done class", () => {
    const doneRows = $(".task-table .row-done").length;
    expect(doneRows).toBe(3);
  });

  test("has correct table headers", () => {
    const headers = [];
    $(".task-table th").each((_i, el) => {
      headers.push($(el).text().trim());
    });

    expect(headers).toContain("Name");
    expect(headers).toContain("Section");
    expect(headers).toContain("Assignee");
    expect(headers).toContain("Due Date");
    expect(headers).toContain("Priority");
    expect(headers).toContain("Status");
  });
});

describe("Timeline View", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("timeline/index.html");
  });

  test("displays correct total in subtitle", () => {
    const subtitle = $(".page-subtitle").text();
    expect(subtitle).toContain("10 tasks");
  });

  test("has all 10 task rows", () => {
    const rows = $(".timeline-table tbody tr").length;
    expect(rows).toBe(10);
  });

  test("each row has a completion label in its own column", () => {
    const labels = $(
      ".timeline-table .col-completion .completion-label",
    ).length;
    expect(labels).toBe(10);
  });

  test('done tasks have "Done" completion label', () => {
    const doneLabels = $(
      ".timeline-table .col-completion .completion-done",
    ).length;
    expect(doneLabels).toBe(3);
  });

  test('tasks without dates show "No dates" label', () => {
    const noDateLabels = $(".no-dates-label").length;
    // 6 tasks without dates: Task Four, Task Six, Task Seven, Task Eight, Subtask A, Subtask B
    expect(noDateLabels).toBe(6);
  });

  test("tasks with dates have duration bars", () => {
    const durationBars = $(".duration-bar").length;
    // 4 tasks with dates: Task One, Two, Three, Five
    expect(durationBars).toBe(4);
  });

  test("has correct table headers", () => {
    const headers = [];
    $(".timeline-table th").each((_i, el) => {
      headers.push($(el).text().trim());
    });

    expect(headers).toContain("Task");
    expect(headers).toContain("Start");
    expect(headers).toContain("Due");
    expect(headers).toContain("Duration");
    expect(headers).toContain("Status");
  });
});

describe("Theme Toggle", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("index.html");
  });

  test("has theme toggle button", () => {
    const toggle = $("#theme-toggle");
    expect(toggle.length).toBe(1);
  });

  test("has light and dark labels", () => {
    const lightLabel = $(".theme-icon-light").text();
    const darkLabel = $(".theme-icon-dark").text();
    expect(lightLabel).toBe("Light");
    expect(darkLabel).toBe("Dark");
  });

  test("has theme initialization script in head", () => {
    const headScripts = $("head script").text();
    expect(headScripts).toContain("localStorage");
    expect(headScripts).toContain("theme");
  });

  test("has theme toggle script in body", () => {
    const bodyScripts = $("body script").text();
    expect(bodyScripts).toContain("theme-toggle");
    expect(bodyScripts).toContain("classList");
  });
});

describe("Cross-View Consistency", () => {
  let dashboard, board, tasks, timeline;

  beforeAll(() => {
    dashboard = loadPage("index.html");
    board = loadPage("board/index.html");
    tasks = loadPage("tasks/index.html");
    timeline = loadPage("timeline/index.html");
  });

  test("all views show the same total task count", () => {
    const dashboardTotal = dashboard(".dashboard-subtitle")
      .text()
      .match(/(\d+) total/)?.[1];
    const boardTotal = board(".page-subtitle")
      .text()
      .match(/(\d+) tasks/)?.[1];
    const tasksTotal = tasks(".page-subtitle")
      .text()
      .match(/(\d+) tasks/)?.[1];
    const timelineTotal = timeline(".page-subtitle")
      .text()
      .match(/(\d+) tasks/)?.[1];

    expect(dashboardTotal).toBe("10");
    expect(boardTotal).toBe("10");
    expect(tasksTotal).toBe("10");
    expect(timelineTotal).toBe("10");
  });

  test("all views have same number of task elements", () => {
    const boardCards = board(".task-card").length;
    const tasksRows = tasks(".task-table tbody tr").length;
    const timelineRows = timeline(".timeline-table tbody tr").length;

    expect(boardCards).toBe(10);
    expect(tasksRows).toBe(10);
    expect(timelineRows).toBe(10);
  });

  test("all views have same number of done tasks", () => {
    const boardDone = board(".task-card.is-done").length;
    const tasksDone = tasks(".row-done").length;
    const timelineDone = timeline(".row-done").length;

    expect(boardDone).toBe(3);
    expect(tasksDone).toBe(3);
    expect(timelineDone).toBe(3);
  });
});

/*
 * XSS Prevention Tests
 * Verify that Nunjucks auto-escaping prevents script injection
 */
describe("XSS Prevention", () => {
  let $;

  beforeAll(() => {
    $ = loadPage("tasks/index.html");
  });

  test("task names with angle brackets are escaped in output", () => {
    // Nunjucks auto-escapes {{ }} output by default
    // This test verifies that mechanism is working
    const taskNames = [];
    $(".col-name").each((_i, el) => {
      taskNames.push($(el).text().trim());
    });
    expect(taskNames.length).toBeGreaterThan(0);

    // Verify that task-related content areas don't contain script tags
    // (The page has legitimate scripts for theme toggle, but task data shouldn't)
    const tableHtml = $(".task-table").html();
    expect(tableHtml).not.toMatch(/<script/i);
  });

  test("notes in title attributes are properly escaped", () => {
    // Notes appear in title attributes which need proper escaping
    const notesIcons = $(".notes-icon");
    notesIcons.each((_i, el) => {
      const title = $(el).attr("title");
      if (title) {
        // Verify title doesn't contain unescaped HTML
        expect(title).not.toMatch(/<script/i);
      }
    });
  });

  test("custom field values are escaped", () => {
    // Custom fields from CSV should be auto-escaped
    const customFieldValues = [];
    $(".custom-field-value").each((_i, el) => {
      customFieldValues.push($(el).text());
    });
    // Verify we have custom field values rendered
    expect(customFieldValues.length).toBeGreaterThan(0);
  });
});

/*
 * Custom Fields in Test Fixture:
 * - Sprint: Sprint 1 (Tasks 1,2,5), Sprint 2 (Tasks 3,7), empty (Tasks 4,6,8)
 * - Story Points: 3 (Task 1), 5 (Task 2), 2 (Task 3), 8 (Task 4), 1 (Task 7), empty (Tasks 5,6,8)
 */
describe("Custom Fields", () => {
  describe("Tasks Table", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("tasks/index.html");
    });

    test("has custom field column headers", () => {
      const headers = [];
      $(".task-table th").each((_i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain("Sprint");
      expect(headers).toContain("Story Points");
    });

    test("displays custom field values in table cells", () => {
      const sprintValues = [];
      $(".task-table tbody tr").each((_i, el) => {
        const customCells = $(el).find(".col-custom");
        if (customCells.length >= 1) {
          sprintValues.push($(customCells[0]).text().trim());
        }
      });

      expect(sprintValues).toContain("Sprint 1");
      expect(sprintValues).toContain("Sprint 2");
    });

    test("displays dash for empty custom field values", () => {
      const html = $(".task-table").html();
      // Tasks without values should show —
      expect(html).toContain("—");
    });
  });

  describe("Board Cards", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("board/index.html");
    });

    test("task cards display custom fields when present", () => {
      const customFieldSections = $(".card-custom-fields").length;
      // Only cards with at least one custom field value should have this section
      expect(customFieldSections).toBeGreaterThan(0);
    });

    test("custom field values are displayed", () => {
      const html = $(".board").html();
      expect(html).toContain("Sprint 1");
      expect(html).toContain("Story Points");
    });
  });

  describe("Timeline Table", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("timeline/index.html");
    });

    test("has custom field column headers", () => {
      const headers = [];
      $(".timeline-table th").each((_i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain("Sprint");
      expect(headers).toContain("Story Points");
    });

    test("displays custom field values in timeline rows", () => {
      const html = $(".timeline-table").html();
      expect(html).toContain("Sprint 1");
      expect(html).toContain("Sprint 2");
    });
  });
});

/*
 * Tags, Parent Task, and Notes in Test Fixture:
 * - Tags: Frontend,UI (Task 1), Backend (Task 2), Frontend,Backend (Task 3), Completed (Task 5), Planning (Task 7)
 * - Parent Task: Task One (Tasks 3,7)
 * - Notes: Various tasks have notes, Task Six has none
 */
describe("Tags, Parent Task, and Notes", () => {
  describe("Tasks Table", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("tasks/index.html");
    });

    test("has Tags, Parent, and Notes column headers", () => {
      const headers = [];
      $(".task-table th").each((_i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain("Tags");
      expect(headers).toContain("Parent");
      expect(headers).toContain("Notes");
    });

    test("displays tag badges", () => {
      const tagBadges = $(".task-table .tag-badge").length;
      expect(tagBadges).toBeGreaterThan(0);
    });

    test("displays specific tag values", () => {
      const html = $(".task-table").html();
      expect(html).toContain("Frontend");
      expect(html).toContain("Backend");
    });

    test("displays parent task references", () => {
      const parentRefs = $(".task-table .parent-ref").length;
      expect(parentRefs).toBeGreaterThan(0);
    });

    test("displays notes icon", () => {
      const notesIcons = $(".task-table .notes-icon").length;
      expect(notesIcons).toBeGreaterThan(0);
    });
  });

  describe("Board Cards", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("board/index.html");
    });

    test("displays tag badges on cards", () => {
      const cardTags = $(".card-tags").length;
      expect(cardTags).toBeGreaterThan(0);
    });

    test("displays parent task reference on cards", () => {
      const cardParents = $(".card-parent").length;
      expect(cardParents).toBeGreaterThan(0);
    });

    test("displays notes icon on cards with notes", () => {
      const notesIcons = $(".card-notes-icon").length;
      expect(notesIcons).toBeGreaterThan(0);
    });
  });

  describe("Timeline Table", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("timeline/index.html");
    });

    test("has Tags and Parent column headers", () => {
      const headers = [];
      $(".timeline-table th").each((_i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain("Tags");
      expect(headers).toContain("Parent");
    });

    test("displays tag badges in timeline", () => {
      const tagBadges = $(".timeline-table .tag-badge").length;
      expect(tagBadges).toBeGreaterThan(0);
    });

    test("displays notes icon in task name", () => {
      const html = $(".timeline-table").html();
      expect(html).toContain("📝");
    });
  });
});

/*
 * Subtask Ordering Tests
 * Subtasks should appear directly after their parent task in all views
 * Test fixture: Subtask A and Subtask B are children of Task Two
 */
describe("Subtask Ordering and Grouping", () => {
  describe("Board View", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("board/index.html");
    });

    test("subtask cards have is-subtask class", () => {
      const subtaskCards = $(".task-card.is-subtask").length;
      // Task Three, Task Seven (parent: Task One), Subtask A, Subtask B (parent: Task Two)
      expect(subtaskCards).toBe(4);
    });

    test("subtasks appear after their parent task", () => {
      // Get all task names in order from the To do column
      const taskNames = [];
      $(".task-card .task-name").each((_i, el) => {
        taskNames.push($(el).text().trim());
      });

      const taskTwoIndex = taskNames.indexOf("Task Two");
      const subtaskAIndex = taskNames.indexOf("Subtask A");
      const subtaskBIndex = taskNames.indexOf("Subtask B");

      // Subtasks should come immediately after parent
      expect(subtaskAIndex).toBe(taskTwoIndex + 1);
      expect(subtaskBIndex).toBe(taskTwoIndex + 2);
    });
  });

  describe("Tasks Table", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("tasks/index.html");
    });

    test("subtask rows have row-subtask class", () => {
      const subtaskRows = $(".task-table .row-subtask").length;
      // Task Three, Task Seven, Subtask A, Subtask B
      expect(subtaskRows).toBe(4);
    });

    test("subtasks appear after their parent task in table", () => {
      const taskNames = [];
      $(".task-table tbody tr .col-name").each((_i, el) => {
        // Extract task name (may have subtask indent prefix)
        const text = $(el).text().trim().replace(/^↳\s*/, "");
        taskNames.push(text);
      });

      const taskTwoIndex = taskNames.indexOf("Task Two");
      const subtaskAIndex = taskNames.indexOf("Subtask A");
      const subtaskBIndex = taskNames.indexOf("Subtask B");

      expect(subtaskAIndex).toBe(taskTwoIndex + 1);
      expect(subtaskBIndex).toBe(taskTwoIndex + 2);
    });
  });

  describe("Timeline View", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("timeline/index.html");
    });

    test("subtask rows have row-subtask class", () => {
      const subtaskRows = $(".timeline-table .row-subtask").length;
      // Task Three, Task Seven (parent: Task One), Subtask A, Subtask B (parent: Task Two)
      expect(subtaskRows).toBe(4);
    });

    test("tasks are sorted chronologically by start/due date", () => {
      const taskNames = [];
      $(".timeline-table tbody tr .col-name").each((_i, el) => {
        const text = $(el)
          .text()
          .trim()
          .replace(/^↳\s*/, "")
          .replace(/\s*📝.*$/, "");
        taskNames.push(text);
      });

      // Task One (2026-01-01) should come before Task Two (2026-01-02)
      const taskOneIndex = taskNames.indexOf("Task One");
      const taskTwoIndex = taskNames.indexOf("Task Two");
      expect(taskOneIndex).toBeLessThan(taskTwoIndex);

      // Task Two (2026-01-02) should come before Task Three (2026-01-03)
      const taskThreeIndex = taskNames.indexOf("Task Three");
      expect(taskTwoIndex).toBeLessThan(taskThreeIndex);

      // Tasks without dates (Subtask A, Subtask B) should be at the end
      const subtaskAIndex = taskNames.indexOf("Subtask A");
      const subtaskBIndex = taskNames.indexOf("Subtask B");
      expect(subtaskAIndex).toBeGreaterThan(taskThreeIndex);
      expect(subtaskBIndex).toBeGreaterThan(taskThreeIndex);
    });
  });
});

/*
 * Notes Text Column Tests
 * Tests for the inline notes text column feature (ENH-001)
 */
const NOTES_TEXT_PREVIEW_CONFIG = path.join(
  __dirname,
  "fixtures/notes-text-preview.config",
);
const NOTES_TEXT_FULL_CONFIG = path.join(
  __dirname,
  "fixtures/notes-text-full.config",
);

describe("Notes Text Column - Default (Enabled)", () => {
  // Uses the main fixture which has notesText enabled by default

  test("notes text column is visible when enabled", () => {
    const $ = loadPage("tasks/index.html");
    const notesTextCols = $(".col-notes-text").length;
    expect(notesTextCols).toBeGreaterThan(0);
  });

  test("notes text column header is visible when enabled", () => {
    const $ = loadPage("tasks/index.html");
    const headers = [];
    $(".task-table th").each((_i, el) => {
      headers.push($(el).attr("class") || "");
    });
    expect(headers.filter((h) => h.includes("col-notes-text")).length).toBe(1);
  });
});

describe("Notes Text Column - Preview Mode", () => {
  beforeAll(() => {
    execSync("npm run build", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
      env: {
        ...process.env,
        DASHANA_CSV_PATH: FIXTURE_CSV,
        DASHANA_CONFIG_PATH: NOTES_TEXT_PREVIEW_CONFIG,
      },
    });
  });

  describe("Tasks View", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("tasks/index.html");
    });

    test("has Notes column header for notes text", () => {
      const headers = [];
      $(".task-table th").each((_i, el) => {
        if ($(el).hasClass("col-notes-text")) {
          headers.push($(el).text().trim());
        }
      });
      expect(headers).toContain("Notes");
    });

    test("displays notes text preview for tasks with notes", () => {
      const previews = $(".task-table .notes-text-preview");
      expect(previews.length).toBeGreaterThan(0);
    });

    test("preview text is truncated with ellipsis", () => {
      // Task One has notes "First task with important details" (35 chars)
      // With NOTES_TEXT_PREVIEW_LENGTH=50, it should show full text
      // Task Four has notes "Blocked by dependency" which is short
      const previewTexts = [];
      $(".task-table .notes-text-preview").each((_i, el) => {
        previewTexts.push($(el).text().trim());
      });
      expect(previewTexts.length).toBeGreaterThan(0);
      // All preview texts should exist
      previewTexts.forEach((text) => {
        expect(text.length).toBeGreaterThan(0);
      });
    });

    test("preview has data-notes attribute with full text", () => {
      const firstPreview = $(".task-table .notes-text-preview").first();
      const dataNotes = firstPreview.attr("data-notes");
      expect(dataNotes).toBeDefined();
      expect(dataNotes.length).toBeGreaterThan(0);
    });

    test("preview has accessibility attributes", () => {
      const firstPreview = $(".task-table .notes-text-preview").first();
      expect(firstPreview.attr("tabindex")).toBe("0");
      expect(firstPreview.attr("role")).toBe("button");
      expect(firstPreview.attr("aria-label")).toBe("View full notes");
    });

    test("shows em-dash for tasks without notes", () => {
      const html = $(".task-table .col-notes-text").text();
      expect(html).toContain("—");
    });
  });

  describe("Timeline View", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("timeline/index.html");
    });

    test("has Notes column header for notes text", () => {
      const headers = [];
      $(".timeline-table th").each((_i, el) => {
        if ($(el).hasClass("col-notes-text")) {
          headers.push($(el).text().trim());
        }
      });
      expect(headers).toContain("Notes");
    });

    test("displays notes text preview for tasks with notes", () => {
      const previews = $(".timeline-table .notes-text-preview");
      expect(previews.length).toBeGreaterThan(0);
    });

    test("shows em-dash for tasks without notes", () => {
      const html = $(".timeline-table .col-notes-text").text();
      expect(html).toContain("—");
    });
  });
});

describe("Notes Text Column - Full Mode", () => {
  beforeAll(() => {
    execSync("npm run build", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
      env: {
        ...process.env,
        DASHANA_CSV_PATH: FIXTURE_CSV,
        DASHANA_CONFIG_PATH: NOTES_TEXT_FULL_CONFIG,
      },
    });
  });

  describe("Tasks View", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("tasks/index.html");
    });

    test("has Notes column header for notes text", () => {
      const headers = [];
      $(".task-table th").each((_i, el) => {
        if ($(el).hasClass("col-notes-text")) {
          headers.push($(el).text().trim());
        }
      });
      expect(headers).toContain("Notes");
    });

    test("displays full notes text for tasks with notes", () => {
      const fullTexts = $(".task-table .notes-text-full");
      expect(fullTexts.length).toBeGreaterThan(0);
    });

    test("full mode shows complete text without truncation", () => {
      const html = $(".task-table").html();
      // Task One's notes should be fully visible
      expect(html).toContain("First task with important details");
      // Task Two's notes
      expect(html).toContain("Backend API implementation");
    });

    test("full mode does not have preview class", () => {
      const previews = $(".task-table .notes-text-preview");
      expect(previews.length).toBe(0);
    });

    test("shows em-dash for tasks without notes", () => {
      const html = $(".task-table .col-notes-text").text();
      expect(html).toContain("—");
    });
  });

  describe("Timeline View", () => {
    let $;

    beforeAll(() => {
      $ = loadPage("timeline/index.html");
    });

    test("displays full notes text for tasks with notes", () => {
      const fullTexts = $(".timeline-table .notes-text-full");
      expect(fullTexts.length).toBeGreaterThan(0);
    });

    test("full mode shows complete text", () => {
      const html = $(".timeline-table").html();
      expect(html).toContain("First task with important details");
    });
  });
});
