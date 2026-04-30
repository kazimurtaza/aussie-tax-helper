# Code Review — Multi-Year Tax Support (v1.5.0)

**Date:** 2026-04-30
**Branch:** main (uncommitted changes)
**Files changed:** `README.MD`, `index.html`, `js/app.js`, `js/calculations.js`, `js/constants.js`, `js/storage.js`, `js/ui.js`

## Overview

Adds multi-financial-year support to the Aussie Tax Helper app, allowing users to switch between 2024-2025 and 2025-2026 (and future years) with independent data storage per year. Restructures layout to a 6-column grid and adds a sidebar with support/changelog panels.

### Changes by file

| File | Nature of change |
|---|---|
| `js/constants.js` | Restructured flat constants into year-keyed `TAX_CONFIG` object with `loadConstantsForYear()` |
| `js/storage.js` | Dynamic storage keys (`aussieTaxHelperData-{year}`), year detection/preference functions |
| `js/app.js` | Deferred data loading to `init()`, added year-change listener, moved `minutesToTimeString` to `ui.js` |
| `js/ui.js` | Added `populateYearSelector`, `updateFinancialYearDisplays`, `minutesToTimeString` |
| `js/calculations.js` | Changed `FINANCIAL_YEAR` to `window.FINANCIAL_YEAR` |
| `index.html` | Year dropdown selector, 6-col grid layout, dynamic year spans, PHI period label IDs, v1.5.0 changelog |
| `README.MD` | Updated docs for multi-year, 2025-2026 rates, changelog, developer notes |

---

## Issues Found

### 1. Race condition risk — constants loaded twice on startup

`js/constants.js:148` calls `loadConstantsForYear(LATEST_YEAR)` at module load time, then `app.js:29` calls it again in `init()` with `detectDefaultYear()`. Harmless but wasteful. Consider removing the boot call at the bottom of `constants.js` since `app.js` always sets the correct year during `init()`.

### 2. `minutesToTimeString` inconsistency

The function was moved from `app.js` to `ui.js` with a slight format change:

- **Old:** `padStart(2, '0')` on both hours and minutes — `"00:00"`, `"08:05"`
- **New:** no padding on hours — `"0:05"`, `"8:05"`

This is a cosmetic regression. Fix:

```js
const paddedHours = String(hours).padStart(2, '0');
return `${paddedHours}:${String(mins).padStart(2, '0')}`;
```

### 3. Placeholder 2025-2026 rates used without prominent warning to users

`js/constants.js:76-100` — Many 2025-2026 rates (tax brackets, LITO, Medicare levy, PHI) are copied from 2024-2025 with comments saying "NOT YET RELEASED". The only user-facing mention is a note in the README. If someone uses the 2025-2026 year to plan, they may get inaccurate estimates. Consider adding an in-app banner/disclaimer when a year uses placeholder rates.

### 4. `TAX_RATES_2025` global name is misleading for 2025-2026

`js/constants.js:96` — `window.TAX_RATES_2025 = c.TAX_RATES` always sets this regardless of which year is loaded. The name suggests 2024-25 only. Since `calculations.js` reads this global, it works, but it's confusing. Should be renamed to `window.TAX_RATES` or `window.CURRENT_TAX_RATES`.

### 5. No version marker in exported JSON

When exporting data, the filename includes the financial year, but the JSON content relies on `userSettings.financialYear`. A top-level `"version"` field would help with future schema migrations.

### 6. Layout change is significant

`index.html:165` — Changed from `lg:grid-cols-3` (2+1) to `lg:grid-cols-6` (1+3+2). The sidebar (support/GitHub) moved from right to left, and the changelog moved to a wider 2-col right column. Worth verifying in a browser.

### 7. Whitespace-only changes inflate the diff

Many lines have trailing whitespace stripped or indentation adjusted. This makes the actual diff harder to review. Not a bug, but a maintenance note.

---

## Suggestions

- **Remove the redundant `loadConstantsForYear(LATEST_YEAR)` call** at the bottom of `constants.js` — `app.js init()` always handles this.
- **Pad hours in `minutesToTimeString`** for consistency with the previous format.
- **Rename `window.TAX_RATES_2025`** to `window.TAX_RATES` to avoid year-specific naming that doesn't match when 2025-2026 is active.
- **Add an in-app notice** when the selected year contains placeholder/unconfirmed rates.
- **Consider adding `"version": "1.5.0"`** to exported JSON for future migration support.

---

## Security

No security concerns. All data remains in localStorage, no new external calls, and the Buy Me a Coffee / GitHub links use `target="_blank" rel="noopener noreferrer"` correctly.

---

## Verdict

The multi-year architecture is clean and the backward compatibility story is solid. The main actionable items are:

1. `minutesToTimeString` padding regression
2. Misleading `TAX_RATES_2025` global name
3. User-visible disclaimer for placeholder 2025-2026 rates
