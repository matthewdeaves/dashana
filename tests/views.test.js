const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cheerio = require('cheerio');

const FIXTURE_CSV = path.join(__dirname, 'fixtures/test-project.csv');
const PRODUCTION_CSV = path.join(__dirname, '../data/project.csv');
const BACKUP_CSV = path.join(__dirname, 'fixtures/production-backup.csv');

// Swap fixture data in, build, then restore production data
beforeAll(() => {
  // Backup production CSV
  if (fs.existsSync(PRODUCTION_CSV)) {
    fs.copyFileSync(PRODUCTION_CSV, BACKUP_CSV);
  }

  // Copy fixture to data folder
  fs.copyFileSync(FIXTURE_CSV, PRODUCTION_CSV);

  // Build site with fixture data
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
});

afterAll(() => {
  // Restore production CSV and rebuild site
  if (fs.existsSync(BACKUP_CSV)) {
    fs.copyFileSync(BACKUP_CSV, PRODUCTION_CSV);
    fs.unlinkSync(BACKUP_CSV);
    // Rebuild with original data so _site/ reflects production
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  }
});

function loadPage(pagePath) {
  const filePath = path.join(__dirname, '../_site', pagePath);
  const html = fs.readFileSync(filePath, 'utf-8');
  return cheerio.load(html);
}

/*
 * Test fixture contains 8 tasks:
 * - Task One: To do, Alice, High, On track, due 2026-01-10, Sprint 1, 3 pts
 * - Task Two: To do, Bob, Medium, At risk, due 2026-01-05, Sprint 1, 5 pts
 * - Task Three: In Progress, Alice, Low, On track, due 2026-01-08, Sprint 2, 2 pts
 * - Task Four: In Progress, unassigned, High, Off track, no due, no sprint, 8 pts
 * - Task Five: Done, Bob, no priority, On track, due 2026-01-03, Sprint 1, no pts
 * - Task Six: Done, unassigned, no priority, no status, no sprint, no pts
 * - Task Seven: To do, unassigned, no priority, no status, Sprint 2, 1 pt
 * - Task Eight: Completed, Alice, Medium, no status, no sprint, no pts
 *
 * Sections: To do (3), In Progress (2), Done (2), Completed (1)
 * Done tasks: 3 (Task Five, Task Six, Task Eight)
 * Status: On track (3), At risk (1), Off track (1), No status (3)
 * Priority: High (2), Medium (2), Low (1), No priority (3)
 * Assignees: Alice (3), Bob (2), Unassigned (3)
 * Custom Fields: Sprint (Sprint 1: 3, Sprint 2: 2, empty: 3), Story Points (has value: 5, empty: 3)
 */

describe('Dashboard View', () => {
  let $;

  beforeAll(() => {
    $ = loadPage('index.html');
  });

  test('displays correct total task count', () => {
    const subtitle = $('.dashboard-subtitle').text();
    expect(subtitle).toContain('8 total tasks');
  });

  test('displays correct completion stats', () => {
    const percent = $('.completion-percent').text();
    const detail = $('.completion-detail').text();
    expect(percent).toBe('38%'); // 3/8 = 37.5% rounds to 38%
    expect(detail).toBe('3 of 8 done');
  });

  test('displays all sections with correct counts', () => {
    const sections = [];
    $('.metric-sections .section-item').each((i, el) => {
      const name = $(el).find('.section-name').text();
      const count = parseInt($(el).find('.section-count').text());
      sections.push({ name, count });
    });

    expect(sections).toContainEqual({ name: 'To do', count: 3 });
    expect(sections).toContainEqual({ name: 'In Progress', count: 2 });
    expect(sections).toContainEqual({ name: 'Done', count: 2 });
    expect(sections).toContainEqual({ name: 'Completed', count: 1 });

    const total = sections.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBe(8);
  });

  test('displays all statuses with correct counts including "No status"', () => {
    const statuses = [];
    $('.metric-status .status-item').each((i, el) => {
      const name = $(el).find('.status-name').text();
      const count = parseInt($(el).find('.status-count').text());
      statuses.push({ name, count });
    });

    expect(statuses).toContainEqual({ name: 'On track', count: 3 });
    expect(statuses).toContainEqual({ name: 'At risk', count: 1 });
    expect(statuses).toContainEqual({ name: 'Off track', count: 1 });
    expect(statuses).toContainEqual({ name: 'No status', count: 3 });

    const total = statuses.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBe(8);
  });

  test('displays all priorities with correct counts including "No priority"', () => {
    const priorities = [];
    $('.metric-priority .priority-item').each((i, el) => {
      const name = $(el).find('.priority-name').text();
      const count = parseInt($(el).find('.priority-count').text());
      priorities.push({ name, count });
    });

    expect(priorities).toContainEqual({ name: 'High', count: 2 });
    expect(priorities).toContainEqual({ name: 'Medium', count: 2 });
    expect(priorities).toContainEqual({ name: 'Low', count: 1 });
    expect(priorities).toContainEqual({ name: 'No priority', count: 3 });

    const total = priorities.reduce((sum, p) => sum + p.count, 0);
    expect(total).toBe(8);
  });

  test('displays all assignees with correct counts', () => {
    const assignees = [];
    $('.metric-assignees .assignee-item').each((i, el) => {
      const name = $(el).find('.assignee-name').text();
      const count = parseInt($(el).find('.assignee-count').text());
      assignees.push({ name, count });
    });

    expect(assignees).toContainEqual({ name: 'Alice', count: 3 });
    expect(assignees).toContainEqual({ name: 'Bob', count: 2 });
    expect(assignees).toContainEqual({ name: 'Unassigned', count: 3 });

    const total = assignees.reduce((sum, a) => sum + a.count, 0);
    expect(total).toBe(8);
  });

  test('displays overdue count', () => {
    const count = $('.overdue-count').text().trim();
    // Overdue depends on "today" date used during build
    // Just verify it's a number
    expect(parseInt(count)).toBeGreaterThanOrEqual(0);
  });
});

