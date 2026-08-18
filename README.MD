# Aussie Tax Deductions Helper

<p align="center">
  <a href="https://www.buymeacoffee.com/kazimurtaza" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
  </a>
</p>

<p align="center">
  <strong>A comprehensive, client-side tax management application designed for Australian individuals to track income, manage expenses, and estimate their tax outcomes, with a strong focus on Work-From-Home (WFH) deductions.</strong>
</p>

<p align="center">
  <a href="https://kazimurtaza.github.io/aussie-tax-helper/"><strong>Live Demo »</strong></a>
</p>

<p align="center">
  <img src="https://github.com/kazimurtaza/aussie-tax-helper/actions/workflows/static.yml/badge.svg" alt="Deploy Static Content to Pages">
  &nbsp;
  <img src="https://github.com/kazimurtaza/aussie-tax-helper/actions/workflows/test.yml/badge.svg" alt="Unit Tests">
</p>

## Table of Contents

- [Overview & Goals](#overview--goals)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Tax Rate & Threshold Constants](#tax-rate--threshold-constants)
- [Data Storage & Security](#data-storage--security)
- [Changelog](#changelog)
- [Disclaimer](#disclaimer)

## Overview & Goals

This application is designed for Australian individuals, particularly salaried employees, who work from home or purchase work-related items. The primary goals are to:

* **Calculate & Claim Deductions:** Accurately calculate and claim all relevant work-related deductions, with a focus on WFH expenses using both the **ATO Fixed Rate** and **Actual Cost** methods.
* **Estimate Tax Outcome:** Assist users in estimating their potential tax refund or payable amount from the Australian Taxation Office (ATO).
* **Record-Keeping:** Provide a robust system for keeping records of income, expenses, and supporting documentation, all stored locally in the user's browser.
* **Multi-Year Support:** Seamlessly manage tax data across multiple financial years, with automatic year detection and independent data storage for each year.

**Target Tax Jurisdiction:** Australia (ATO guidelines for the 2024-2025 and 2025-2026 Financial Years).

## Features

* **Income Management:**
    * Add multiple PAYG income statements (gross salary, tax withheld).
    * Track other income sources like bank interest and dividends.
* **Expense Tracking:**
    * Log general work-related expenses with categories (e.g., Self-Education, Tools of Trade).
    * Manage depreciable assets with **Prime Cost** and **Diminishing Value** depreciation methods.
* **Work-From-Home (WFH) Calculations:**
    * Compare deduction outcomes between the **ATO Fixed Rate Method** (70 cents per hour) and the **Actual Cost Method**.
    * Log WFH hours manually or import them via a CSV file.
* **Tax Estimation Engine:**
    * Calculates taxable income based on ATO tax rates for the selected financial year.
    * Applies common tax offsets like the Low Income Tax Offset (LITO) and the Private Health Insurance offset.
    * **Year Selector:** Switch between financial years (2024-2025, 2025-2026) with independent data storage for each year.
* **Data Management:**
    * **Local Storage:** All data is stored exclusively in your browser. No data is sent to a server.
    * **Import/Export:** Securely back up your data by exporting it to a JSON or CSV file, and restore it at any time.

## Technology Stack

* **HTML:** For the structure of the application.
* **Tailwind CSS:** For a modern, responsive user interface.
* **JavaScript (Vanilla JS):** For all application logic, calculations, and DOM manipulation, organized into ES6 modules.

## Getting Started

To get a local copy up and running, follow these simple steps.

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/kazimurtaza/aussie-tax-helper.git
    ```
2.  **Navigate to the directory:**
    ```sh
    cd aussie-tax-helper
    ```
3.  **Open `index.html` in your browser.**
    You can simply open the file directly, or use a live server extension if you have one installed in your code editor.

### Running the Test Suite

The project includes a Jest unit test suite covering all tax calculation logic with >90% code coverage.

```sh
npm install        # install Jest (dev dependency only)
npm test           # run tests with coverage report
npm run test:watch # watch mode for development
```

Tests are also run automatically by GitHub Actions on every pull request and push (see `.github/workflows/test.yml`).

## Tax Rate & Threshold Constants

All core tax calculation parameters are stored in `js/constants.js` using a year-keyed configuration structure. This centralizes the key ATO rates and thresholds, making them easy to review and update annually. The application supports multiple financial years (2024-2025, 2025-2026, 2026-2027) with automatic rate switching based on the selected year.

Below are the key constants for the **2024-2025** baseline, with the **2025-2026** and **2026-2027** changes summarised further down.

### Income Tax Rates (2024-2025)
These are the legislated "Stage 3" tax rates, effective from 1 July 2024.
*Source: [ATO - Changes to individual income tax rates](https://www.ato.gov.au/about-ato/new-legislation/in-detail/personal-tax/changes-to-individual-income-tax-rates)*

| Taxable Income | Tax on this Income |
| :--- | :--- |
| $0 – $18,200 | Nil |
| $18,201 – $45,000 | 16c for each $1 over $18,200 |
| $45,001 – $135,000 | $4,288 + 30c for each $1 over $45,000 |
| $135,001 – $190,000 | $31,288 + 37c for each $1 over $135,000 |
| $190,001 and over | $51,638 + 45c for each $1 over $190,000 |

### Low Income Tax Offset (LITO)
* **Maximum Offset:** `$700`
* **Threshold 1 (Full Offset):** Up to `$37,500`
* **Threshold 2 (Phase-out starts):** Above `$37,500` (reduces by 5c for every $1)
* **Threshold 3 (Phase-out increases):** Above `$45,000` (reduces by 1.5c for every $1)
* **Ineligible:** Above `$66,667`

### Medicare Levy
* **Standard Rate:** `2%` of taxable income.
* **Low-income thresholds are indexed annually and stored per financial year** (see `MEDICARE_THRESHOLDS_*` in `js/constants.js`):

| | 2024-25 | 2025-26 |
| :--- | :--- | :--- |
| Single threshold / phase-in upper | $27,222 / $34,027 | $28,011 / $35,013 |
| Family threshold / phase-in upper | $45,907 / $57,383 | $47,238 / $59,047 |
| Per dependent child (lower / upper) | +$4,216 / +$5,270 | +$4,338 / +$5,423 |

* The family threshold increases per dependent child; the phase-in upper limit increases by 1.25× that amount per child.
* 2026-27 thresholds are announced in the 2027 Budget — the app carries the 2025-26 values forward until then.
*Sources: Treasury Laws Amendment (More Cost of Living Relief) Act 2025; March 2026 Federal Budget (retroactive to 1 July 2025); ATO Medicare levy reduction pages*

### Medicare Levy Surcharge (MLS)
An additional levy for higher-income earners without private hospital cover.
* **Base Income Threshold (Singles):** `$97,000`
* **Base Income Threshold (Families):** `$194,000` (increases by $1,500 for each dependent child after the first)
* **Surcharge Rates:** `1%`, `1.25%`, or `1.5%` depending on the income tier.

### Private Health Insurance (PHI) Rebate
A government contribution to help cover the cost of private health insurance. The rebate amount is income-tested and age-based.

### Work-From-Home (WFH) Fixed Rate
* **Rate for 2024-2025 through 2026-2027:** `70 cents per hour` (ATO confirmed unchanged). This rate covers electricity, gas, internet, phone, stationery, and computer consumables.
*Source: [ATO - Fixed rate method](https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-deductions/fixed-rate-method-work-from-home-expenses)*

### 2025-2026 Updates

The following ATO rates have been updated for the 2025-2026 financial year:

#### Medicare Levy Surcharge (MLS) - 2025-2026
* **Base Income Threshold (Singles):** `$101,000` (increased from $97,000)
* **Base Income Threshold (Families):** `$202,000` (increased from $194,000)
* **Child Adjustment:** `$1,500` for each dependent child after the first (unchanged)
* **Surcharge Rates:** `1%`, `1.25%`, or `1.5%` depending on the income tier (unchanged)

#### Medicare Levy — 2025-2026
* **Low-income thresholds raised** by the March 2026 Budget, retroactive to 1 July 2025: single `$28,011` (phase-in to `$35,013`), family `$47,238` (phase-in to `$59,047`), `+$4,338` per dependent child.

All other 2025-2026 rates — income tax brackets, LITO, and PHI rebate rates — are confirmed from official ATO sources and coded in `js/constants.js`. PHI rebate rates are updated for both 2025-26 periods (1 July 2025 – 31 March 2026 and 1 April 2026 – 30 June 2026) per Dept of Health PHI Circulars 21/25 and 12/26.

### 2026-2027 Updates

* **Income tax:** the `16%` bracket rate drops to `15%` from 1 July 2026 (legislated); bracket bases rebased to `$4,020` / `$31,020` / `$51,370`.
* **MLS thresholds (indexed):** singles `$105,000` / `$123,000` / `$164,000`; families `$210,000` / `$246,000` / `$328,000`.
* **PHI rebate:** the 1 April 2026 rates carry into 1 July 2026 – 31 March 2027; the 1 April 2027 – 30 June 2027 period is a placeholder until the 2027 rebate adjustment factor is announced (~February 2027).
* **Medicare low-income thresholds:** carried forward from 2025-26 pending the 2027 Budget.
* **Not yet implemented:** the `$1,000` standard work-related expenses deduction (first claimable in 2026-27 returns) is planned as a separate feature.

## Data Storage & Security

* **Storage Method:** All data is stored exclusively in the **user's browser local storage** with separate storage keys for each financial year (`aussieTaxHelperData-2025`, `aussieTaxHelperData-2026`, etc.). The application does not have a backend and does not store any user data on external servers.
* **Multi-Year Isolation:** Each financial year maintains completely independent data. Switching years preserves all data for each year, and data operations (save, clear, export) only affect the active year.
* **Security:** Users are informed that clearing their browser data will permanently delete their stored information. Regular data export is recommended for backup purposes.
* **Privacy:** The app does not handle or store Tax File Numbers (TFNs).

## Changelog

### Version 1.10.0
* ***Fixed***
    * ***Identical-assets warning on services:*** The $300 immediate-deduction test is a *depreciating asset* rule; a software subscription is a service consumed as paid, so it is deductible in full with no threshold. The warning previously fired on eleven Claude.AI Pro subscriptions ($374) and two Max subscriptions ($304.50). Items can now be tagged `assetType` Equipment (default) / Service / Consumable on all three entry forms; only equipment-class items participate in the $300 grouping. Stored data without the field behaves identically (a migration stamps it idempotently), and both CSV tables gain an Asset Type column.
* ***Added***
    * ***Cross-year consistency audit:*** Storage is per financial year, so a depreciating asset must be re-entered each year it declines in value — and nothing verified the copies agreed. `auditCrossYearAssets` reports same-description items whose cost, date, depreciable flag, effective life or method differ between years, or that live in different lists. Shown as a red "records disagree" card on the summary; JSON exports carry a top-level `crossYearAudit` array and CSV a "Cross-Year Asset Consistency" block. Report-only.
    * ***Written-down value in the schedule:*** Each depreciation row now reads `2025-26: $259.60 (opening $389.39 → closing $129.80)` at full cost basis — the number an accountant carries forward — alongside the work-share claim, pro-rata note and current-year bolding, which are unchanged.
    * ***Same-day set notice:*** The second limb of s 40-80(2): items bought the same day that together cost more than $300 *might* form a set and lose the immediate deduction. Surfaced as a question in its own slate card (distinct from the identical-assets warning), with services/consumables excluded and identical-description groups left to the strong warning.
* ***Improved***
    * ***PHI own-share guidance:*** The private health insurance inputs now state they take your own share from your own statement — each adult beneficiary receives a separate statement, and entering household totals distorts the rebate offset (a real error that invented a $13.63 liability). 354 Jest tests (up from 332).

### Version 1.9.0
* ***Added***
    * ***Occupancy expenses:*** Each WFH property period can record rent or mortgage interest, apportioned by the existing floor-area ratio into the actual-cost deduction. Opt-in field with an ATO caution — occupancy costs are only deductible for employees in limited circumstances.
    * ***Identical-assets review:*** The ATO excludes an asset from the ≤$300 immediate deduction when it is one of a number of identical or substantially identical assets started to hold in the year that together cost more than $300. The app now detects such groups across both expense lists, shows an amber review card on the summary page (included in the printable report), and flags them in CSV and JSON exports. Detection only — nothing is reclassified.
    * ***Effective-life guidance:*** All three effective-life inputs list the ATO's common determinations (computers and computer equipment 4 years; laptops, tablets and other portable computers 2 years; mainframe and network equipment 5 years) with a link to the ATO page.
* ***Fixed***
    * ***Prior-year items claimed again every year:*** Immediate (non-depreciable) deductions had no financial-year start bound — a $1,000 item dated 2024-07-01 claimed in full in FY 2024-25, again in 2025-26, and again in 2026-27. Immediate claims are now confined to the acquisition financial year; depreciable items keep spanning years via the depreciation schedule. WFH assets additionally gained the missing upper bound (future-dated items no longer claim early). A depreciable-flagged item with a zero/blank effective life — which the engine writes off immediately — is bounded the same way, and the effective-life forms now require 1 year or more. On-screen table rows, per-item CSV rows and the section totals all apply one shared rule, so rows always sum to their totals.
    * ***Depreciation schedule at 0% work-use:*** An asset saved with an explicit 0% work-use claimed $0 but rendered a schedule as though it were 100%. The schedule and the claim now agree.
    * ***Depreciable work-% fallback:*** A depreciable item saved without a work-use percentage silently claimed 0% instead of the documented fallback (100% for WFH assets). Both deduction branches now share one work-% normalisation rule (explicit 0 survives, blank/invalid takes the fallback, values clamped to 0–100) with the form boundary.
    * ***Offsets reconciliation:*** "Total Offsets" summed the LITO entitlement, but LITO is non-refundable and capped at gross income tax — the summary rows didn't add up to net tax. LITO is now shown as applied, and gross + Medicare + MLS − total offsets equals net tax payable exactly.
    * ***Negative net tax displayed as $0:*** The screen clamped a negative net tax payable while the export carried the true value — the same label showed two numbers. Both now show the true negative (refundable offsets exceeding tax increase the refund).
    * ***Negative PHI offset styled as a benefit:*** An over-claimed private health insurance rebate is a liability but rendered green. It now renders red with an "(amount owing)" label, as does a negative offset total.
    * ***Malformed dates and lives:*** An expense without a valid date threw and broke the whole summary (now contributes $0); impossible dates such as 31 June or 29 February in a non-leap year no longer roll into the wrong financial year; a fractional or non-numeric effective life can no longer produce NaN or a blank schedule.
    * ***CSV export year correctness & formula injection:*** Each exported year's per-item "Deduction This FY" is now computed under that year's rates (an all-years export previously evaluated depreciable rows under the year you were viewing), and CSV cells are guarded against spreadsheet formula injection (a description starting with `=`, `+`, `-` or `@` is exported as inert text).
* ***Improved***
    * ***One depreciation engine:*** The claim calculation and the displayed schedule now share a single implementation of the decline-in-value maths, verified behaviour-preserving by exhaustive parity (720 scenarios × 3 years, exact match; schedule strings byte-identical) and a 30-case agreement test matrix.
    * ***Shared year/predicate helpers:*** `dateInFinancialYear` bounds item dates identically in totals and CSV exports; `withYearConstants` swaps year tax constants and restores them safely during export; storage keys use one parse/format pair. 332 Jest tests (up from 250).

### Version 1.8.0
* ***Added***
    * ***Calculated Tax Summary in exports:*** Both CSV and JSON exports now include the app's computed figures per financial year — assessable income, tax withheld, deduction totals (general / WFH / super), taxable income, gross tax, Medicare levy, MLS, each offset, net tax payable, and the estimated refund or amount owing. Each year's summary is computed under that year's tax constants. CSV places it at the top of each year block; JSON carries a `calculatedSummaries` object (ignored on import and regenerated from raw data).
    * ***Per-item deductions in CSV:*** General expense and WFH asset rows gain a "Deduction This FY ($)" column showing the amount actually claimable this year (depreciation-aware, date-filtered).
* ***Fixed***
    * ***WFH asset 0% work-use:*** An explicit 0% is no longer coerced to 100% in the WFH asset deduction calculation.
* ***Improved***
    * ***Single calculation path:*** The summary page and exports share `TaxCalculations.calculateYearSummary`, guaranteeing exported figures match the on-screen summary. 250 Jest tests (up from 243).

### Version 1.7.0
* ***Added***
    * ***FY 2026-27 support:*** New `TAX_CONFIG` entry with the legislated 15% bracket (down from 16% from 1 July 2026), indexed MLS thresholds ($105k/$123k/$164k singles, $210k/$246k/$328k families), PHI rebate periods, and the confirmed 70c/hr WFH fixed rate. Year selector, storage keys, and default-year detection pick it up automatically.
    * ***Test suite:*** 243 Jest tests (up from 205) covering the new year, corrected thresholds, and regressions.
* ***Fixed***
    * ***2025-26 Medicare levy thresholds:*** Updated per the March 2026 Budget, retroactive to 1 July 2025 (single $28,011/$35,013, family $47,238/$59,047, +$4,338 per child). The 2024-25 figures were previously applied to both years; thresholds now live in per-year config blocks.
    * ***Family phase-in upper limit:*** The per-child adjustment on the upper phase-in threshold now scales by 1.25× the lower adjustment ($5,270 in 2024-25, $5,423 in 2025-26). Families with children inside the phase-in band were previously overcharged the flat 2% levy.
    * ***PHI rebate tiering:*** Now shares the MLS tier logic — the dependent-child threshold adjustment applies, and fractional incomes at tier boundaries no longer fall back to the base (most generous) rebate rate.
    * ***Refundable offsets:*** LITO no longer offsets the Medicare levy (non-refundable, income tax only); franking credits and the PHI offset are fully refundable and can increase the refund. An over-claimed PHI rebate is now counted as a liability instead of being ignored.
    * ***Prime-cost depreciation:*** Stops once an asset is fully written off — prior-year assets no longer generate deductions forever, and the claimed amount now matches the displayed schedule.
    * ***Work-use percentage:*** An explicit 0% is preserved instead of being coerced to 100%.
* ***Improved***
    * ***Export/import round-trip:*** Export All Years includes stored data for years this version can't display yet, and import notifies when such a year is saved.
    * ***Constants hygiene:*** Tax-free threshold derived from the active year's bracket table; Medicare exemption pro-rata uses actual days in the financial year; stale `window.TAX_RATES_2025` global renamed to `window.TAX_RATES`.

### Version 1.6.0
* ***Fixed***
    * ***Leap-year depreciation:*** Pro-rata calculations use actual days in the financial year (366 for leap FYs) instead of a hardcoded 365.
    * ***XSS hardening:*** User-supplied text in tables is HTML-escaped; inline `onclick` handlers replaced with `addEventListener`.
    * ***Robustness:*** `calculatePhiOffset` null guard, CSV import duplicate-date skip, internet work % clamped to 0–100, storage migration guard for malformed data.
* ***Improved***
    * ***Import pipeline:*** Per-year migration and full merge pipeline on import; legacy single-year imports validate the financial year; export warns about corrupted years; fractional work percentages preserved.
* ***Chore:*** Jest upgraded from v29 to v30; 205-test suite.

### Version 1.5.4
* ***Fixed***
    * ***XSS guard in depreciation schedule:*** Added `escapeHtml` helper; asset dates are validated before schedule generation (invalid dates return `"Invalid date"` rather than producing NaN output).
    * ***Date validation:*** `calculateDepreciationForFinancialYear` now rejects `null`, `undefined`, and non-string dates up-front, preventing silent NaN propagation.
    * ***Removed debug logs:*** Three `[DEBUG]` `console.log` statements in the WFH asset removal flow removed.
    * ***Numeric input clamping:*** Cost, work-percentage, and effective-life values in expense and WFH-asset forms are clamped to valid ranges (`≥ 0`; work % capped at 100) in the save handlers, preventing negative values from bypassing browser-side `min` attributes.
    * ***CSV date range guard:*** WFH hours CSV import now rejects dates outside 2000–2100 with a console warning, preventing absurd dates (e.g. `2999-12-31`) from entering the log.
    * ***Duplicate WFH date handling:*** Manually logging hours for an already-logged date now accumulates minutes on the existing entry rather than creating a duplicate row (consistent with CSV import behaviour).
    * ***Improved import error messages:*** JSON import now distinguishes `SyntaxError` (shows the specific parse error) from structural validation failures (lists expected fields), and `localStorage` save errors distinguish quota-exceeded from other failures.
* ***Improved***
    * ***Storage / UI decoupling:*** `StorageManager` no longer references `UIManager` directly. All notifications go through a configurable `_notify` callback (default: `UIManager.showNotification`), overridable via `StorageManager.setNotifyCallback(fn)` — enabling unit testing without a DOM.
    * ***Active year defaults to current Australian FY:*** `detectDefaultYear()` now derives the current FY from `new Date()` (Jul–Jun boundary) and prefers it over saved preferences from previous tax seasons.
    * ***Year selector shows "(current)":*** The financial-year dropdown appends `(current)` to whichever year matches today's Australian FY.
* ***Added***
    * ***Move expenses between sections:*** "→ WFH" button on general expenses and "→ General" button on WFH assets allow moving entries between sections in one click.
    * ***All-years export/import:*** JSON and CSV exports now include data for all financial years; import detects the v2 multi-year format and restores each year's data independently.
    * ***Test suite:*** 202 Jest tests (up from 190) — added multi-property WFH, date-validation, and depreciation-schedule-invalid-date suites.

### Version 1.5.3
* ***Added***
    * ***Multi-property WFH Actual Cost:*** Users who move mid-year can now add a separate property period for each address, each with its own floor area, running expenses, and date range. The total deduction sums all periods automatically. Existing single-property data migrates transparently on first load.
* ***Improved***
    * ***Depreciation schedule display:*** Year labels changed from Y1/Y2 to financial year labels (e.g. 2024-25, 2025-26). The current FY row is bolded. Partial-year entries show a pro-rata note (e.g. "330/365 days · 100% DV/yr") making it clear why the first year's deduction is reduced.
    * ***Residual year visibility:*** Assets with effectiveLife=1 purchased mid-year now show the residual carry-forward year in the schedule column, so the Y2 balance is visible without switching financial years.
    * ***Test suite:*** 190 Jest tests (up from 187), including schedule FY-label and current-year highlight assertions.

### Version 1.5.2
* ***Fixed***
    * ***Critical — DV carry-forward overclaim:*** Diminishing value depreciation in year 2+ was massively overclaiming for mid-year purchases (e.g. Pixel Tablet: $479 claimed instead of $6.56). The prior-year opening value now correctly pro-rates the acquisition FY before rolling forward, matching ATO methodology.
    * ***DV effectiveLife=1 Y1 cap:*** Assets with a 1-year effective life were claiming 200% of written-down value in Y1 (e.g. $435 GPU showed $784). Capped at 100%.
    * ***Test suite:*** 187 Jest tests with carry-forward regression tests using real asset data.

### Version 1.5.1
* ***Fixed***
    * ***Critical — Medicare Levy family thresholds:*** Corrected stale 2023-24 values (`$40,939`/`$51,174`, child adj `$3,760`) to the legislated 2024-25/2025-26 values (`$45,907`/`$57,383`, child adj `$4,216`) per the Treasury Laws Amendment (More Cost of Living Relief) Act 2025. Families with 2 dependent children and ~$50k income were incorrectly charged ~$154 in levy under the old values.
    * ***High — PHI rebate period keys hardcoded:*** `calculatePhiOffset` was referencing 2024-25 period key strings directly, returning wrong rates for 2025-26. Keys are now resolved dynamically from `Object.keys(...).sort()`, making the function year-agnostic.
    * ***High — 2025-26 PHI rebate rates:*** Updated Period 1 (`2025-07-01_2026-03-31`) and Period 2 (`2026-04-01_2026-06-30`) rates to correct values per Dept of Health PHI Circulars 21/25 and 12/26.
    * ***Medium — 2025-26 MLS tier caps:*** Corrected single Tier 1 cap (`$117,000` → `$118,000`), Tier 2 cap (`$155,000` → `$158,000`); family Tier 1 cap (`$234,000` → `$236,000`), Tier 2 cap (`$310,000` → `$316,000`).
* ***Added***
    * ***Unit test suite:*** 183 Jest tests covering all calculation functions with >99% statement coverage and >92% branch coverage. Tests include regression cases for each data bug fix.
    * ***CI/CD test pipeline:*** GitHub Actions now runs the test suite on every pull request and non-main branch push (`.github/workflows/test.yml`). The deployment workflow (`static.yml`) is gated behind tests passing.

### Version 1.5.0
* ***🚀 Added***
    * ***Multi-Year Support:*** The application now supports multiple financial years with a year selector dropdown in the header. Users can switch between 2024-2025 and 2025-2026 (and future years) with independent data storage for each year.
    * ***Automatic Year Detection:*** The app automatically detects and loads the most appropriate year on startup: saved preference → most recent year with data → latest available year.
    * ***2025-2026 Tax Rates:*** Added complete tax configuration for the 2025-2026 financial year, including updated MLS thresholds ($101,000 for singles, $202,000 for families).
    * ***Dynamic PHI Period Labels:*** Private Health Insurance period labels now update automatically based on the selected financial year.
* ***Refactored***
    * ***constants.js:*** Completely restructured with a year-keyed `TAX_CONFIG` object for easier maintenance and future year additions. Added `loadConstantsForYear()` function for dynamic constant loading.
    * ***storage.js:*** Implemented dynamic storage key generation (`aussieTaxHelperData-{year}`) and year detection functions (`getYearsWithData()`, `detectDefaultYear()`, `saveActiveYearPreference()`).
    * ***app.js:*** Deferred data loading to `init()` phase to support year detection before loading. Added year change event listener.
    * ***ui.js:*** Added `populateYearSelector()`, `updateFinancialYearDisplays()`, and `minutesToTimeString()` functions.
    * ***index.html:*** Replaced static year displays with dynamic dropdown selector and year display spans.
* ***Improved***
    * ***Data Isolation:*** Each financial year maintains completely independent data. Switching years preserves all data for each year.
    * ***Import/Export:*** JSON imports now automatically switch to the year specified in the imported file. Export filenames include the current financial year.
    * ***Clear Data:*** The clear data operation now only affects the active financial year, preserving data in other years.
* ***Backward Compatible***
    * ***Storage Keys:*** Existing storage key format is preserved (`aussieTaxHelperData-2025` for 2024-2025).
    * ***Data Migrations:*** All existing data migrations (PHI premiums, WFH hours) continue to work.
    * ***Alias Maintained:*** `window.TAX_RATES_2025` alias preserved for calculations compatibility.

### Version 1.4.1
* ***Fixed***
    * ***Updated*** `js/constants.js` with a new `PHI_REBATE_RATES_PERIODS` object to hold the dual rates.
    * ***Modified*** `js/storage.js` to split the PHI premium data into two fields: `phiPremiumsPaid_period1` and `phiPremiumsPaid_period2`.
    * ***Updated*** `index.html` to include two separate input fields for the different premium periods.
    * ***Updated*** Rewrote the `calculatePhiOffset` function in `js/calculations.js` to handle the dual-rate logic.
    * ***Added*** backward compatibility in `js/storage.js` to automatically migrate data for users upgrading from older versions.
    * ***Fixed*** a bug in the CSV export function to include the new dual-period premium data.
    * ***Refactored:*** Centralized the depreciation schedule generation logic into a single reusable function to eliminate code duplication and improve maintainability.
    * ***Fixed:*** Corrected a critical bug where the Medicare Levy for families was being calculated using the incorrect singles threshold. The calculation now accurately reflects family and dependent children adjustments.
    * ***Improved:*** The Work-From-Home (WFH) fixed rate displayed in the UI is now dynamically populated from the central constants file, ensuring consistency and easier maintenance.
### Version 1.4.0
* ***🚀 Added***
    * ***Edit Functionality:*** Users can now edit existing PAYG income and general expense entries via a modal, improving data management flexibility.
    * ***WFH Hours CSV Import:*** Users can now bulk-import their Work-From-Home hours using a CSV file. The tool is flexible and supports multiple date and time formats.
    * ***Time Calculation and Display:*** WFH hours are now calculated based on total minutes for higher accuracy. The UI has been updated to display time totals in a more user-friendly HH:MM format, alongside the decimal equivalent used for tax calculations.
    * ***Table Sorting:*** The "General Expenses" and "WFH Depreciable Assets" tables are now automatically sorted by purchase date (oldest first) to improve organization and readability.
    * ***Medicare exempt days:*** Users can now specify how many days they are exempt from Medicare benefits
* ***Fixed***
    * ***MLS Calculation Accuracy:*** The Medicare Levy Surcharge calculation now correctly includes personal superannuation contributions in the income test, as per ATO guidelines.
    * ***Future-Dated Expense Logic:*** Expenses with a purchase date in a future financial year are now properly excluded from the current year's deduction calculations.
    * ***Depreciation Calculation:*** Fixed a critical bug in the Diminishing Value method where assets with a 1-year effective life were incorrectly depreciated at 200% of their value. The calculation is now correctly capped at 100%.
    * ***Corrected the "Claim Schedule":*** display logic to ensure the Year 1 (Y1) value accurately reflects the pro-rata deduction for assets purchased part-way through the financial year.
    * ***User Interface (UI):*** Resolved a persistent bug where the "Remove" button for WFH Depreciable Assets was not working due to incorrect form handling by the browser. Buttons now have an explicit type="button" to prevent unintended form submissions.
    * ***Estimated Deduction (Fixed Rate)" field:*** Fixed a display issue where the "Estimated Deduction (Fixed Rate)" field was not updating correctly.
    ***CSV Export:*** Fixed a critical bug where the CSV export was incomplete. The export now correctly includes all data sections, including detailed WFH running costs and the full list of WFH assets.
* ***Improved***
    * ***Input Validation:*** All numerical input fields now prevent negative values from being entered.
    * ***UI Clarity:*** The Low Income Tax Offset (LITO) line item is now hidden in the final summary if the calculated offset is zero, resulting in a cleaner report.
    * ***Added "Date" and "Method" columns:*** to the WFH Depreciable Assets table for better visibility.
    * ***JSON import:*** Improved the JSON import validation logic to prevent errors.
    * ***Legacy Storage:*** Added backwards compatibility to the data loading function to correctly handle and convert older data structures.
* 🙏 Acknowledgements
    * ***A special thanks to Anachronism59 for your detailed feedback and persistence in identifying the bugs. Your keen eye was crucial in making this version more robust and accurate.***

### Version 1.3.0
* ***Added***
    * ***Private Health Insurance Rebate:*** The app now fully calculates the Private Health Insurance (PHI) tax offset. Users can enter their premium and rebate details to get a more accurate tax outcome.
    * ***Expanded Expense Categories:*** Added "Gifts & Donations," "Cost of Managing Tax Affairs," and "Income Protection Insurance" to the general expenses section.
* ***Fixed***
    * ***Depreciation Calculation Accuracy:*** Corrected the "Diminishing Value" depreciation method to use the asset's written-down value, ensuring the calculation is compliant with ATO rules.

### Version 1.2.0
* ***Added***
    * ***Depreciation Method Choice:*** Users can now select between "Prime Cost (Straight Line)" and "Diminishing Value" methods when adding a depreciable asset, allowing for more accurate and preferable deduction calculations.
    * ***Personal Super Deductions:*** A dedicated input field for "Deductible Personal Super Contributions" has been added to the "Taxpayer Details" section to be included in the total deductions.
    * ***Net Capital Gains:*** Added a field for "Net Capital Gains" in the "Other Income" section to allow for more accurate income calculations for users with investments.
    * ***Summary Breakdown:*** Superannuation deductions are now listed as a separate line item in the Tax Estimation Summary for better clarity.

### Version 1.1.0
* ***Added***
    * ***Family & Single MLS Calculations:*** The app now accurately calculates the Medicare Levy Surcharge (MLS) for both "Single" and "Family" filing statuses.
    * ***Advanced Taxpayer Details:*** Added new inputs for "Filing Status", "Spouse's Income", "Number of Dependent Children", "Reportable Fringe Benefits", and checkboxes for "Medicare Levy Exemption" and "Private Hospital Cover" to support more complex tax scenarios.
    * ***Event Tracking:*** Implemented custom event tracking for Google Analytics to monitor feature usage and JavaScript errors.
    * ***Improved***
    * ***Mobile Navigation:*** The main navigation bar is now horizontally scrollable on mobile devices, fixing a key UI issue on smaller screens.
    * ***Fixed***
        * ***JavaScript Stability:*** Resolved a TypeError by ensuring all JavaScript modules are loaded completely and function calls have the correct parameters.

## Developer Notes

### Adding a New Financial Year

To add support for a new financial year (e.g., 2027-2028), add one complete entry to `TAX_CONFIG` in `js/constants.js`:

```javascript
"2027-2028": {
    ...SHARED_TAX_CONFIG,                        // LITO, Medicare levy rate, MLS child adjustment, WFH fixed rate
    ...MEDICARE_THRESHOLDS_2027_28,              // add this const if the year's Medicare thresholds changed
    TAX_RATES: TAX_RATES_FROM_2026_27,           // reference a TAX_RATES_* bracket table
    MLS_THRESHOLDS_SINGLE: [...],                // 4 tiers, last with max: Infinity
    MLS_THRESHOLDS_FAMILY: [...],
    PHI_REBATE_RATES_PERIODS: {                  // exactly two period keys
        "2027-07-01_2028-03-31": { under65: {...}, '65to69': {...}, '70plus': {...} },
        "2028-04-01_2028-06-30": { under65: {...}, '65to69': {...}, '70plus': {...} },
    },
},
```

The entry must include the `TAX_RATES` reference and a Medicare threshold spread — without them `window.TAX_RATES` is `undefined` and `calculateGrossTax` throws. `PHI_REBATE_RATES_PERIODS` keys must use the format `YYYY-MM-DD_YYYY-MM-DD` for correct label display. `AVAILABLE_YEARS`, the year selector, storage keys and default-year detection all pick up the new entry automatically; no other files need changes.

## Disclaimer

This application provides an estimate only and is not professional tax advice. Always verify current ATO rates and rulings from [ato.gov.au](https://www.ato.gov.au) before making financial decisions.
