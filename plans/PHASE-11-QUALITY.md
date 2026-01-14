# Phase 11: Code Quality & Security Hardening

> **Status:** 🔵 NOT STARTED
> **Goal:** Address remaining code review findings, add security hardening, improve test coverage, and run additional code quality tools.
> **Sessions:** 5
> **Prerequisites:** Phase 10 complete
> **Created:** 2026-01-14

---

## Executive Summary

This phase addresses findings from the January 2026 code review that were NOT covered in Phase 10:

| Issue | Severity | Session |
|-------|----------|---------|
| XSS/CSV injection vulnerability | **HIGH** | 11-A |
| Subtask inheritance relies on name uniqueness | **HIGH** | 11-B |
| Timeline division by zero | **MEDIUM** | 11-B |
| Config parser anti-pattern (47 if-statements) | **MEDIUM** | 11-C |
| O(n²) subtask grouping performance | **LOW** | 11-C |
| Missing test coverage for edge cases | **MEDIUM** | 11-D |
| Test verification & cleanup | **MEDIUM** | 11-D |
| Additional code quality tools | **LOW** | 11-E |

---

## Code Quality Tools Available

The project already has these tools configured:

```bash
# Linting (Biome - 20x faster than ESLint)
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Formatting (Biome)
npm run format        # Format all JS files

# Testing (Jest)
npm test              # Run unit + view tests
npm run test:watch    # Watch mode
npm run test:integration  # Integration tests

# Build
npm run build         # Production build
npm run dev           # Dev server
```

**Additional tools to consider adding (Session 11-E):**
- `html-validate` - Validate generated HTML for accessibility/standards
- `stylelint` - CSS linting (optional)

---

## Session 11-A: Security Hardening (XSS Prevention)

### Background

**Problem:** Task names, notes, and custom fields from CSV are rendered without HTML escaping in templates. If the Asana CSV contains HTML or JavaScript, it will execute.

**Affected files:**
- `src/tasks.njk:47` - `{{ task.name }}`
- `src/_includes/components/task-card.njk:54` - `{{ task.customFields[fieldName] }}`
- `src/board.njk` - task display
- `src/timeline.njk` - task display

**Risk:** CSV injection / XSS attack if malicious content in Asana export.

**Note:** Nunjucks auto-escapes by default with `{{ }}`. The `| safe` filter bypasses escaping. We need to verify auto-escaping is working and audit all `| safe` uses.

---

### Task 11.1: Audit Template Escaping

Review all templates for proper escaping:

1. **Verify Nunjucks autoescape is enabled** (default in 11ty)
2. **Audit all `| safe` filter usage** - ensure only used for trusted content
3. **Check dynamic attribute values** - `class="{{ value }}"` may need escaping

**Files to audit:**
```
src/index.njk
src/board.njk
src/tasks.njk
src/timeline.njk
src/versions.njk
src/_includes/layouts/base.njk
src/_includes/components/*.njk
```

**Acceptance:**
- [ ] Document all `| safe` usages and verify they're safe
- [ ] Verify `{{ task.name }}` etc. auto-escape HTML characters
- [ ] Add test: task name with `<script>alert('xss')</script>` renders as text

**Decision checkpoint after completing Task 11.1:**
- If auto-escaping is working correctly → Skip Task 11.3, proceed to Task 11.2 (tests only)
- If escaping gaps found → Implement Task 11.3 before Task 11.2

---

### Task 11.2: Add XSS Test Cases

Add tests to `tests/views.test.js`:

```javascript
describe('XSS Prevention', () => {
  test('task names with HTML are escaped', async () => {
    // Create test CSV with malicious content
    const testData = `Name,Section/Column
"<script>alert('xss')</script>",To do
"<img src=x onerror=alert('xss')>",To do`;

    // Build with test data and verify HTML is escaped
    // Check output contains &lt;script&gt; not <script>
  });

  test('custom field values with HTML are escaped', async () => {
    // Similar test for custom fields
  });
});
```

**Acceptance:**
- [ ] XSS test cases added and passing
- [ ] Malicious HTML in task names renders as escaped text
- [ ] No `<script>` tags execute in generated HTML

