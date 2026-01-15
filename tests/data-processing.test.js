const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Import processing functions from the actual source
const tasksModule = require("../src/_data/tasks.js");
const {
  normalizeToUTC,
  validateRecords,
  isDoneSection,
  isOverdue,
  priorityOrder,
  processRecords,
  calculateDuration,
} = tasksModule;

// Load test fixture
function loadTestData() {
  const csvPath = path.join(__dirname, "fixtures/test-project.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

describe("normalizeToUTC", () => {
  test("normalizes a date to UTC midnight", () => {
    const date = new Date("2026-01-15T14:30:00Z");
    const normalized = normalizeToUTC(date);
    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCMinutes()).toBe(0);
    expect(normalized.getUTCSeconds()).toBe(0);
    expect(normalized.getUTCFullYear()).toBe(2026);
    expect(normalized.getUTCMonth()).toBe(0); // January
    expect(normalized.getUTCDate()).toBe(15);
  });

  test("preserves the UTC date regardless of input time", () => {
    const date1 = new Date("2026-01-15T00:00:00Z");
    const date2 = new Date("2026-01-15T23:59:59Z");
    const normalized1 = normalizeToUTC(date1);
    const normalized2 = normalizeToUTC(date2);
    expect(normalized1.getTime()).toBe(normalized2.getTime());
  });
});

describe("isDoneSection", () => {
  test('recognizes "Done" section', () => {
    expect(isDoneSection("Done")).toBe(true);
  });

  test('recognizes "Completed" section', () => {
    expect(isDoneSection("Completed")).toBe(true);
  });

  test("recognizes case variations", () => {
    expect(isDoneSection("DONE")).toBe(true);
    expect(isDoneSection("done")).toBe(true);
    expect(isDoneSection("Completed Tasks")).toBe(true);
  });

  test("returns false for non-done sections", () => {
    expect(isDoneSection("To do")).toBe(false);
    expect(isDoneSection("In Progress")).toBe(false);
    expect(isDoneSection("Testing")).toBe(false);
  });

  test("handles null/undefined", () => {
    expect(isDoneSection(null)).toBe(false);
    expect(isDoneSection(undefined)).toBe(false);
    expect(isDoneSection("")).toBe(false);
  });
});

describe("isOverdue", () => {
  const today = new Date("2026-01-15");

  test("returns true for past due dates in active sections", () => {
    expect(isOverdue("2026-01-10", "To do", today)).toBe(true);
    expect(isOverdue("2026-01-14", "In Progress", today)).toBe(true);
  });

  test("returns false for future due dates", () => {
    expect(isOverdue("2026-01-20", "To do", today)).toBe(false);
    expect(isOverdue("2026-01-16", "In Progress", today)).toBe(false);
  });

  test("returns false for done sections regardless of date", () => {
    expect(isOverdue("2026-01-01", "Done", today)).toBe(false);
    expect(isOverdue("2026-01-01", "Completed", today)).toBe(false);
  });

  test("returns false for null/empty due dates", () => {
    expect(isOverdue(null, "To do", today)).toBe(false);
    expect(isOverdue("", "To do", today)).toBe(false);
  });

  test("returns false when due date equals today (same day not overdue)", () => {
    // Task due today should NOT be overdue, regardless of time
    const todayMorning = new Date("2026-01-15T08:00:00Z");
    const todayEvening = new Date("2026-01-15T20:00:00Z");
    expect(isOverdue("2026-01-15", "To do", todayMorning)).toBe(false);
    expect(isOverdue("2026-01-15", "To do", todayEvening)).toBe(false);
  });

  test("uses UTC comparison for timezone consistency", () => {
    // Create dates that might be different days in different timezones
    // but should be treated consistently with UTC comparison
    const todayUTC = new Date("2026-01-15T00:00:00Z");
    const todayLateUTC = new Date("2026-01-15T23:59:59Z");

    // Due date is 2026-01-14 - should be overdue on 2026-01-15
    expect(isOverdue("2026-01-14", "To do", todayUTC)).toBe(true);
    expect(isOverdue("2026-01-14", "To do", todayLateUTC)).toBe(true);

    // Due date is 2026-01-15 - should NOT be overdue on 2026-01-15
    expect(isOverdue("2026-01-15", "To do", todayUTC)).toBe(false);
    expect(isOverdue("2026-01-15", "To do", todayLateUTC)).toBe(false);
  });
});

describe("priorityOrder", () => {
  test("High priority is first", () => {
    expect(priorityOrder("High")).toBe(1);
  });

  test("Medium priority is second", () => {
    expect(priorityOrder("Medium")).toBe(2);
  });

  test("Low priority is third", () => {
    expect(priorityOrder("Low")).toBe(3);
  });

  test("Unknown/null priority is last", () => {
    expect(priorityOrder(null)).toBe(4);
    expect(priorityOrder("Unknown")).toBe(4);
    expect(priorityOrder("")).toBe(4);
  });
});

describe("Data Processing with Test Fixture", () => {
  let data;

  beforeAll(() => {
    const records = loadTestData();
    // Use a fixed date for consistent testing
    data = processRecords(records, new Date("2026-01-15"));
  });

  test("counts total tasks correctly", () => {
    expect(data.stats.total).toBe(10);
  });

  test("counts done tasks correctly", () => {
    // Done section: Task Five, Task Six
    // Completed section: Task Eight
    expect(data.stats.done).toBe(3);
  });

  test("calculates completion percentage", () => {
    // 3 done out of 10 = 30%
    expect(data.stats.completionPercent).toBe(30);
  });

  test("counts overdue tasks correctly", () => {
    // With today = 2026-01-15:
    // Task One: due 2026-01-10 (overdue, in To do)
    // Task Two: due 2026-01-05 (overdue, in To do)
    // Task Three: due 2026-01-08 (overdue, in In Progress)
    // Task Five: due 2026-01-03 (NOT overdue, in Done section)
    expect(data.stats.overdue).toBe(3);
  });

  test("groups tasks by section", () => {
    // 3 original + 2 subtasks inheriting from Task Two
    expect(data.stats.bySection["To do"]).toBe(5);
    expect(data.stats.bySection["In Progress"]).toBe(2);
    expect(data.stats.bySection.Done).toBe(2);
    expect(data.stats.bySection.Completed).toBe(1);
  });

  test('groups tasks by status including "No status"', () => {
    // On track: Task One, Task Three, Task Five = 3
    // At risk: Task Two = 1
    // Off track: Task Four = 1
    // No status: Task Six, Task Seven, Task Eight, Subtask A, Subtask B = 5
    expect(data.stats.byStatus["On track"]).toBe(3);
    expect(data.stats.byStatus["At risk"]).toBe(1);
    expect(data.stats.byStatus["Off track"]).toBe(1);
    expect(data.stats.byStatus["No status"]).toBe(5);
  });

  test("status counts sum to total", () => {
    const statusSum = Object.values(data.stats.byStatus).reduce(
      (a, b) => a + b,
      0,
    );
    expect(statusSum).toBe(data.stats.total);
  });

  test('groups tasks by priority including "No priority"', () => {
    expect(data.stats.byPriority.High).toBe(2);
    expect(data.stats.byPriority.Medium).toBe(2);
    expect(data.stats.byPriority.Low).toBe(1);
    // 3 original + 2 subtasks
    expect(data.stats.byPriority["No priority"]).toBe(5);
  });

  test("priority counts sum to total", () => {
    const prioritySum = Object.values(data.stats.byPriority).reduce(
      (a, b) => a + b,
      0,
    );
    expect(prioritySum).toBe(data.stats.total);
  });

  test("groups tasks by assignee", () => {
    expect(data.stats.byAssignee.Alice).toBe(3);
    expect(data.stats.byAssignee.Bob).toBe(2);
    // 3 original + 2 subtasks
    expect(data.stats.byAssignee.Unassigned).toBe(5);
  });

  test("assignee counts sum to total", () => {
    const assigneeSum = Object.values(data.stats.byAssignee).reduce(
      (a, b) => a + b,
      0,
    );
    expect(assigneeSum).toBe(data.stats.total);
  });

  test("section counts sum to total", () => {
    const sectionSum = Object.values(data.stats.bySection).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sectionSum).toBe(data.stats.total);
  });

  test("all tasks array contains all tasks", () => {
    expect(data.all.length).toBe(10);
  });

  test("tasks have correct isDone flag", () => {
    const taskFive = data.all.find((t) => t.name === "Task Five");
    const taskSix = data.all.find((t) => t.name === "Task Six");
    const taskEight = data.all.find((t) => t.name === "Task Eight");
    const taskOne = data.all.find((t) => t.name === "Task One");

    expect(taskFive.isDone).toBe(true);
    expect(taskSix.isDone).toBe(true);
    expect(taskEight.isDone).toBe(true);
    expect(taskOne.isDone).toBe(false);
  });

  test("tasks have correct isOverdue flag", () => {
    const taskTwo = data.all.find((t) => t.name === "Task Two");
    const taskFive = data.all.find((t) => t.name === "Task Five");
    const taskOne = data.all.find((t) => t.name === "Task One");

    expect(taskTwo.isOverdue).toBe(true); // Due 2026-01-05, today is 2026-01-15
    expect(taskFive.isOverdue).toBe(false); // In Done section
    expect(taskOne.isOverdue).toBe(true); // Due 2026-01-10, today is 2026-01-15
  });
});

