# ENH-003: Configurable Page Titles and Navigation Labels

## Summary

Add configuration options to customize page titles (browser tabs), navigation button labels, and page headings for all views. This allows customers to rebrand the interface to match their terminology (e.g., "Sprint Board" instead of "Board").

## User Request

Allow customization of:
1. **Browser tab titles** - The text shown in the browser tab
2. **Navigation button labels** - The text on header navigation links
3. **Page headings** - The main `<h2>` heading on each page

## Proposed Feature

### Configuration Options

```ini
# View Names (navigation buttons and browser tab titles)
DASHBOARD_NAME=Dashboard
BOARD_NAME=Board
TASKS_NAME=Tasks
TIMELINE_NAME=Timeline

# Page Headings (main h2 on each page)
DASHBOARD_HEADING=Project Overview
BOARD_HEADING=Kanban Board
TASKS_HEADING=Task List
TIMELINE_HEADING=Timeline
```

### Current Hardcoded Values

| Page | Browser Tab | Nav Button | Page Heading |
|------|-------------|------------|--------------|
| Dashboard | "Dashboard" (front matter) | "Dashboard" (header.njk:9) | "Project Overview" (index.njk:22) |
| Board | "Board" (front matter) | "Board" (header.njk:12) | "Kanban Board" (board.njk:16) |
| Tasks | "Tasks" (front matter) | "Tasks" (header.njk:15) | "Task List" (tasks.njk:16) |
| Timeline | "Timeline" (front matter) | "Timeline" (header.njk:18) | "Timeline" (timeline.njk:16) |

### Design Rationale

- `*_NAME` controls both nav label AND browser tab title (these typically should match)
- `*_HEADING` controls the `<h2>` page heading (can be more descriptive)
- 8 total options, organized into two logical groups
- Clear naming avoids ambiguity (previous `*_TITLE` could mean either)

## Implementation Tasks

### Session 1: Board Name and Heading (Pending)

Add `BOARD_NAME` and `BOARD_HEADING` configuration options.

**Files to modify:**

1. **src/_data/config.js**
   - Add to CONFIG_SCHEMA (after SITE_BASE, ~line 30):
     ```javascript
     BOARD_NAME: { path: "viewNames.board", type: "string" },
     BOARD_HEADING: { path: "pageHeadings.board", type: "string" },
     ```
   - Add defaults in config object (~line 112):
     ```javascript
     viewNames: {
       dashboard: "Dashboard",
       board: "Board",
       tasks: "Tasks",
       timeline: "Timeline",
     },
     pageHeadings: {
       dashboard: "Project Overview",
       board: "Kanban Board",
       tasks: "Task List",
       timeline: "Timeline",
     },
     ```

2. **src/_includes/components/header.njk:12**
   - Change from: `>Board</a>`
   - Change to: `>{{ config.viewNames.board }}</a>`

3. **src/board.njk:3**
   - Change front matter from: `title: Board`
   - Change to: `title: "{{ config.viewNames.board }}"`
   - Note: If Nunjucks in front matter doesn't work, use computed data or pass through layout

4. **src/board.njk:16**
   - Change from: `<h2>Kanban Board</h2>`
   - Change to: `<h2>{{ config.pageHeadings.board }}</h2>`

5. **dashana.config**
   - Add after SITE_BASE line (~line 4):
     ```ini
     # View Names (navigation buttons and browser tab titles)
     BOARD_NAME=Board

     # Page Headings (main h2 on each page)
     BOARD_HEADING=Kanban Board
     ```

6. **CLAUDE.md**
   - Add new section after SITE_BASE in Configuration Options

**Verification:**
- [ ] Run `npm run dev` and verify board nav shows "Board"
- [ ] Verify board browser tab shows "Board | Project Name"
- [ ] Verify board page heading shows "Kanban Board"
- [ ] Change `BOARD_NAME=Sprint Board` and `BOARD_HEADING=Current Sprint` in config
- [ ] Restart dev server and verify all three locations updated
- [ ] Run `npm test` to ensure no regressions

### Session 2: Dashboard Name and Heading (Future)

Add `DASHBOARD_NAME` and `DASHBOARD_HEADING` configuration options.

**Files to modify:**