---

### Task 11.3: Sanitize High-Risk Fields

If auto-escaping isn't sufficient, add explicit sanitization in `tasks.js`:

```javascript
/**
 * Sanitize string to prevent XSS in case template escaping fails
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

**Only use if:** Template auto-escaping is found to be disabled or inconsistent.

**Acceptance:**
- [ ] Decide if explicit sanitization needed (may not be if Nunjucks escapes)
- [ ] If added, apply to task.name, task.notes, task.customFields values
- [ ] Tests pass

---

## Session 11-B: Data Integrity Fixes

### Task 11.4: Handle Duplicate Task Names

**Problem:** `tasks.js:133-169` uses `taskSectionMap[record.Name]` which overwrites if two tasks have the same name, causing subtasks to inherit wrong section.

**Current code:**
```javascript
taskSectionMap[record.Name] = record["Section/Column"];
```

**Solution:** Use task ID or composite key, and warn on duplicates:

```javascript
// Build map with warning for duplicates
const taskSectionMap = {};
const duplicateNames = new Set();

records.forEach((record, index) => {
  const name = record.Name;
  if (name) {
    if (taskSectionMap[name] !== undefined) {
      duplicateNames.add(name);
    }
    // Store row index to disambiguate (first occurrence wins)
    if (taskSectionMap[name] === undefined) {
      taskSectionMap[name] = record["Section/Column"];
    }
  }
});

if (duplicateNames.size > 0) {
  console.warn(`CSV contains ${duplicateNames.size} duplicate task name(s). Subtask section inheritance may be incorrect for:`,
    Array.from(duplicateNames).slice(0, 5).join(', '));
}
```

**Acceptance:**
- [ ] Duplicate task names logged as warning
- [ ] First occurrence's section is used (deterministic)
- [ ] Add test: duplicate task names don't crash, warning logged
- [ ] `npm test` passes

---

### Task 11.5: Fix Timeline Division by Zero

**Problem:** `tasks.js:310-315` - if all tasks are on the same date, `projectSpan = 0` causes division by Infinity/NaN.

**Current code:**
```javascript
startPercent = (startOffset / projectSpan) * 100;
widthPercent = (taskDuration / projectSpan) * 100;
```

**Solution:** Guard against zero span:

```javascript
// Ensure minimum span of 1 day to prevent division by zero
const projectSpan = Math.max(1, projectEnd - projectStart);