describe("Custom Fields", () => {
  let data;

  beforeAll(() => {
    const records = loadTestData();
    data = processRecords(records, new Date("2026-01-15"));
  });

  test("detects custom field names from CSV", () => {
    expect(data.customFieldNames).toContain("Sprint");
    expect(data.customFieldNames).toContain("Story Points");
    expect(data.customFieldNames.length).toBe(2);
  });

  test("excludes known Asana fields from customFieldNames", () => {
    expect(data.customFieldNames).not.toContain("Task ID");
    expect(data.customFieldNames).not.toContain("Name");
    expect(data.customFieldNames).not.toContain("Section/Column");
    expect(data.customFieldNames).not.toContain("Priority");
    expect(data.customFieldNames).not.toContain("Status");
  });

  test("tasks have customFields object with values", () => {
    const taskOne = data.all.find((t) => t.name === "Task One");
    expect(taskOne.customFields).not.toBeNull();
    expect(taskOne.customFields.Sprint).toBe("Sprint 1");
    expect(taskOne.customFields["Story Points"]).toBe("3");
  });

  test("handles tasks with partial custom field values", () => {
    // Task Four has Story Points but no Sprint
    const taskFour = data.all.find((t) => t.name === "Task Four");
    expect(taskFour.customFields.Sprint).toBeNull();
    expect(taskFour.customFields["Story Points"]).toBe("8");
  });

  test("handles tasks with no custom field values", () => {
    // Task Six and Task Eight have no custom field values
    const taskSix = data.all.find((t) => t.name === "Task Six");
    expect(taskSix.customFields.Sprint).toBeNull();
    expect(taskSix.customFields["Story Points"]).toBeNull();
  });

  test("returns empty customFieldNames for CSV without custom fields", () => {
    // Silence expected warnings for minimal test data
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    const recordsWithoutCustomFields = [
      { "Task ID": "1", Name: "Test", "Section/Column": "To do" },
    ];
    const result = processRecords(
      recordsWithoutCustomFields,
      new Date("2026-01-15"),
    );
    expect(result.customFieldNames).toEqual([]);

    warnSpy.mockRestore();
  });

  test("tasks have null customFields when no custom columns exist", () => {
    // Silence expected warnings for minimal test data
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    const recordsWithoutCustomFields = [
      { "Task ID": "1", Name: "Test", "Section/Column": "To do" },
    ];
    const result = processRecords(
      recordsWithoutCustomFields,
      new Date("2026-01-15"),
    );
    expect(result.all[0].customFields).toBeNull();

    warnSpy.mockRestore();
  });
});

