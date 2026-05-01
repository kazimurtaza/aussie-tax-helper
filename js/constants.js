// js/constants.js

// Year-keyed tax configuration
const TAX_CONFIG = {
    "2024-2025": {
        TAX_RATES: [
            { min: 0,      max: 18200,   rate: 0,     base: 0 },
            { min: 18201,  max: 45000,   rate: 0.16,   base: 0 },
            { min: 45001,  max: 135000,  rate: 0.30,   base: 4288 },
            { min: 135001, max: 190000,  rate: 0.37,   base: 31288 },
            { min: 190001, max: Infinity,rate: 0.45,   base: 51638 }
        ],
        LITO_MAX_OFFSET: 700,
        LITO_THRESHOLD_1: 37500,
        LITO_THRESHOLD_2: 45000,
        LITO_THRESHOLD_3: 66667,
        LITO_REDUCTION_RATE_1: 0.05,
        LITO_REDUCTION_RATE_2: 0.015,
        MEDICARE_LEVY_RATE: 0.02,
        MEDICARE_LEVY_THRESHOLD_SINGLE: 27222,
        MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE: 34027,
        // Source: Treasury Laws Amendment (More Cost of Living Relief) Act 2025 (Royal Assent 27 March 2025)
        MEDICARE_LEVY_THRESHOLD_FAMILY: 45907,
        MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY: 57383,
        MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT: 4216,
        MLS_THRESHOLDS_SINGLE: [
            { min: 0, max: 97000, rate: 0 },
            { min: 97001, max: 113000, rate: 0.01 },
            { min: 113001, max: 151000, rate: 0.0125 },
            { min: 151001, max: Infinity, rate: 0.015 }
        ],
        MLS_THRESHOLDS_FAMILY: [
            { min: 0, max: 194000, rate: 0 },
            { min: 194001, max: 226000, rate: 0.01 },
            { min: 226001, max: 302000, rate: 0.0125 },
            { min: 302001, max: Infinity, rate: 0.015 }
        ],
        MLS_CHILD_ADJUSTMENT: 1500,
        PHI_REBATE_RATES_PERIODS: {
            '2024-07-01_2025-03-31': {
                'under65': { base: 0.24608, tier1: 0.16405, tier2: 0.08202, tier3: 0.00000 },
                '65to69':  { base: 0.28710, tier1: 0.20507, tier2: 0.12303, tier3: 0.00000 },
                '70plus':  { base: 0.32812, tier1: 0.24608, tier2: 0.16405, tier3: 0.00000 }
            },
            '2025-04-01_2025-06-30': {
                'under65': { base: 0.24288, tier1: 0.16192, tier2: 0.08095, tier3: 0.00000 },
                '65to69':  { base: 0.28337, tier1: 0.20240, tier2: 0.12143, tier3: 0.00000 },
                '70plus':  { base: 0.32385, tier1: 0.24288, tier2: 0.16192, tier3: 0.00000 }
            }
        },
        WFH_FIXED_RATE_PER_HOUR: 0.70
    },
    "2025-2026": {
        // Tax brackets: confirmed unchanged from 2024-25 (Stage 3 cuts remain)
        // Source: ATO rates page, CPA Australia Budget Report 2025-26
        TAX_RATES: [
            { min: 0,      max: 18200,   rate: 0,     base: 0 },
            { min: 18201,  max: 45000,   rate: 0.16,   base: 0 },
            { min: 45001,  max: 135000,  rate: 0.30,   base: 4288 },
            { min: 135001, max: 190000,  rate: 0.37,   base: 31288 },
            { min: 190001, max: Infinity,rate: 0.45,   base: 51638 }
        ],
        // LITO: confirmed unchanged from 2024-25
        // Source: ATO LITO page (published 16 June 2025), CPA Australia Budget Report 2025-26
        LITO_MAX_OFFSET: 700,
        LITO_THRESHOLD_1: 37500,
        LITO_THRESHOLD_2: 45000,
        LITO_THRESHOLD_3: 66667,
        LITO_REDUCTION_RATE_1: 0.05,
        LITO_REDUCTION_RATE_2: 0.015,
        // Medicare Levy: rate and single thresholds confirmed unchanged from 2024-25
        // Family thresholds: confirmed via Treasury Laws Amendment (More Cost of Living Relief) Act 2025
        // Source: ATO myTax 2025 instructions, William Buck Tax Rates 2025-26
        MEDICARE_LEVY_RATE: 0.02,
        MEDICARE_LEVY_THRESHOLD_SINGLE: 27222,
        MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE: 34027,
        MEDICARE_LEVY_THRESHOLD_FAMILY: 45907,
        MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY: 57383,
        MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT: 4216,
        // MLS thresholds updated for 2025-26
        // Source: ATO MLS income thresholds and rates page (dedicated 2025-26 section)
        MLS_THRESHOLDS_SINGLE: [
            { min: 0, max: 101000, rate: 0 },
            { min: 101001, max: 118000, rate: 0.01 },
            { min: 118001, max: 158000, rate: 0.0125 },
            { min: 158001, max: Infinity, rate: 0.015 }
        ],
        MLS_THRESHOLDS_FAMILY: [
            { min: 0, max: 202000, rate: 0 },
            { min: 202001, max: 236000, rate: 0.01 },
            { min: 236001, max: 316000, rate: 0.0125 },
            { min: 316001, max: Infinity, rate: 0.015 }
        ],
        MLS_CHILD_ADJUSTMENT: 1500,
        // PHI rebate rates confirmed for 2025-26
        // Source: ATO PHI rebate thresholds page, privatehealth.gov.au, Dept of Health PHI Circular 21/25 & 12/26
        PHI_REBATE_RATES_PERIODS: {
            '2025-07-01_2026-03-31': {
                'under65': { base: 0.24288, tier1: 0.16192, tier2: 0.08095, tier3: 0.00000 },
                '65to69':  { base: 0.28337, tier1: 0.20240, tier2: 0.12143, tier3: 0.00000 },
                '70plus':  { base: 0.32385, tier1: 0.24288, tier2: 0.16192, tier3: 0.00000 }
            },
            '2026-04-01_2026-06-30': {
                'under65': { base: 0.24118, tier1: 0.16079, tier2: 0.08038, tier3: 0.00000 },
                '65to69':  { base: 0.28139, tier1: 0.20098, tier2: 0.12058, tier3: 0.00000 },
                '70plus':  { base: 0.32158, tier1: 0.24118, tier2: 0.16079, tier3: 0.00000 }
            }
        },
        // WFH rate: confirmed unchanged at $0.70/hr
        // Source: ATO WFH fixed rate method page
        WFH_FIXED_RATE_PER_HOUR: 0.70
    }
};

