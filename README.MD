# Aussie Tax Deductions Helper

## Overview & Goals

A comprehensive tax management application designed for Australian individuals, particularly salaried employees, who work from home or purchase work-related items.

The app's primary goals are to:

* Help users accurately calculate and claim all relevant work-related deductions, with a strong focus on work-from-home (WFH) expenses.
* Assist users in estimating their potential tax refund or payable amount from the Australian Taxation Office (ATO).
* Provide a robust system for record-keeping of income, expenses, and supporting documentation.

**Target Tax Jurisdiction:** Australia (ATO guidelines).
**Primary Users:** Salaried employees, but also other individuals incurring work-related expenses.

## User Profile & Example Scenario (Illustrative)

* **Primary Users:** Salaried employees, but also other individuals incurring work-related expenses.
* **Example Case:** A salaried employee with an annual income of 143,100 AUD (pre-tax, excluding superannuation) who works from home 3 out of 5 days a week.
    * **Home Office:** Uses a dedicated room (bedroom) of 3.7m x 2.9m (10.73 sqm).
    * **WFH Hours Example:** 943.25 hours logged from July 1, 2024, to June 4, 2025 (for the 2024-2025 financial year).
    * **Expenses:** Purchases items for home office (e.g., chair, monitor) and incurs other work-related expenses.

## Core App Requirements & Features

### 1. Income Management

* **Data Inputs:**
    * **PAYG Payment Summary (Income Statement):** Gross salary/wages, total tax withheld.
    * **Other Income Sources:** Bank interest, dividend statements (franked/unfranked amounts, franking credits).
* **Features:**
    * Ability to add multiple income statements.
    * Forms for inputting bank interest and dividend details.
    * Running total of assessable income.

### 2. Expense Tracking & Management

* **Data Inputs (for each expense):**
    * Expense name/description, date of purchase, cost.
    * Receipt (digital attachment/photo storage – stored locally).
    * Category (e.g., WFH Utilities, WFH Equipment, Self-Education, Tools of Trade, Work-Related Travel).
    * Work-related use percentage.
    * For depreciable assets: useful life.
* **Features:**
    * Categorisation for simplified deduction claims.
    * Management of depreciable assets:
        * Choice of depreciation method (Prime Cost or Diminishing Value).
        * Automatic calculation of annual decline in value.
    * Running total of deductions by category.

### 3. Work-From-Home (WFH) Calculations (ATO Compliant for 2024-2025)

* **Data Inputs:**
    * Total WFH hours.
    * **Actual Cost Method:** Dedicated home office area (sqm), total home area (sqm) (optional), utility bills, cleaning costs, stationery costs, purchase details of home office assets.
* **Features:**
    * **ATO Fixed Rate Method:** (e.g., 67 cents per hour for 2023-2024, **rate for 2024-2025 to be confirmed and updated annually**). Calculation: `Total WFH hours * ATO fixed rate`. Explanation of what the rate covers.
    * **ATO Actual Cost Method:**
        * Calculation of dedicated home office area percentage.
        * Apportionment of utility expenses.
        * Calculation of decline in value for WFH assets.
    * **Method Comparison:** Side-by-side estimated deduction for both methods.
    * Guidance on eligibility and record-keeping.

### 4. Hours Logging (for WFH)

* **Features:**
    * Manual entry (date, start/end time, or total hours).
    * Diary/calendar view.
    * CSV import for hours.
    * Running total of WFH hours.

### 5. Tax Calculation & Estimation Engine

* **Logic:**
    1.  `Total Assessable Income = Sum of all income sources`
    2.  `Total Deductions = Sum of all eligible work-related expenses (including chosen WFH deduction)`
    3.  `Taxable Income = Total Assessable Income - Total Deductions`
    4.  `Gross Tax Payable = Apply ATO tax rates for 2024-2025 to Taxable Income`
    5.  `Net Tax Payable = Gross Tax Payable - Applicable Tax Offsets (e.g., LITO)`
    6.  `Estimated Refund/Payable = Tax Already Withheld - Net Tax Payable`
* **Features:**
    * Application of current ATO tax rates and thresholds.
    * Calculation of common tax offsets (checking eligibility).
    * Clear breakdown of the estimation.

### 6. Reporting & Record Keeping

* **Features:**
    * Comprehensive tax summary report (for self-lodgement via myTax or for a tax agent).
    * Secure local storage of all records.
    * Data export (CSV for data, PDF for summary report).
    * Data import (CSV for restoring data).

### 7. User Interface (UI) / User Experience (UX) Considerations

* Intuitive navigation and data entry.
* Progress tracking through the financial year.
* Guidance/tooltips explaining tax concepts.
* Responsive design.