describe("Tags, Parent Task, and Notes", () => {
  let data;

  beforeAll(() => {
    const records = loadTestData();
    data = processRecords(records, new Date("2026-01-15"));
  });

  test("parses comma-separated tags into array", () => {
    const taskOne = data.all.find((t) => t.name === "Task One");
    expect(taskOne.tags).toEqual(["Frontend", "UI"]);
  });

  test("parses single tag into array", () => {
    const taskTwo = data.all.find((t) => t.name === "Task Two");
    expect(taskTwo.tags).toEqual(["Backend"]);
  });

  test("handles empty tags as empty array", () => {
    const taskSix = data.all.find((t) => t.name === "Task Six");
    expect(taskSix.tags).toEqual([]);
  });

  test("trims whitespace from tags", () => {
    // "Frontend, UI" should become ['Frontend', 'UI'] not ['Frontend', ' UI']
    const taskOne = data.all.find((t) => t.name === "Task One");
    expect(taskOne.tags[1]).toBe("UI");
    expect(taskOne.tags[1]).not.toBe(" UI");
  });

  test("extracts parentTask when present", () => {
    const taskThree = data.all.find((t) => t.name === "Task Three");
    expect(taskThree.parentTask).toBe("Task One");
  });

  test("extracts parentTask for another subtask", () => {
    const taskSeven = data.all.find((t) => t.name === "Task Seven");
    expect(taskSeven.parentTask).toBe("Task One");
  });

  test("handles null parentTask when not present", () => {
    const taskOne = data.all.find((t) => t.name === "Task One");
    expect(taskOne.parentTask).toBeNull();
  });

  test("extracts notes when present", () => {
    const taskOne = data.all.find((t) => t.name === "Task One");
    expect(taskOne.notes).toBe("First task with important details");
  });

  test("handles empty notes as empty string", () => {
    const taskSix = data.all.find((t) => t.name === "Task Six");
    expect(taskSix.notes).toBe("");
  });

  test("subtasks without section inherit parent section", () => {
    // Subtask A has parent "Task Two" which is in "To do" section
    const subtaskA = data.all.find((t) => t.name === "Subtask A");
    expect(subtaskA.section).toBe("To do");
    expect(subtaskA.isSubtask).toBe(true);
  });

  test("subtasks inherit parent section and appear in correct column", () => {
    // Subtask B has parent "Task Two" which is in "To do" section
    const subtaskB = data.all.find((t) => t.name === "Subtask B");
    expect(subtaskB.section).toBe("To do");
    expect(subtaskB.isSubtask).toBe(true);
    // Should be grouped with its parent's section
    const toDoTasks = data.sections["To do"];
    expect(toDoTasks.some((t) => t.name === "Subtask B")).toBe(true);
  });

  test("subtasks without parent still go to Uncategorized", () => {
    // Silence expected warnings for minimal test data
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Test that tasks without section AND without parent go to Uncategorized
    const records = [
      {
        "Task ID": "99",
        Name: "Orphan Task",
        "Section/Column": "",
        "Parent task": "",
      },
    ];
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.all[0].section).toBe("Uncategorized");

    warnSpy.mockRestore();
  });

  test("subtasks appear directly after their parent task in all array", () => {
    // Subtask A and B have parent "Task Two"
    const taskTwoIndex = data.all.findIndex((t) => t.name === "Task Two");
    const subtaskAIndex = data.all.findIndex((t) => t.name === "Subtask A");
    const subtaskBIndex = data.all.findIndex((t) => t.name === "Subtask B");

    // Subtasks should come immediately after parent
    expect(subtaskAIndex).toBe(taskTwoIndex + 1);
    expect(subtaskBIndex).toBe(taskTwoIndex + 2);
  });

  test("subtasks appear directly after their parent in section array", () => {
    // In the "To do" section, subtasks should follow their parent
    const toDoTasks = data.sections["To do"];
    const taskTwoIndex = toDoTasks.findIndex((t) => t.name === "Task Two");
    const subtaskAIndex = toDoTasks.findIndex((t) => t.name === "Subtask A");
    const subtaskBIndex = toDoTasks.findIndex((t) => t.name === "Subtask B");

    expect(subtaskAIndex).toBe(taskTwoIndex + 1);
    expect(subtaskBIndex).toBe(taskTwoIndex + 2);
  });

  test("parent task with subtasks maintains relative ordering", () => {
    // Silence expected warnings for minimal test data
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Create a scenario with multiple parents and subtasks
    const records = [
      {
        "Task ID": "1",
        Name: "Parent A",
        "Section/Column": "To do",
        Priority: "High",
        "Parent task": "",
      },
      {
        "Task ID": "2",
        Name: "Sub A1",
        "Section/Column": "",
        "Parent task": "Parent A",
      },
      {
        "Task ID": "3",
        Name: "Parent B",
        "Section/Column": "To do",
        Priority: "Low",
        "Parent task": "",
      },
      {
        "Task ID": "4",
        Name: "Sub B1",
        "Section/Column": "",
        "Parent task": "Parent B",
      },
      {
        "Task ID": "5",
        Name: "Sub A2",
        "Section/Column": "",
        "Parent task": "Parent A",
      },
    ];
    const result = processRecords(records, new Date("2026-01-15"));

    // Order should be: Parent A, Sub A1, Sub A2, Parent B, Sub B1
    // (Parent A has High priority, Parent B has Low)
    const names = result.all.map((t) => t.name);
    expect(names).toEqual([
      "Parent A",
      "Sub A1",
      "Sub A2",
      "Parent B",
      "Sub B1",
    ]);

    warnSpy.mockRestore();
  });
});

