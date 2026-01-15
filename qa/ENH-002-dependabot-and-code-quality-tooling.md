# ENH-002: Dependabot Setup

## Summary

Enable GitHub Dependabot for automated dependency updates to keep npm packages and GitHub Actions current.

## Code Quality Tooling Review

### Current Tools - No Gaps Identified

| Tool | Purpose | Coverage | Status |
|------|---------|----------|--------|
| **Biome** (`@biomejs/biome ^2.3.11`) | Linting & formatting | JS, JSON, CSS | Well-configured |
| **html-validate** (`^10.5.0`) | HTML validation | HTML output | Well-configured |
| **Jest** (`^30.2.0`) | Unit testing | JS business logic | Comprehensive |
| **GitHub Actions CI** | Automated checks | All of above | Running on push/PR |

**Assessment:** The current tooling stack is comprehensive. All code types (JS, CSS, JSON, HTML) have appropriate quality gates.

**What gets caught:**
- **JavaScript:** Dead code, unused variables, suspicious patterns, complexity issues, bad practices (340+ rules)
- **CSS:** Duplicate properties, unknown properties/units, invalid gradients/values, missing generic font names (a11y), empty blocks, shorthand conflicts ([26 rules](https://biomejs.dev/linter/css/rules/))
- **JSON:** Syntax validation, formatting consistency
- **HTML:** Invalid structure, accessibility issues, deprecated elements, missing attributes (built output validated)

### Gaps Identified

1. **Dependabot** - Automated dependency updates not configured
2. **HTML validation in CI** - `npm run validate:html` existed but wasn't in CI workflows (fixed below)

---

## HTML Validation CI Gap (Fixed)

### Problem

The `validate:html` script was defined in `package.json` but not executed in GitHub Actions workflows. This meant invalid HTML could be deployed without failing the build.

```json
// package.json - script existed but wasn't called in CI
"validate:html": "html-validate \"_site/**/*.html\""
```

### Solution

Added HTML validation step to both workflows, running after build (since it validates `_site/**/*.html`):

**`.github/workflows/ci.yml`** (line 34-35):
```yaml
      - name: Validate HTML
        run: npm run validate:html
```

**`.github/workflows/build.yml`** (line 54-55):
```yaml
      - name: Validate HTML
        run: npm run validate:html
```

### CI Pipeline Now

| Step | ci.yml | build.yml | Fails Build? |
|------|--------|-----------|--------------|
| Biome lint (JS/CSS/JSON) | ✅ | ✅ | Yes |
| Jest tests | ✅ | ✅ | Yes |
| 11ty build | ✅ | ✅ | Yes |
| HTML validation | ✅ | ✅ | Yes |

All code quality checks now run in CI and will fail the build on errors.

---

## Dependabot Implementation

### Overview

Dependabot is GitHub's built-in dependency update service that automatically creates pull requests to update dependencies. It requires no external services or tokens.

**References:**
- [Configuring Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates)
- [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)

### Recommended Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps):"
    groups:
      # Group minor and patch updates to reduce PR noise
      development:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      production:
        dependency-type: "production"
        update-types:
          - "patch"

  # GitHub Actions updates
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    labels:
      - "dependencies"
      - "ci"
    commit-message:
      prefix: "ci(deps):"
```

### Configuration Rationale

| Setting | Value | Reason |
|---------|-------|--------|
| `interval: weekly` | Monday 9am | Predictable cadence, not overwhelming |
| `open-pull-requests-limit: 5` | Max 5 PRs | Prevents PR flood |
| `groups` | dev/prod split | Reduces PR noise by bundling updates |
| `github-actions` ecosystem | Enabled | Keeps CI actions current |

### Template Repository Considerations

Since Dashana is a GitHub template repository, the `dependabot.yml` will be copied to customer repos when they use "Use this template". This means:

1. **Customers get dependency updates automatically** - Good for security
2. **Customers can customize** - They can modify or delete the file
3. **Template repo stays current** - Dashana itself gets updates

### Security Alerts

Dependabot also provides security alerts for vulnerable dependencies. These are enabled separately via:
- Repository Settings > Security > Dependabot alerts

**Recommendation:** Enable "Dependabot alerts" and "Dependabot security updates" in repository settings.

---

## Implementation Plan

### Session 1: Dependabot Setup

- [x] Create `.github/dependabot.yml` with configuration above
- [ ] Enable Dependabot alerts in repository settings (Settings > Security > Dependabot alerts)
- [ ] Enable Dependabot security updates in repository settings
- [ ] Verify Dependabot is working (check Insights > Dependency graph)
- [ ] Monitor first batch of PRs and merge as appropriate

---

## Acceptance Criteria

1. `.github/dependabot.yml` file exists with npm and github-actions ecosystems
2. Dependabot alerts enabled in repository settings
3. Dependabot security updates enabled in repository settings
4. Dependabot creates PRs for outdated dependencies (verify within 1 week)
5. Dependabot creates PRs for outdated GitHub Actions
6. Customer template repos inherit Dependabot configuration

---

## Priority

Medium - Improves security posture and reduces maintenance burden.

## Status

In Progress - Configuration file created, repository settings need manual configuration via GitHub UI.

## Related

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Biome Documentation](https://biomejs.dev/) (current JS/CSS/JSON linter)
- [html-validate Documentation](https://html-validate.org/) (current HTML validator)