### 8. Data Storage & Security

* **Storage Method:** All data (income, expenses, receipts, logs) is stored exclusively in the **user's browser local storage**.
* **No Persistent Server-Side Data:** The application will not store any user data on external servers.
* **Data Export/Import:**
    * Users can export all their data to a CSV file for backup or transfer.
    * Users can import data from a previously exported CSV file.
* **Security Considerations:**
    * Users should be informed that clearing their browser data (cache, local storage) for the site will permanently delete their stored information from the app. Regular export is recommended.
    * The app will not handle or store Tax File Numbers (TFNs) unless absolutely necessary for a specific report generation, and if so, with explicit user consent and prominent warnings about local storage security. For most estimation purposes, TFN is not required by the app itself.

## Key Design Considerations & FAQ

This section addresses specific questions regarding the app's design and functionality.

### 1. What are the essential data points the app needs to collect for a reasonably accurate tax estimation for a salaried employee with WFH expenses?

* **Personal Information (for report generation, user reference):**
    * Name (optional)
    * Financial Year being processed
* **Income:**
    * Gross salary/wages (from Income Statement).
    * Tax withheld (from Income Statement).
    * Bank interest received.
    * Dividends received (including franking credits).
* **Work-Related Expenses (Non-WFH):**
    * For each item: Description, date purchased, cost, work-related use percentage.
* **Work-From-Home (WFH) Expenses:**
    * **Hours Log:** Total hours worked from home.
    * **If using Actual Cost Method:** Electricity/gas bills (apportioned), internet/phone bills (apportioned), stationery costs, decline in value of home office equipment, cleaning costs (apportioned), dedicated office area (sqm) and total home area (sqm).
* **Other:**
    * Private health insurance details (if claiming the rebate as a tax offset).

### 2. How should the app structure the calculation flow, from income input to final estimated refund/payable?

1.  **User Onboarding/Setup:** Select Financial Year.
2.  **Income Input:** PAYG details, other income. -> *Total Assessable Income*.
3.  **WFH Module:** Log hours. Calculate deduction via Fixed Rate & Actual Cost. User selects one. -> *Chosen WFH Deduction*.
4.  **Other Work-Related Expenses Input:** Details of other deductions, including depreciation. -> *Total Other Work-Related Deductions*.
5.  **Calculate Total Deductions:** `Chosen WFH Deduction + Total Other Work-Related Deductions`. -> *Total Deductions*.
6.  **Calculate Taxable Income:** `Total Assessable Income - Total Deductions`. -> *Taxable Income*.
7.  **Calculate Gross Tax Payable:** Apply ATO tax rates (2024-2025) to Taxable Income. -> *Gross Tax Payable*.
8.  **Calculate Tax Offsets:** Determine applicable offsets (e.g., LITO). -> *Total Tax Offsets*.
9.  **Calculate Net Tax Payable:** `Gross Tax Payable - Total Tax Offsets`. -> *Net Tax Payable*.
10. **Estimate Refund or Payable:** `Total Tax Withheld - Net Tax Payable`. -> *Estimated Tax Refund/Payable*.
11. **Display Summary:** Show breakdown.

### 3. What are the key ATO guidelines or rulings the app MUST incorporate for WFH deductions and general work-related expenses for the 2024-2025 financial year?

* **General Work-Related Expenses:**
    * Must be directly related to earning income.
    * Must have spent the money and not been reimbursed.
    * Must have a record (receipts, etc.).
    * Apportion for private use.
* **Work-From-Home (WFH) Deductions (2024-2025):**
    * **Fixed Rate Method:**
        * **Rate:** 67 cents per hour (effective 1 July 2022 - **verify annually for ATO updates**).
        * **Covers:** Energy, internet, phone, stationery, computer consumables, low-cost asset decline in value.
        * **Record-keeping:** Record of all WFH hours, evidence of payment for expenses covered (e.g., one bill for each).
    * **Actual Cost Method:**
        * Claim actual work-related portion of all running expenses (energy, internet, phone, stationery, cleaning).
        * Claim decline in value for depreciable assets (desk, chair, computer).
        * **Record-keeping:** Detailed records for all expenses, apportionment calculations, WFH hours.
    * **No Double Dipping.**
    * **Eligibility:** Must be working from home to fulfil employment duties and incur additional deductible expenses.
* **Depreciation (Decline in Value):**
    * Use ATO-recognised effective life or allow user input.
    * Apply Prime Cost or Diminishing Value methods.
    * Consider rules for low-value pool or instant asset write-off if applicable.

**Crucial Note:** The app must be updated annually with the latest ATO rates, thresholds, and rulings for the relevant financial year. Information for 2024-2025 should be sourced directly from ato.gov.au.