describe("validateRecords", () => {
  beforeEach(() => {
    // Suppress console.warn during tests
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns warning for missing required Name field", () => {
    const records = [
      { "Task ID": "1", Name: "", "Section/Column": "To do" },
      { "Task ID": "2", Name: "Valid Task", "Section/Column": "To do" },
    ];
    const warnings = validateRecords(records);
    expect(warnings).toContain('Row 2: Missing required field "Name"');
  });

  test("returns warning for missing recommended columns", () => {
    const records = [{ "Task ID": "1", Name: "Test Task" }];
    const warnings = validateRecords(records);
    expect(warnings).toContain(
      'CSV missing recommended column "Section/Column"',
    );
    expect(warnings).toContain('CSV missing recommended column "Assignee"');
    expect(warnings).toContain('CSV missing recommended column "Due Date"');
  });

  test("returns empty array for valid records with all fields", () => {
    const records = [
      {
        Name: "Valid Task",
        "Section/Column": "To do",
        Assignee: "Alice",
        "Due Date": "2026-01-20",
      },
    ];
    const warnings = validateRecords(records);
    expect(warnings).toEqual([]);
  });

  test("returns empty array for empty records", () => {
    const warnings = validateRecords([]);
    expect(warnings).toEqual([]);
  });

  test("logs warnings to console when issues found", () => {
    const records = [{ "Task ID": "1", Name: "" }];
    validateRecords(records);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("Edge Cases", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("handles duplicate task names gracefully", () => {
    const records = [
      { Name: "Task A", "Section/Column": "To do" },
      { Name: "Task A", "Section/Column": "Done" }, // duplicate
      { Name: "Task B", "Section/Column": "To do" },
    ];
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.all.length).toBe(3);
    // Should log warning about duplicate
    expect(console.warn).toHaveBeenCalled();
  });

  test("handles all tasks on same date without NaN", () => {
    const records = [
      { Name: "Task A", "Start Date": "2026-01-15", "Due Date": "2026-01-15" },
      { Name: "Task B", "Start Date": "2026-01-15", "Due Date": "2026-01-15" },
    ];
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.timeline.length).toBe(2);
    // Timeline percentages should be valid numbers (no NaN/Infinity)
    result.timeline.forEach((task) => {
      if (task.timeline) {
        expect(Number.isFinite(task.timeline.startPercent)).toBe(true);
        expect(Number.isFinite(task.timeline.widthPercent)).toBe(true);
      }
    });
    // Project span should be at least 1 day
    expect(result.projectRange.days).toBeGreaterThanOrEqual(1);
  });

  test("handles empty CSV (zero tasks)", () => {
    const result = processRecords([], new Date("2026-01-15"));
    expect(result.all.length).toBe(0);
    expect(result.stats.total).toBe(0);
    expect(result.stats.completionPercent).toBe(0);
    expect(result.sectionNames.length).toBe(0);
  });

  test("handles all tasks in done section", () => {
    const records = [
      { Name: "Task A", "Section/Column": "Done" },
      { Name: "Task B", "Section/Column": "Completed" },
    ];
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.stats.done).toBe(2);
    expect(result.stats.total - result.stats.done).toBe(0);
    expect(result.stats.completionPercent).toBe(100);
  });

  test("handles invalid date strings gracefully", () => {
    const records = [
      { Name: "Task", "Due Date": "not-a-date", "Section/Column": "To do" },
      { Name: "Task2", "Due Date": "2026-99-99", "Section/Column": "To do" },
    ];
    // Should not throw
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.all.length).toBe(2);
    // Invalid dates should not crash isOverdue calculation
    // NaN dates are falsy, so these should not be marked overdue
  });

  test("handles fields with special characters", () => {
    const records = [
      {
        Name: "Task",
        "Section/Column": "To do",
        "Custom: Field!": 'value<>&"',
      },
    ];
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.customFieldNames).toContain("Custom: Field!");
    expect(result.all[0].customFields["Custom: Field!"]).toBe('value<>&"');
  });

  test("handles very long task names", () => {
    const longName = "A".repeat(1000);
    const records = [{ Name: longName, "Section/Column": "To do" }];
    const result = processRecords(records, new Date("2026-01-15"));
    expect(result.all[0].name).toBe(longName);
  });
});