// Also clamp results
startPercent = Math.min(100, Math.max(0, (startOffset / projectSpan) * 100));
widthPercent = Math.min(100, Math.max(0, (taskDuration / projectSpan) * 100));
```

**Acceptance:**
- [ ] No NaN/Infinity in timeline calculations
- [ ] Add test: all tasks on same date doesn't crash
- [ ] Timeline renders sensibly for single-day projects

---

### Task 11.6: Add Data Validation Tests

Add tests to `tests/data-processing.test.js`:

```javascript
describe('Edge Cases', () => {
  test('handles duplicate task names gracefully', () => {
    const records = [
      { Name: 'Task A', 'Section/Column': 'To do' },
      { Name: 'Task A', 'Section/Column': 'Done' }, // duplicate
      { Name: 'Task B', 'Section/Column': 'To do' }
    ];
    const result = processRecords(records);
    expect(result.all.length).toBe(3);
    // Should not throw
  });

  test('handles all tasks on same date', () => {
    const records = [
      { Name: 'Task A', 'Due Date': '2026-01-15' },
      { Name: 'Task B', 'Due Date': '2026-01-15' }
    ];
    const result = processRecords(records, new Date('2026-01-15'));
    expect(result.timeline.length).toBe(2);
    // Timeline percentages should be valid numbers
    result.timeline.forEach(task => {
      expect(Number.isFinite(task.timeline?.startPercent ?? 0)).toBe(true);
      expect(Number.isFinite(task.timeline?.widthPercent ?? 0)).toBe(true);
    });
  });

  test('handles empty CSV (zero tasks)', () => {
    const result = processRecords([]);
    expect(result.all.length).toBe(0);
    expect(result.stats.total).toBe(0);
    expect(result.stats.completionPercent).toBe(0);
  });

  test('handles all tasks in done section', () => {
    const records = [
      { Name: 'Task A', 'Section/Column': 'Done' },
      { Name: 'Task B', 'Section/Column': 'Completed' }
    ];
    const result = processRecords(records);
    expect(result.stats.done).toBe(2);
    expect(result.stats.open).toBe(0);
    expect(result.stats.completionPercent).toBe(100);
  });
});
```

**Acceptance:**
- [ ] Edge case tests added
- [ ] All tests pass
- [ ] No crashes on unusual input

---

## Session 11-C: Code Refactoring

### Task 11.7: Refactor Config Parser

**Problem:** `config.js:74-161` has 47 sequential if-statements instead of a configuration schema map.

**Current anti-pattern:**
```javascript
if (key === 'SHOW_DASHBOARD') config.tabs.dashboard = parseYesNo(value);
if (key === 'SHOW_BOARD') config.tabs.board = parseYesNo(value);
// ... 45 more if statements
```

**Refactored approach:**

```javascript
// Configuration schema - maps config keys to nested paths
const CONFIG_SCHEMA = {
  // Core settings (string values)
  PROJECT_NAME: { path: 'projectName', type: 'string' },
  CUSTOMER_NAME: { path: 'customerName', type: 'string' },
  SITE_BASE: { path: 'siteBase', type: 'string' },

  // Tab visibility (boolean values)
  SHOW_DASHBOARD: { path: 'tabs.dashboard', type: 'boolean' },
  SHOW_BOARD: { path: 'tabs.board', type: 'boolean' },
  SHOW_TASKS: { path: 'tabs.tasks', type: 'boolean' },
  SHOW_TIMELINE: { path: 'tabs.timeline', type: 'boolean' },

  // Tasks columns
  TASKS_COL_NAME: { path: 'tasksColumns.name', type: 'boolean' },
  TASKS_COL_PROGRESS: { path: 'tasksColumns.progress', type: 'boolean' },
  // ... etc
};