1. **src/_data/config.js**
   - Add to CONFIG_SCHEMA:
     ```javascript
     DASHBOARD_NAME: { path: "viewNames.dashboard", type: "string" },
     DASHBOARD_HEADING: { path: "pageHeadings.dashboard", type: "string" },
     ```

2. **src/_includes/components/header.njk:9**
   - Change to: `>{{ config.viewNames.dashboard }}</a>`

3. **src/index.njk:3**
   - Update title to use config

4. **src/index.njk:22**
   - Change from: `<h2>Project Overview</h2>`
   - Change to: `<h2>{{ config.pageHeadings.dashboard }}</h2>`

5. **dashana.config**
   - Add: `DASHBOARD_NAME=Dashboard` and `DASHBOARD_HEADING=Project Overview`

6. **CLAUDE.md**
   - Add documentation for dashboard options

### Session 3: Tasks Name and Heading (Future)

Add `TASKS_NAME` and `TASKS_HEADING` configuration options.

**Files to modify:**

1. **src/_data/config.js**
   - Add to CONFIG_SCHEMA:
     ```javascript
     TASKS_NAME: { path: "viewNames.tasks", type: "string" },
     TASKS_HEADING: { path: "pageHeadings.tasks", type: "string" },
     ```

2. **src/_includes/components/header.njk:15**
   - Change to: `>{{ config.viewNames.tasks }}</a>`

3. **src/tasks.njk:3**
   - Update title to use config

4. **src/tasks.njk:16**
   - Change from: `<h2>Task List</h2>`
   - Change to: `<h2>{{ config.pageHeadings.tasks }}</h2>`

5. **dashana.config**
   - Add: `TASKS_NAME=Tasks` and `TASKS_HEADING=Task List`

6. **CLAUDE.md**
   - Add documentation for tasks options

### Session 4: Timeline Name and Heading (Future)

Add `TIMELINE_NAME` and `TIMELINE_HEADING` configuration options.

**Files to modify:**

1. **src/_data/config.js**
   - Add to CONFIG_SCHEMA:
     ```javascript
     TIMELINE_NAME: { path: "viewNames.timeline", type: "string" },
     TIMELINE_HEADING: { path: "pageHeadings.timeline", type: "string" },
     ```

2. **src/_includes/components/header.njk:18**
   - Change to: `>{{ config.viewNames.timeline }}</a>`

3. **src/timeline.njk:3**
   - Update title to use config

4. **src/timeline.njk:16**
   - Change from: `<h2>Timeline</h2>`
   - Change to: `<h2>{{ config.pageHeadings.timeline }}</h2>`

5. **dashana.config**
   - Add: `TIMELINE_NAME=Timeline` and `TIMELINE_HEADING=Timeline`

6. **CLAUDE.md**
   - Add documentation for timeline options

### Session 5: Tests and Documentation (Future)

Create dedicated test file and finalize documentation.

**New test file: tests/config-view-names.test.js**

```javascript
/**
 * View Names and Page Headings Config Tests
 *
 * Tests custom BOARD_NAME, BOARD_HEADING, etc. config options
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
```

**New fixture: tests/fixtures/config-view-names.config**

```ini
PROJECT_NAME=Test View Names
CUSTOMER_NAME=Test Customer

# Custom View Names
DASHBOARD_NAME=Home
BOARD_NAME=Sprint Board
TASKS_NAME=Backlog
TIMELINE_NAME=Roadmap

# Custom Page Headings
DASHBOARD_HEADING=Welcome Dashboard
BOARD_HEADING=Current Sprint
TASKS_HEADING=Product Backlog
TIMELINE_HEADING=Release Roadmap
```

**Update existing tests:**