describe('Board View', () => {
  let $;

  beforeAll(() => {
    $ = loadPage('board/index.html');
  });

  test('displays correct total in subtitle', () => {
    const subtitle = $('.page-subtitle').text();
    expect(subtitle).toContain('8 tasks');
  });

  test('has all 4 columns', () => {
    const columns = $('.board-column').length;
    expect(columns).toBe(4);
  });

  test('displays all 8 task cards', () => {
    const cards = $('.task-card').length;
    expect(cards).toBe(8);
  });

  test('each task has a completion label', () => {
    const labels = $('.completion-label').length;
    expect(labels).toBe(8);
  });

  test('done tasks have "Done" completion label', () => {
    const doneLabels = $('.completion-done').length;
    expect(doneLabels).toBe(3); // 3 tasks in Done/Completed sections
  });

  test('open tasks have "Open" completion label', () => {
    const openLabels = $('.completion-open').length;
    expect(openLabels).toBe(5); // 5 tasks not in Done/Completed sections
  });

  test('columns show progress counts', () => {
    const progressTexts = [];
    $('.column-progress').each((i, el) => {
      progressTexts.push($(el).text().trim());
    });

    // Each column should show "X/Y complete" format
    progressTexts.forEach(text => {
      expect(text).toMatch(/\d+\/\d+ complete/);
    });
  });

  test('task cards in To do section are not marked done', () => {
    const todoColumn = $('.board-column').first();
    const doneCards = todoColumn.find('.task-card.is-done').length;
    expect(doneCards).toBe(0);
  });

  test('task cards in Done section are marked done', () => {
    // Find the Done column by looking for column title
    let doneColumn;
    $('.board-column').each((i, el) => {
      if ($(el).find('.column-title').text() === 'Done') {
        doneColumn = $(el);
      }
    });

    const doneCards = doneColumn.find('.task-card.is-done').length;
    expect(doneCards).toBe(2); // 2 tasks in Done section
  });
});

describe('Tasks View', () => {
  let $;

  beforeAll(() => {
    $ = loadPage('tasks/index.html');
  });

  test('displays correct total in subtitle', () => {
    const subtitle = $('.page-subtitle').text();
    expect(subtitle).toContain('8 tasks');
  });

  test('has all 8 task rows', () => {
    const rows = $('.task-table tbody tr').length;
    expect(rows).toBe(8);
  });

  test('each row has a completion label in its own column', () => {
    const labels = $('.task-table .col-completion .completion-label').length;
    expect(labels).toBe(8);
  });

  test('done tasks have "Done" completion label', () => {
    const doneLabels = $('.task-table .col-completion .completion-done').length;
    expect(doneLabels).toBe(3);
  });

  test('done rows have row-done class', () => {
    const doneRows = $('.task-table .row-done').length;
    expect(doneRows).toBe(3);
  });

  test('has correct table headers', () => {
    const headers = [];
    $('.task-table th').each((i, el) => {
      headers.push($(el).text().trim());
    });

    expect(headers).toContain('Name');
    expect(headers).toContain('Section');
    expect(headers).toContain('Assignee');
    expect(headers).toContain('Due Date');
    expect(headers).toContain('Priority');
    expect(headers).toContain('Status');
  });
});