### 4. How can the app help users choose between the fixed rate and actual cost methods for WFH deductions, showing potential outcomes for both?

1.  **Educate:** Explain each method, what it covers, and record-keeping needs.
2.  **Concurrent Calculation:** Calculate WFH deduction using both methods based on user inputs.
3.  **Side-by-Side Comparison:** Display "$X for Fixed Rate" vs. "$Y for Actual Cost".
4.  **Pros and Cons Summary:** Remind about simplicity vs. potentially higher claim and record-keeping effort.
5.  **User Choice:** Allow the user to select the method to apply.

### 5. What considerations are there for updating the app annually with new tax rates, thresholds, and ATO rulings?

* **Core Updatable Elements:** Income tax rates/brackets, WFH fixed rate, tax offset amounts/eligibility, Medicare levy/surcharge thresholds, depreciation rules.
* **Update Mechanism (Local App):**
    * Package updated rates/rules within new app versions (e.g., in a config file).
    * Clearly version the app for the financial year (e.g., "Aussie Tax Helper 2025-2026").
* **Communication:** Inform users about new versions for upcoming financial years.
* **Testing:** Rigorously test with new parameters annually.
* **ATO Monitoring:** Regularly check ato.gov.au for changes.
* **Disclaimer:** Always state the app provides estimates and is not professional advice.

## Project Setup / Getting Started

This project will be a client-side web application. All data will be stored in the user's browser (local storage).

### Technology Stack

* **HTML:** For the structure of the application.
* **CSS:** For styling and presentation.
* **JavaScript (Vanilla JS):** For application logic, calculations, DOM manipulation, and interaction with local storage.
    * Consider modular JS (ES6 modules) for better organization.
* **(Optional) CSV Parsing/Generation Library:** Such as PapaParse for handling CSV import/export reliably.
* **(Optional) CSS Framework:** Such as Bootstrap or Tailwind CSS for faster UI development (or custom CSS).

### Basic File Structure
aussie-tax-helper/
├── README.md
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js          // Main application logic, event handling
│   ├── ui.js           // Functions for updating the UI, creating elements
│   ├── calculations.js // Core tax calculation logic, WFH methods, depreciation
│   ├── storage.js      // Functions for saving to and loading from local storage, CSV export/import
│   └── constants.js    // Store tax rates, thresholds, WFH fixed rate (for easy updates)
└── assets/             // For any images, icons, etc. (if needed)

### Todo

* ***Critical Issue:*** 2024-2025 Tax Rates: The TAX_RATES_2025 array in constants.js appears to be incorrect for the 2024-2025 financial year. The Australian government has legislated new "Stage 3" tax cuts that take effect from July 1, 2024. The current rates in your file resemble the 2023-2024 brackets.

* ***Recommendation:*** Update the tax brackets in js/constants.js to reflect the correct 2024-2025 income tax rates. The ATO is the official source for these figures. The correct resident tax rates for 2024-25 are:
    * $0 – $18,200: 0%
    * $18,201 – $45,000: 16%
    * $45,001 – $135,000: 30%
    * $135,001 – $190,000: 37%
    * $190,001 and over: 45%

* ***Minor Inconsistency:*** LITO Calculation: The calculateLITO function in calculations.js uses constants like LITO_THRESHOLD_1 and LITO_REDUCTION_RATE_1 that are not defined in your js/constants.js file. This indicates that the logic in the calculation file might be out of sync with your intended constants.

* ***Recommendation:*** Consolidate all constants into constants.js and ensure the calculateLITO function imports and uses them directly. This makes annual updates much easier.

### 🖥️ User Interface & Experience (UI/UX)

* ***Suggestion:*** Form Resets: After submitting a new PAYG income or expense, the forms are correctly reset. However, the "Other Income" form updates the data but doesn't clear. This is acceptable, as it's more of an "update" than an "add" action, but ensure this is the intended behavior.
* ***Suggestion:*** Visual Feedback on Save: In the "Actual Cost Method" for WFH, the user clicks "Save & Calculate Actual Costs". While a notification appears, consider adding a subtle visual cue, like briefly flashing the background of the calculated deduction field, to immediately draw the user's eye to the result of their action.

### 💾 Data Management

* ***Suggestion:*** Import Validation: The importData function in storage.js performs a basic validation check to see if the top-level keys exist. To make it more robust, you could implement a more thorough schema validation, perhaps checking for expected data types or nested properties. This would prevent malformed data from corrupting the application state.
* ***Suggestion:*** Clearer Button Text: The "Clear All Local Data" button is red and imposing, which is good. A small tweak could be to rename it to "Clear All Data (from this browser)" to be even more explicit about the scope of the action.