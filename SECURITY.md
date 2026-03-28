# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest release (main branch) | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly using [GitHub Security Advisories](https://github.com/matthewdeaves/dashana/security/advisories/new).

## Scope

This project is a static site generator that produces HTML dashboards from Asana CSV data. It is deployed to GitHub Pages. Security concerns include:

- Supply-chain integrity of npm dependencies and GitHub Actions
- Potential for XSS if user-controlled CSV data is rendered without sanitization
- GitHub Pages deployment pipeline integrity
