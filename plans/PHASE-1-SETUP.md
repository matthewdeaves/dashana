# Phase 1: Project Setup

> **Goal:** Initialize the 11ty project with proper structure and base configuration.
> **Sessions:** 1
> **Prerequisites:** None

## Session Scope

| Session | Tasks | Focus |
|---------|-------|-------|
| 1-A | 1.1 - 1.5 | Full project initialization |

## Session 1-A: Project Initialization

### Task 1.1: Initialize npm Project

Create `package.json` with 11ty and required dependencies.

```json
{
  "name": "dashana",
  "version": "1.0.0",
  "description": "Asana CSV to static report website",
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy"
  },
  "dependencies": {
    "@11ty/eleventy": "^2.0.0",
    "csv-parse": "^5.5.0"
  }
}
```

**Acceptance:**
- [ ] `package.json` exists with correct scripts
- [ ] `npm install` completes without errors

---

### Task 1.2: Create Directory Structure

Create the full directory structure as defined in PLANNING.md:

```
src/
├── _includes/
│   ├── layouts/
│   └── components/
├── _data/
├── css/
```

**Acceptance:**
- [ ] All directories exist
- [ ] Structure matches PLANNING.md

---

### Task 1.3: Configure 11ty

Create `.eleventy.js` with:
- Input directory: `src`
- Output directory: `_site`
- Template formats: `njk, md`
- Passthrough copy for CSS

```javascript
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk"
  };
};
```

**Acceptance:**
- [ ] `.eleventy.js` exists with correct config
- [ ] `npm run build` creates `_site/` directory

---

### Task 1.4: Create Base Layout

Create `src/_includes/layouts/base.njk`:

```njk
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} | {{ config.projectName }}</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/print.css" media="print">
</head>
<body>
  {% include "components/header.njk" %}
  <main>
    {{ content | safe }}
  </main>
</body>
</html>
```

**Acceptance:**
- [ ] Base layout exists
- [ ] Includes CSS links
- [ ] Has header include placeholder

---

### Task 1.5: Create Placeholder Files

Create minimal placeholder files to verify the setup works:

**src/_includes/components/header.njk:**
```njk
<header>
  <h1>{{ config.projectName | default("Dashana") }}</h1>
  <nav>
    <a href="/">Dashboard</a>
    <a href="/board/">Board</a>
    <a href="/tasks/">Tasks</a>
    <a href="/timeline/">Timeline</a>
  </nav>
</header>
```

**src/css/styles.css:**
```css
/* Base styles - will be expanded in Phase 3+ */
:root {
  --color-bg: #ffffff;
  --color-text: #333333;
  --color-border: #e5e5e5;
  --color-accent: #0066cc;
}

* { box-sizing: border-box; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
}
```

**src/css/print.css:**
```css
/* Print styles - will be expanded in Phase 9 */
@media print {
  nav { display: none; }
}
```

**src/index.njk:**
```njk
---
layout: layouts/base.njk
title: Dashboard
---
<h2>Dashboard</h2>
<p>Coming soon...</p>
```

**Acceptance:**
- [ ] `npm run dev` starts server on http://localhost:8080
- [ ] Index page loads with header
- [ ] Navigation links visible
- [ ] No console errors

---

## Phase 1 Completion Checklist

- [ ] All tasks complete
- [ ] `npm run dev` shows working site
- [ ] Directory structure matches plan
- [ ] Ready for Phase 2 (Data Layer)

## How to Start This Phase

```
Read plans/PHASE-1-SETUP.md and implement session 1-A.
```