1. **tests/config.test.js** - Add schema tests:
   ```javascript
   describe("CONFIG_SCHEMA", () => {
     test("has view name options", () => {
       expect(CONFIG_SCHEMA.DASHBOARD_NAME).toEqual({
         path: "viewNames.dashboard",
         type: "string",
       });
       expect(CONFIG_SCHEMA.BOARD_NAME).toEqual({
         path: "viewNames.board",
         type: "string",
       });
       expect(CONFIG_SCHEMA.TASKS_NAME).toEqual({
         path: "viewNames.tasks",
         type: "string",
       });
       expect(CONFIG_SCHEMA.TIMELINE_NAME).toEqual({
         path: "viewNames.timeline",
         type: "string",
       });
     });

     test("has page heading options", () => {
       expect(CONFIG_SCHEMA.DASHBOARD_HEADING).toEqual({
         path: "pageHeadings.dashboard",
         type: "string",
       });
       expect(CONFIG_SCHEMA.BOARD_HEADING).toEqual({
         path: "pageHeadings.board",
         type: "string",
       });
       expect(CONFIG_SCHEMA.TASKS_HEADING).toEqual({
         path: "pageHeadings.tasks",
         type: "string",
       });
       expect(CONFIG_SCHEMA.TIMELINE_HEADING).toEqual({
         path: "pageHeadings.timeline",
         type: "string",
       });
     });
   });
   ```

2. **tests/config.test.js** - Add default value tests:
   ```javascript
   test("returns default view names when config file is missing", () => {
     // ... existing setup ...
     expect(config.viewNames.dashboard).toBe("Dashboard");
     expect(config.viewNames.board).toBe("Board");
     expect(config.viewNames.tasks).toBe("Tasks");
     expect(config.viewNames.timeline).toBe("Timeline");
   });

   test("returns default page headings when config file is missing", () => {
     // ... existing setup ...
     expect(config.pageHeadings.dashboard).toBe("Project Overview");
     expect(config.pageHeadings.board).toBe("Kanban Board");
     expect(config.pageHeadings.tasks).toBe("Task List");
     expect(config.pageHeadings.timeline).toBe("Timeline");
   });
   ```

3. **tests/config-tabs.test.js** - Update nav link assertions to use config values:
   - Tests that check for hardcoded "Dashboard", "Board", etc. should account for default config values

**Verification:**
- [ ] All new tests pass with custom config values
- [ ] Existing tests still pass (backward compatible defaults)
- [ ] Test special characters in titles (quotes, ampersands)
- [ ] Test empty values fall back to defaults

### Session 6: Final Documentation (Future)

**Update CLAUDE.md Configuration section:**

```ini
# Core Settings
PROJECT_NAME=My Project
CUSTOMER_NAME=Acme Corp
SITE_BASE=              # Optional: for subdirectory deployment

# View Names (navigation buttons and browser tab titles)
DASHBOARD_NAME=Dashboard
BOARD_NAME=Board
TASKS_NAME=Tasks
TIMELINE_NAME=Timeline

# Page Headings (main h2 on each page)
DASHBOARD_HEADING=Project Overview
BOARD_HEADING=Kanban Board
TASKS_HEADING=Task List
TIMELINE_HEADING=Timeline

# Tab Visibility (all YES by default, set NO to hide)
SHOW_DASHBOARD=YES
...
```

## Acceptance Criteria

1. Each `*_NAME` config option customizes the respective nav button and browser tab title
2. Each `*_HEADING` config option customizes the respective page heading
3. Default values match current hardcoded text (backward compatible)
4. Empty config values fall back to defaults
5. Special characters in values are properly escaped in HTML output
6. All existing tests continue to pass
7. New tests verify custom values render correctly
8. `CLAUDE.md` documents all new configuration options

## Technical Notes

### Pattern Consistency

This follows the existing pattern for string config options like `PROJECT_NAME`:
- Schema entry with `type: "string"`
- Default value in nested config object
- Direct template interpolation via `{{ config.viewNames.* }}` or `{{ config.pageHeadings.* }}`

### Browser Tab Title Implementation

The `<title>` element in `base.njk` uses front matter `title` variable:
```html
<title>{{ title }} | {{ config.projectName }}</title>
```

Options for using config:
1. **Computed data** - Use 11ty computed data to set title from config
2. **Direct in template** - Override title in each page template
3. **Layout parameter** - Pass config value through layout

Recommended: Use computed data in `.eleventy.js` or page-level override.

### Test Organization

- **Unit tests** (config.test.js): Schema validation, default values, parsing
- **Rendering tests** (config-view-names.test.js): Full build with custom config, verify HTML output

## Priority

Low - Enhancement request for customer customization.

## Status

Pending - Session 1 ready for implementation.

## Related

- ENH-001: Inline notes column (established multi-session pattern)
- ENH-002: Dependabot and CI tooling