describe('Timeline View', () => {
  let $;

  beforeAll(() => {
    $ = loadPage('timeline/index.html');
  });

  test('displays correct total in subtitle', () => {
    const subtitle = $('.page-subtitle').text();
    expect(subtitle).toContain('8 tasks');
  });

  test('has all 8 task rows', () => {
    const rows = $('.timeline-table tbody tr').length;
    expect(rows).toBe(8);
  });

  test('each row has a completion label in its own column', () => {
    const labels = $('.timeline-table .col-completion .completion-label').length;
    expect(labels).toBe(8);
  });

  test('done tasks have "Done" completion label', () => {
    const doneLabels = $('.timeline-table .col-completion .completion-done').length;
    expect(doneLabels).toBe(3);
  });

  test('tasks without dates show "No dates" label', () => {
    const noDateLabels = $('.no-dates-label').length;
    // 3 tasks without dates: Task Four, Task Six, Task Seven, Task Eight
    expect(noDateLabels).toBe(4);
  });

  test('tasks with dates have timeline bars', () => {
    const timelineBars = $('.timeline-bar').length;
    // 4 tasks with dates: Task One, Two, Three, Five
    expect(timelineBars).toBe(4);
  });

  test('has correct table headers', () => {
    const headers = [];
    $('.timeline-table th').each((i, el) => {
      headers.push($(el).text().trim());
    });

    expect(headers).toContain('Task');
    expect(headers).toContain('Start');
    expect(headers).toContain('Due');
    expect(headers).toContain('Duration');
    expect(headers).toContain('Status');
  });
});

describe('Theme Toggle', () => {
  let $;

  beforeAll(() => {
    $ = loadPage('index.html');
  });

  test('has theme toggle button', () => {
    const toggle = $('#theme-toggle');
    expect(toggle.length).toBe(1);
  });

  test('has light and dark labels', () => {
    const lightLabel = $('.theme-icon-light').text();
    const darkLabel = $('.theme-icon-dark').text();
    expect(lightLabel).toBe('Light');
    expect(darkLabel).toBe('Dark');
  });

  test('has theme initialization script in head', () => {
    const headScripts = $('head script').text();
    expect(headScripts).toContain('localStorage');
    expect(headScripts).toContain('theme');
  });

  test('has theme toggle script in body', () => {
    const bodyScripts = $('body script').text();
    expect(bodyScripts).toContain('theme-toggle');
    expect(bodyScripts).toContain('classList');
  });
});

describe('Cross-View Consistency', () => {
  let dashboard, board, tasks, timeline;

  beforeAll(() => {
    dashboard = loadPage('index.html');
    board = loadPage('board/index.html');
    tasks = loadPage('tasks/index.html');
    timeline = loadPage('timeline/index.html');
  });

  test('all views show the same total task count', () => {
    const dashboardTotal = dashboard('.dashboard-subtitle').text().match(/(\d+) total/)?.[1];
    const boardTotal = board('.page-subtitle').text().match(/(\d+) tasks/)?.[1];
    const tasksTotal = tasks('.page-subtitle').text().match(/(\d+) tasks/)?.[1];
    const timelineTotal = timeline('.page-subtitle').text().match(/(\d+) tasks/)?.[1];

    expect(dashboardTotal).toBe('8');
    expect(boardTotal).toBe('8');
    expect(tasksTotal).toBe('8');
    expect(timelineTotal).toBe('8');
  });

  test('all views have same number of task elements', () => {
    const boardCards = board('.task-card').length;
    const tasksRows = tasks('.task-table tbody tr').length;
    const timelineRows = timeline('.timeline-table tbody tr').length;

    expect(boardCards).toBe(8);
    expect(tasksRows).toBe(8);
    expect(timelineRows).toBe(8);
  });

  test('all views have same number of done tasks', () => {
    const boardDone = board('.task-card.is-done').length;
    const tasksDone = tasks('.row-done').length;
    const timelineDone = timeline('.row-done').length;

    expect(boardDone).toBe(3);
    expect(tasksDone).toBe(3);
    expect(timelineDone).toBe(3);
  });
});

/*
 * Custom Fields in Test Fixture:
 * - Sprint: Sprint 1 (Tasks 1,2,5), Sprint 2 (Tasks 3,7), empty (Tasks 4,6,8)
 * - Story Points: 3 (Task 1), 5 (Task 2), 2 (Task 3), 8 (Task 4), 1 (Task 7), empty (Tasks 5,6,8)
 */