// Auto-discovery
const AVAILABLE_YEARS = Object.keys(TAX_CONFIG).sort();
const LATEST_YEAR = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];

// Load constants for a specific financial year and set window globals
const loadConstantsForYear = (year) => {
    if (!TAX_CONFIG[year]) {
        console.error(`No tax configuration found for year: ${year}`);
        return;
    }

    const c = TAX_CONFIG[year];

    // Set all window globals that calculations.js, ui.js, and app.js read from
    window.TAX_RATES_2025 = c.TAX_RATES;
    window.LITO_MAX_OFFSET = c.LITO_MAX_OFFSET;
    window.LITO_THRESHOLD_1 = c.LITO_THRESHOLD_1;
    window.LITO_THRESHOLD_2 = c.LITO_THRESHOLD_2;
    window.LITO_THRESHOLD_3 = c.LITO_THRESHOLD_3;
    window.LITO_REDUCTION_RATE_1 = c.LITO_REDUCTION_RATE_1;
    window.LITO_REDUCTION_RATE_2 = c.LITO_REDUCTION_RATE_2;
    window.MEDICARE_LEVY_RATE = c.MEDICARE_LEVY_RATE;
    window.MEDICARE_LEVY_THRESHOLD_SINGLE = c.MEDICARE_LEVY_THRESHOLD_SINGLE;
    window.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE = c.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE;
    window.MEDICARE_LEVY_THRESHOLD_FAMILY = c.MEDICARE_LEVY_THRESHOLD_FAMILY;
    window.MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY = c.MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY;
    window.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT = c.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT;
    window.MLS_THRESHOLDS_SINGLE = c.MLS_THRESHOLDS_SINGLE;
    window.MLS_THRESHOLDS_FAMILY = c.MLS_THRESHOLDS_FAMILY;
    window.MLS_CHILD_ADJUSTMENT = c.MLS_CHILD_ADJUSTMENT;
    window.PHI_REBATE_RATES_PERIODS = c.PHI_REBATE_RATES_PERIODS;
    window.WFH_FIXED_RATE_PER_HOUR = c.WFH_FIXED_RATE_PER_HOUR;
    window.FINANCIAL_YEAR = year;
};

// Boot with latest year as safe default
loadConstantsForYear(LATEST_YEAR);

// Expose on window for app.js to use
window.TAX_CONFIG = TAX_CONFIG;
window.AVAILABLE_YEARS = AVAILABLE_YEARS;
window.LATEST_YEAR = LATEST_YEAR;
window.loadConstantsForYear = loadConstantsForYear;