/**
 * Set a nested property value using dot notation path
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// In the parsing loop:
content.split('\n').forEach(line => {
  // ... parse key/value ...

  const schema = CONFIG_SCHEMA[key];
  if (schema) {
    const parsedValue = schema.type === 'boolean'
      ? parseYesNo(value)
      : value;
    setNestedValue(config, schema.path, parsedValue);
  }
});
```

**Benefits:**
- Adding new config options: add one line to schema
- Type validation centralized
- Self-documenting configuration structure
- Easier to test and maintain

**Acceptance:**
- [ ] Config parser refactored to use schema map
- [ ] All existing config options still work
- [ ] `npm test` passes (config tests)
- [ ] Adding new config option requires only schema change

---

### Task 11.8: Optimize Subtask Grouping Performance

**Problem:** `tasks.js:249-256` has O(n²) complexity:

```javascript
// Current: Creates new Set for every section, filters array for every task
for (const section of sectionNames) {
  const taskNamesInSection = new Set(
    tasks.filter(t => t.section === section).map(t => t.name)
  );
  // ...
}
```

**Optimized approach:**

```javascript
// Build section-to-tasks map once: O(n)
const tasksBySection = {};
for (const task of tasks) {
  const section = task.section || 'Uncategorized';
  if (!tasksBySection[section]) {
    tasksBySection[section] = [];
  }
  tasksBySection[section].push(task);
}

// Build parent-to-section map once: O(n)
const parentSectionMap = {};
for (const task of tasks) {
  if (!task.isSubtask) {
    parentSectionMap[task.name] = task.section;
  }
}

// Now grouping is O(1) per task
for (const task of tasks) {
  if (task.isSubtask && task.parentTask) {
    task.section = parentSectionMap[task.parentTask] || task.section;
  }
}
```

**Impact:** For 100 tasks across 5 sections:
- Before: ~500 array iterations (O(n*s))
- After: ~100 map operations (O(n))

**Acceptance:**
- [ ] Subtask grouping refactored to use pre-built maps
- [ ] No functional change in output
- [ ] `npm test` passes
- [ ] Large CSV files process faster (manual verification)

---

## Session 11-D: Test Coverage Improvements

### Task 11.9: Verify Tests & Clean Up Warnings

**Current state:** All 206 tests passing (verified 2026-01-14). Coverage: 87.82% statements, 81.32% branches.

**Steps:**
1. Run `npm test` and verify all tests pass
2. Review any console warnings in test output
3. Suppress or fix spurious warnings (e.g., "config not found" in tests that don't need config)
4. Ensure test output is clean and readable

**Acceptance:**
- [ ] `npm test` shows 0 failures
- [ ] No tests skipped or commented out
- [ ] Console warnings reviewed and addressed where appropriate

---

### Task 11.10: Add Missing Edge Case Tests

Add tests for scenarios not currently covered:

**data-processing.test.js:**
```javascript
describe('Date Validation', () => {
  test('handles invalid date strings gracefully', () => {
    const records = [
      { Name: 'Task', 'Due Date': 'not-a-date' },
      { Name: 'Task2', 'Due Date': '2026-99-99' }
    ];
    const result = processRecords(records);
    // Should not crash, invalid dates treated as no date
    expect(result.all.length).toBe(2);
  });
});

describe('Custom Fields', () => {
  test('handles fields with special characters', () => {
    const records = [
      { 'Name': 'Task', 'Section/Column': 'To do', 'Custom: Field!': 'value' }
    ];
    const result = processRecords(records);
    expect(result.customFieldNames).toContain('Custom: Field!');
  });
});
```

**config.test.js:**
```javascript
test('handles config value with equals sign', () => {
  // PROJECT_NAME=Test=Project=Name should work
});

test('handles very long config values', () => {
  // 1000+ character project name
});
```

**Acceptance:**
- [ ] Edge case tests added for date validation
- [ ] Edge case tests added for custom fields
- [ ] Edge case tests added for config parsing
- [ ] All tests pass

---

### Task 11.11: Add Integration Test Data Independence

**Problem:** `tests/integration.test.js:52-54` hardcodes expected values:

```javascript
expect(records.length).toBe(20);
```

**Solution:** Make tests data-driven:

```javascript
// Instead of hardcoded values, verify data consistency
test('CSV has valid structure', () => {
  expect(records.length).toBeGreaterThan(0);
  records.forEach(record => {
    expect(record.Name).toBeDefined();
    expect(typeof record.Name).toBe('string');
  });
});

test('all sections have at least one task', () => {
  const sectionNames = [...new Set(records.map(r => r['Section/Column']))];
  sectionNames.forEach(section => {
    const count = records.filter(r => r['Section/Column'] === section).length;
    expect(count).toBeGreaterThan(0);
  });
});
```

**Acceptance:**
- [ ] Integration tests don't fail when CSV row count changes
- [ ] Tests verify structure and consistency, not exact values
- [ ] `npm run test:integration` passes

---

## Session 11-E: Additional Code Quality Tools

### Task 11.12: Add HTML Validation

Install and configure `html-validate` for checking generated HTML:

```bash
npm install --save-dev html-validate
```

Add script to `package.json`:
```json
{
  "scripts": {
    "validate:html": "html-validate \"_site/**/*.html\""
  }
}
```

Create `.htmlvalidate.json`:
```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "no-inline-style": "off",
    "require-sri": "off"
  }
}
```

**Acceptance:**
- [ ] `html-validate` installed
- [ ] `npm run validate:html` runs after build
- [ ] Fix any critical HTML validation errors
- [ ] Add to CI pipeline (optional)

---

### Task 11.13: Add Pre-commit Hook (Optional)

Add Husky for pre-commit linting:

```bash
npm install --save-dev husky
npx husky init
echo "npm run lint" > .husky/pre-commit
```

**Acceptance:**
- [ ] `husky` installed (optional)
- [ ] Pre-commit hook runs lint
- [ ] Commits blocked if lint fails

---

### Task 11.14: Document & Enforce Code Coverage

**Current state (verified 2026-01-14):**
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statements | 87.82% | >80% | ✅ |
| Branches | 81.32% | >70% | ✅ |
| Functions | 97.95% | >80% | ✅ |
| Lines | 89.13% | >80% | ✅ |

Coverage already exceeds targets. This task focuses on making coverage easily accessible and optionally enforcing it.

**Steps:**

1. Add coverage script to `package.json`:
```json
{
  "scripts": {
    "test:coverage": "jest --coverage --testPathIgnorePatterns=integration"
  }
}
```

2. Add coverage directory to `.gitignore`:
```
coverage/
```

3. (Optional) Add coverage thresholds to `jest.config.js` to prevent regressions:
```javascript
coverageThreshold: {
  global: {
    statements: 80,
    branches: 70,
    functions: 80,
    lines: 80
  }
}
```

**Acceptance:**
- [ ] `npm run test:coverage` generates report
- [ ] Coverage directory excluded from git
- [ ] (Optional) Coverage thresholds enforced in Jest config

---

## Phase 11 Completion Checklist

**Session 11-A (Security):**
- [ ] Template escaping audited
- [ ] XSS test cases added and passing
- [ ] No unescaped user content in HTML output

**Session 11-B (Data Integrity):**
- [ ] Duplicate task name warning implemented
- [ ] Division by zero fixed in timeline
- [ ] Edge case tests added

**Session 11-C (Refactoring):**
- [ ] Config parser uses schema map
- [ ] Subtask grouping optimized to O(n)
- [ ] All tests pass after refactoring

**Session 11-D (Test Coverage):**
- [ ] All tests passing, warnings cleaned up
- [ ] Edge case tests added
- [ ] Integration tests data-independent

**Session 11-E (Tools):**
- [ ] HTML validation added
- [ ] Coverage report available
- [ ] Pre-commit hook added (optional)

**Final Verification:**
```bash
npm run lint           # Should pass
npm test               # Should pass (206+ tests, 0 failures)
npm run build          # Should succeed
npm run validate:html  # Should pass (after build)
npm run test:coverage  # Should show >80% coverage (currently ~88%)
```

---

## How to Start This Phase

### Session 11-A (Security Hardening)
```
Read plans/PHASE-11-QUALITY.md and implement session 11-A.
```

### Session 11-B (Data Integrity)
```
/clear
Read plans/PHASE-11-QUALITY.md and implement session 11-B.
```

### Session 11-C (Code Refactoring)
```
/clear
Read plans/PHASE-11-QUALITY.md and implement session 11-C.
```

### Session 11-D (Test Coverage)
```
/clear
Read plans/PHASE-11-QUALITY.md and implement session 11-D.
```

### Session 11-E (Additional Tools)
```
/clear
Read plans/PHASE-11-QUALITY.md and implement session 11-E.
```

---

## Reference: Code Review Findings

This phase addresses findings from the January 2026 code review not covered in Phase 10:

| Finding | Severity | Phase 10 | Phase 11 |
|---------|----------|----------|----------|
| CSV injection / XSS | HIGH | Not addressed | 11-A |
| Date timezone bugs | HIGH | ✅ Fixed | - |
| Subtask name uniqueness | HIGH | Not addressed | 11-B |
| Config anti-pattern | MEDIUM | Not addressed | 11-C |
| Timeline div/zero | MEDIUM | Not addressed | 11-B |
| O(n²) performance | LOW | Not addressed | 11-C |
| Missing edge case tests | MEDIUM | Not addressed | 11-D |
| Test cleanup & warnings | MEDIUM | Tests now pass | 11-D |
| HTML validation | LOW | Mentioned | 11-E |

---

## Files to Modify

| File | Session | Changes |
|------|---------|---------|
| `src/_data/tasks.js` | 11-B, 11-C | Duplicate warning, div/zero fix, optimization |
| `src/_data/config.js` | 11-C | Refactor to schema map |
| `tests/data-processing.test.js` | 11-B, 11-D | Edge case tests |
| `tests/views.test.js` | 11-A, 11-D | XSS tests, fix failures |
| `tests/integration.test.js` | 11-D | Data-independent tests |
| `package.json` | 11-E | Add validate:html, test:coverage |
| `.htmlvalidate.json` | 11-E | New - HTML validation config |