describe('Custom Fields', () => {
  describe('Tasks Table', () => {
    let $;

    beforeAll(() => {
      $ = loadPage('tasks/index.html');
    });

    test('has custom field column headers', () => {
      const headers = [];
      $('.task-table th').each((i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain('Sprint');
      expect(headers).toContain('Story Points');
    });

    test('displays custom field values in table cells', () => {
      const sprintValues = [];
      $('.task-table tbody tr').each((i, el) => {
        const customCells = $(el).find('.col-custom');
        if (customCells.length >= 1) {
          sprintValues.push($(customCells[0]).text().trim());
        }
      });

      expect(sprintValues).toContain('Sprint 1');
      expect(sprintValues).toContain('Sprint 2');
    });

    test('displays dash for empty custom field values', () => {
      const html = $('.task-table').html();
      // Tasks without values should show —
      expect(html).toContain('—');
    });
  });

  describe('Board Cards', () => {
    let $;

    beforeAll(() => {
      $ = loadPage('board/index.html');
    });

    test('task cards display custom fields when present', () => {
      const customFieldSections = $('.card-custom-fields').length;
      // Only cards with at least one custom field value should have this section
      expect(customFieldSections).toBeGreaterThan(0);
    });

    test('custom field values are displayed', () => {
      const html = $('.board').html();
      expect(html).toContain('Sprint 1');
      expect(html).toContain('Story Points');
    });
  });

  describe('Timeline Table', () => {
    let $;

    beforeAll(() => {
      $ = loadPage('timeline/index.html');
    });

    test('has custom field column headers', () => {
      const headers = [];
      $('.timeline-table th').each((i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain('Sprint');
      expect(headers).toContain('Story Points');
    });

    test('displays custom field values in timeline rows', () => {
      const html = $('.timeline-table').html();
      expect(html).toContain('Sprint 1');
      expect(html).toContain('Sprint 2');
    });
  });
});

/*
 * Tags, Parent Task, and Notes in Test Fixture:
 * - Tags: Frontend,UI (Task 1), Backend (Task 2), Frontend,Backend (Task 3), Completed (Task 5), Planning (Task 7)
 * - Parent Task: Task One (Tasks 3,7)
 * - Notes: Various tasks have notes, Task Six has none
 */
describe('Tags, Parent Task, and Notes', () => {
  describe('Tasks Table', () => {
    let $;

    beforeAll(() => {
      $ = loadPage('tasks/index.html');
    });

    test('has Tags, Parent, and Notes column headers', () => {
      const headers = [];
      $('.task-table th').each((i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain('Tags');
      expect(headers).toContain('Parent');
      expect(headers).toContain('Notes');
    });

    test('displays tag badges', () => {
      const tagBadges = $('.task-table .tag-badge').length;
      expect(tagBadges).toBeGreaterThan(0);
    });

    test('displays specific tag values', () => {
      const html = $('.task-table').html();
      expect(html).toContain('Frontend');
      expect(html).toContain('Backend');
    });

    test('displays parent task references', () => {
      const parentRefs = $('.task-table .parent-ref').length;
      expect(parentRefs).toBeGreaterThan(0);
    });

    test('displays notes preview', () => {
      const notesPreviews = $('.task-table .notes-preview').length;
      expect(notesPreviews).toBeGreaterThan(0);
    });
  });

  describe('Board Cards', () => {
    let $;

    beforeAll(() => {
      $ = loadPage('board/index.html');
    });

    test('displays tag badges on cards', () => {
      const cardTags = $('.card-tags').length;
      expect(cardTags).toBeGreaterThan(0);
    });

    test('displays parent task reference on cards', () => {
      const cardParents = $('.card-parent').length;
      expect(cardParents).toBeGreaterThan(0);
    });

    test('displays notes icon on cards with notes', () => {
      const notesIcons = $('.card-notes-icon').length;
      expect(notesIcons).toBeGreaterThan(0);
    });
  });

  describe('Timeline Table', () => {
    let $;

    beforeAll(() => {
      $ = loadPage('timeline/index.html');
    });

    test('has Tags and Parent column headers', () => {
      const headers = [];
      $('.timeline-table th').each((i, el) => {
        headers.push($(el).text().trim());
      });

      expect(headers).toContain('Tags');
      expect(headers).toContain('Parent');
    });

    test('displays tag badges in timeline', () => {
      const tagBadges = $('.timeline-table .tag-badge').length;
      expect(tagBadges).toBeGreaterThan(0);
    });

    test('displays notes icon in task name', () => {
      const html = $('.timeline-table').html();
      expect(html).toContain('📝');
    });
  });
});
