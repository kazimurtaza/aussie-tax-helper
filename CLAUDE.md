# Aussie Tax Helper

## Overview
Client-side Australian tax deductions estimator for individuals, particularly salaried employees who work from home. Users track income, log work-related expenses, calculate depreciation, estimate tax outcomes (including Medicare Levy, Medicare Levy Surcharge, LITO, PHI offsets), and export/import data -- all stored in browser localStorage. No backend.

**Live site:** https://kazimurtaza.github.io/aussie-tax-helper/
**Repo:** https://github.com/kazimurtaza/aussie-tax-helper

## Stack
- **HTML + Tailwind CSS (CDN)** -- no build step for frontend
- **Vanilla JavaScript (ES6 IIFEs)** -- four modules loaded via `<script>` tags in `index.html`
- **Jest (v30)** -- unit tests for calculation logic only; Node 22
- **GitHub Pages** -- static deployment from `main` branch root
- **GitHub Actions** -- two workflows: `test.yml` (PRs and non-main pushes) and `static.yml` (main pushes, runs tests then deploys)

## Commands
```bash
npm install            # Install Jest (only dev dependency)
npm test              # Run Jest with coverage report
npm run test:watch    # Jest watch mode
```
No build or bundler step. Open `index.html` directly in a browser or use a local live server.

## Architecture
```
index.html              # Single-page app: all HTML, inline CSS, script tags
js/
  constants.js         # ATO tax rates/thresholds per financial year (year-keyed TAX_CONFIG)
  calculations.js      # TaxCalculations IIFE -- pure calculation functions
  storage.js           # StorageManager IIFE -- localStorage CRUD, data migration, import/export
  ui.js                # UIManager IIFE -- DOM manipulation, modals, form rendering
  app.js               # App IIFE -- event wiring, orchestration, state management
tests/
  calculations.test.js # 205 Jest tests (>90% coverage on calculations.js + constants.js)
.github/workflows/
  test.yml             # CI: runs tests on PRs and non-main pushes
  static.yml           # CD: tests then deploys to GitHub Pages on main push
```

**Data flow:** `constants.js` sets `window.*` globals -> `calculations.js` reads them -> `app.js` calls `StorageManager.loadData()` -> `UIManager.refreshUI()` -> user interacts -> `app.js` updates state -> `StorageManager.saveData()`.

**Multi-year support:** Storage keys are `aussieTaxHelperData-{endYear}` (e.g. `aussieTaxHelperData-2025` for FY 2024-25). `loadConstantsForYear(year)` swaps all window globals. Adding a new FY only requires adding a key to `TAX_CONFIG` in `constants.js`.

## Conventions
- **Module pattern:** Each JS file is an IIFE exposing a single global object (`TaxCalculations`, `StorageManager`, `UIManager`, `App`). No ES modules, no import/export.
- **State:** `appData` object in `app.js` is the single source of truth. Structure defined by `StorageManager.getDefaultData()`.
- **Window globals:** Tax constants are set on `window` by `loadConstantsForYear()`. Test suite uses `global.window = global` to simulate browser.
- **CSS:** Tailwind classes in HTML + a small `<style>` block in `index.html` for animations, modals, and form styling overrides. No separate CSS file.
- **Testing:** Jest tests in `tests/calculations.test.js`. Tests require source files via `require()` (not ES imports). Coverage is enforced: 90% lines/functions, 80% branches.
- **Accessibility:** Modals for confirmations (not `alert`/`confirm`). Focus styles on inputs. Semantic HTML with `<fieldset>`/`<legend>`.
- **HTML escaping:** `escapeHtml()` in `calculations.js` (exported as `TaxCalculations.escapeHtml`) is used for all user-supplied text in table rendering. Event handlers use `addEventListener` — no inline `onclick`.
- **No console.log in production:** Debug logging is removed before commits.

## Environment
- **Node.js:** v22 (used in CI and locally for tests)
- **Browser:** Modern browsers only (no polyfills). App runs entirely client-side.
- **No environment variables or config files required.**
- **No build tools, no bundler, no framework.**
- **Storage:** All user data in `localStorage` (browser-only). No server, no database.

## Git Workflow
- **main branch:** Protected. Pushes to main trigger tests + deploy to GitHub Pages.
- **Feature branches:** Tests run on every PR and non-main push via `test.yml`.
- **PRs:** Must pass tests before merge (deploy workflow gates on test job).
- **Version bumps:** Manual update of version in `package.json` and changelog in `index.html` sidebar.
- **Adding a new financial year:** Add a new key to `TAX_CONFIG` in `js/constants.js`. No other files need changes -- `AVAILABLE_YEARS` is auto-generated.
