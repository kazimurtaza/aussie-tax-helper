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

All core tax calculation parameters are stored in `js/constants.js` using a year-keyed configuration structure. This centralizes the key ATO rates and thresholds, making them easy to review and update annually. The application supports multiple financial years (2024-2025, 2025-2026) with automatic rate switching based on the selected year.

Below are the key constants for the **2024-2025** and **2025-2026** financial years.

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
* **Low-income threshold (Singles):** No levy if income is below `$27,222`.
* **Low-income phase-in (Singles):** A reduced rate is paid for income between `$27,222` and `$34,027`.
* **Low-income threshold (Families):** No levy if combined family income is below `$45,907` (increases by `$4,216` for each dependent child after the first).
* **Low-income phase-in (Families):** A reduced rate is paid for combined income between `$45,907` and `$57,383`.
*Source: Treasury Laws Amendment (More Cost of Living Relief) Act 2025 (Royal Assent 27 March 2025)*

### Medicare Levy Surcharge (MLS)
An additional levy for higher-income earners without private hospital cover.
* **Base Income Threshold (Singles):** `$97,000`
* **Base Income Threshold (Families):** `$194,000` (increases by $1,500 for each dependent child after the first)
* **Surcharge Rates:** `1%`, `1.25%`, or `1.5%` depending on the income tier.

### Private Health Insurance (PHI) Rebate
A government contribution to help cover the cost of private health insurance. The rebate amount is income-tested and age-based.

### Work-From-Home (WFH) Fixed Rate
* **Rate for 2024-2025 and 2025-2026:** `70 cents per hour` (confirmed unchanged). This rate covers electricity, gas, internet, phone, stationery, and computer consumables.
*Source: [ATO - Fixed rate method](https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-deductions/fixed-rate-method-work-from-home-expenses)*

### 2025-2026 Updates

The following ATO rates have been updated for the 2025-2026 financial year:

#### Medicare Levy Surcharge (MLS) - 2025-2026
* **Base Income Threshold (Singles):** `$101,000` (increased from $97,000)
* **Base Income Threshold (Families):** `$202,000` (increased from $194,000)
* **Child Adjustment:** `$1,500` for each dependent child after the first (unchanged)
* **Surcharge Rates:** `1%`, `1.25%`, or `1.5%` depending on the income tier (unchanged)

All other 2025-2026 rates — income tax brackets, LITO, Medicare levy thresholds, and PHI rebate rates — are confirmed from official ATO sources and coded in `js/constants.js`. PHI rebate rates are updated for both 2025-26 periods (1 July 2025 – 31 March 2026 and 1 April 2026 – 30 June 2026) per Dept of Health PHI Circulars 21/25 and 12/26.

## Data Storage & Security

* **Storage Method:** All data is stored exclusively in the **user's browser local storage** with separate storage keys for each financial year (`aussieTaxHelperData-2025`, `aussieTaxHelperData-2026`, etc.). The application does not have a backend and does not store any user data on external servers.
* **Multi-Year Isolation:** Each financial year maintains completely independent data. Switching years preserves all data for each year, and data operations (save, clear, export) only affect the active year.
* **Security:** Users are informed that clearing their browser data will permanently delete their stored information. Regular data export is recommended for backup purposes.
* **Privacy:** The app does not handle or store Tax File Numbers (TFNs).

## Changelog

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

To add support for a new financial year (e.g., 2026-2027):

1. **Update `js/constants.js`:** Add a new entry to the `TAX_CONFIG` object with the year as the key:
   ```javascript
   "2026-2027": {
       TAX_RATES: [...],
       LITO_MAX_OFFSET: ...,
       // ... other constants
   }
   ```

2. **No other changes needed:** The `AVAILABLE_YEARS` array is auto-generated from `TAX_CONFIG` keys, and all UI components automatically adapt to the new year.

3. **PHI Period Labels:** Ensure the `PHI_REBATE_RATES_PERIODS` keys use the format `YYYY-MM-DD_YYYY-MM-DD` for correct label display.

## Disclaimer

This application provides an estimate only and is not professional tax advice. Always verify current ATO rates and rulings from [ato.gov.au](https://www.ato.gov.au) before making financial decisions.