describe("calculateDuration", () => {
  test("calculates days inclusive start exclusive end", () => {
    const today = new Date("2026-01-10");
    const result = calculateDuration("2026-01-01", "2026-01-05", today);
    expect(result.days).toBe(4); // Jan 1, 2, 3, 4 (not 5)
  });

  test("calculates elapsed days", () => {
    const today = new Date("2026-01-03");
    const result = calculateDuration("2026-01-01", "2026-01-10", today);
    expect(result.elapsed).toBe(2); // Jan 1, 2
    expect(result.percentElapsed).toBe(22); // 2/9 ≈ 22%
  });

  test("caps elapsed at duration", () => {
    const today = new Date("2026-01-20"); // past due
    const result = calculateDuration("2026-01-01", "2026-01-10", today);
    expect(result.elapsed).toBe(9);
    expect(result.percentElapsed).toBe(100);
  });

  test("returns null when no dates", () => {
    const today = new Date("2026-01-10");
    expect(calculateDuration(null, null, today)).toBeNull();
  });

  test("handles start-only tasks", () => {
    const today = new Date("2026-01-05");
    const result = calculateDuration("2026-01-01", null, today);
    expect(result.days).toBe(1); // single day
  });

  test("handles due-only tasks", () => {
    const today = new Date("2026-01-05");
    const result = calculateDuration(null, "2026-01-10", today);
    expect(result.days).toBe(1); // single day (due only = single day)
    expect(result.hasStarted).toBe(false); // today is before effective start (which is due date)
  });

  test("hasStarted is false for future tasks", () => {
    const today = new Date("2026-01-01");
    const result = calculateDuration("2026-01-10", "2026-01-20", today);
    expect(result.hasStarted).toBe(false);
    expect(result.elapsed).toBe(0);
    expect(result.percentElapsed).toBe(0);
  });

  test("hasStarted is true when today is after start", () => {
    const today = new Date("2026-01-05");
    const result = calculateDuration("2026-01-01", "2026-01-10", today);
    expect(result.hasStarted).toBe(true);
  });

  test("isComplete is true when elapsed equals duration", () => {
    const today = new Date("2026-01-15");
    const result = calculateDuration("2026-01-01", "2026-01-10", today);
    expect(result.isComplete).toBe(true);
  });

  test("remaining days calculated correctly", () => {
    const today = new Date("2026-01-05");
    const result = calculateDuration("2026-01-01", "2026-01-10", today);
    expect(result.remaining).toBe(result.days - result.elapsed);
    expect(result.remaining).toBe(5); // 9 - 4 = 5
  });

  test("remaining is zero when past due", () => {
    const today = new Date("2026-01-20");
    const result = calculateDuration("2026-01-01", "2026-01-10", today);
    expect(result.remaining).toBe(0);
  });
});
