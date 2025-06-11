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
</p>

## Table of Contents

- [Overview & Goals](#overview--goals)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Data Storage & Security](#data-storage--security)
- [Changelog](#changelog)
- [Disclaimer](#disclaimer)

## Overview & Goals

This application is designed for Australian individuals, particularly salaried employees, who work from home or purchase work-related items. The primary goals are to:

* **Calculate & Claim Deductions:** Accurately calculate and claim all relevant work-related deductions, with a focus on WFH expenses using both the **ATO Fixed Rate** and **Actual Cost** methods.
* **Estimate Tax Outcome:** Assist users in estimating their potential tax refund or payable amount from the Australian Taxation Office (ATO).
* **Record-Keeping:** Provide a robust system for keeping records of income, expenses, and supporting documentation, all stored locally in the user's browser.

**Target Tax Jurisdiction:** Australia (ATO guidelines for the 2024-2025 Financial Year).

## Features

* **Income Management:**
    * Add multiple PAYG income statements (gross salary, tax withheld).
    * Track other income sources like bank interest and dividends.
* **Expense Tracking:**
    * Log general work-related expenses with categories (e.g., Self-Education, Tools of Trade).
    * Manage depreciable assets with **Prime Cost** and **Diminishing Value** depreciation methods.
* **Work-From-Home (WFH) Calculations:**
    * Compare deduction outcomes between the **ATO Fixed Rate Method** (67 cents per hour) and the **Actual Cost Method**.
    * Log WFH hours manually or import them via a CSV file.
* **Tax Estimation Engine:**
    * Calculates taxable income based on ATO tax rates for 2024-2025.
    * Applies common tax offsets like the Low Income Tax Offset (LITO) and the Private Health Insurance offset.
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
    git clone [https://github.com/kazimurtaza/aussie-tax-helper.git](https://github.com/kazimurtaza/aussie-tax-helper.git)
    ```
2.  **Navigate to the directory:**
    ```sh
    cd aussie-tax-helper
    ```
3.  **Open `index.html` in your browser.**
    You can simply open the file directly, or use a live server extension if you have one installed in your code editor.

## Data Storage & Security

* **Storage Method:** All data is stored exclusively in the **user's browser local storage**. The application does not have a backend and does not store any user data on external servers.
* **Security:** Users are informed that clearing their browser data will permanently delete their stored information. Regular data export is recommended for backup purposes.
* **Privacy:** The app does not handle or store Tax File Numbers (TFNs).

## Changelog

### Version 1.4.0
    * ***🚀 Added***
        * ***Edit Functionality:*** Users can now edit existing PAYG income and general expense entries via a modal, improving data management flexibility.
        * ***WFH Hours CSV Import:*** Users can now bulk-import their Work-From-Home hours using a CSV file. The tool is flexible and supports multiple date and time formats.
        * ***Time Calculation and Display:*** WFH hours are now calculated based on total minutes for higher accuracy. The UI has been updated to display time totals in a more user-friendly HH:MM format, alongside the decimal equivalent used for tax calculations.
        * ***Table Sorting:*** The "General Expenses" and "WFH Depreciable Assets" tables are now automatically sorted by purchase date (oldest first) to improve organization and readability.
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

###Version 1.3.0
    * ***Added***
        * ***Private Health Insurance Rebate:*** The app now fully calculates the Private Health Insurance (PHI) tax offset. Users can enter their premium and rebate details to get a more accurate tax outcome.
        * ***Expanded Expense Categories:*** Added "Gifts & Donations," "Cost of Managing Tax Affairs," and "Income Protection Insurance" to the general expenses section.
    * ***Fixed***
        * ***Depreciation Calculation Accuracy:*** Corrected the "Diminishing Value" depreciation method to use the asset's written-down value, ensuring the calculation is compliant with ATO rules.

###Version 1.2.0
    * ***Added***
        * ***Depreciation Method Choice:*** Users can now select between "Prime Cost (Straight Line)" and "Diminishing Value" methods when adding a depreciable asset, allowing for more accurate and preferable deduction calculations.
        * ***Personal Super Deductions:*** A dedicated input field for "Deductible Personal Super Contributions" has been added to the "Taxpayer Details" section to be included in the total deductions.
        * ***Net Capital Gains:*** Added a field for "Net Capital Gains" in the "Other Income" section to allow for more accurate income calculations for users with investments.
        * ***Summary Breakdown:*** Superannuation deductions are now listed as a separate line item in the Tax Estimation Summary for better clarity.

###Version 1.1.0
    * ***Added***
        * ***Family & Single MLS Calculations:*** The app now accurately calculates the Medicare Levy Surcharge (MLS) for both "Single" and "Family" filing statuses.
        * ***Advanced Taxpayer Details:*** Added new inputs for "Filing Status", "Spouse's Income", "Number of Dependent Children", "Reportable Fringe Benefits", and checkboxes for "Medicare Levy Exemption" and "Private Hospital Cover" to support more complex tax scenarios.
        * ***Event Tracking:*** Implemented custom event tracking for Google Analytics to monitor feature usage and JavaScript errors.
        * ***Improved***
        * ***Mobile Navigation:*** The main navigation bar is now horizontally scrollable on mobile devices, fixing a key UI issue on smaller screens.
        * ***Fixed***
            * ***JavaScript Stability:*** Resolved a TypeError by ensuring all JavaScript modules are loaded completely and function calls have the correct parameters.

## Disclaimer

This application provides an estimate only and is not professional tax advice. Always verify current ATO rates and rulings from [ato.gov.au](https://www.ato.gov.au) before making financial decisions.
