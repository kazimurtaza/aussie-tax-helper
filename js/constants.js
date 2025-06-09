// js/constants.js

// --- ATO Tax Rates for 2024-2025 ---
// These are the official legislated "Stage 3" tax rates, effective 1 July 2024.
// Source: https://www.ato.gov.au/about-ato/new-legislation/in-detail/personal-tax/changes-to-individual-income-tax-rates
const TAX_RATES_2025 = [
    { min: 0,      max: 18200,   rate: 0,     base: 0 },
    { min: 18201,  max: 45000,   rate: 0.16,   base: 0 },
    { min: 45001,  max: 135000,  rate: 0.30,   base: 4288 },
    { min: 135001, max: 190000,  rate: 0.37,   base: 51638 }, 
    { min: 190001, max: Infinity,rate: 0.45,   base: 71938 }   
];


// --- Low Income Tax Offset (LITO) for 2024-2025 ---
// Source: https://www.ato.gov.au/Individuals/Income-and-deductions/Offsets-and-rebates/Low-and-middle-income-tax-offset/
const LITO_MAX_OFFSET = 700;
const LITO_THRESHOLD_1 = 37500;
const LITO_THRESHOLD_2 = 45000;
const LITO_THRESHOLD_3 = 66667;
const LITO_REDUCTION_RATE_1 = 0.05;    // 5 cents per dollar
const LITO_REDUCTION_RATE_2 = 0.015;   // 1.5 cents per dollar

// --- Medicare Levy for 2024-2025 ---
// Note: Thresholds are for 2023-24, verify for 2024-25 when released. Using 23-24 as placeholder.
// Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction-for-low-income-earners
const MEDICARE_LEVY_RATE = 0.02; // 2%
const MEDICARE_LEVY_THRESHOLD_SINGLE = 24276;
const MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE = 30345; // Upper threshold for phase-in rate

// --- Medicare Levy Surcharge (MLS) for 2024-2025 ---
// Source: https://www.ato.gov.au/rates/medicare-levy-surcharge-income-thresholds-and-rates/
const MLS_THRESHOLDS_SINGLE = [
    { min: 0, max: 97000, rate: 0 },
    { min: 97001, max: 113000, rate: 0.01 },
    { min: 113001, max: 151000, rate: 0.0125 },
    { min: 151001, max: Infinity, rate: 0.015 }
];
const MLS_THRESHOLDS_FAMILY = [
    { min: 0, max: 194000, rate: 0 },
    { min: 194001, max: 226000, rate: 0.01 },
    { min: 226001, max: 302000, rate: 0.0125 },
    { min: 302001, max: Infinity, rate: 0.015 }
];
const MLS_CHILD_ADJUSTMENT = 1500; // Threshold increases by this amount for each dependent child after the first.

// --- Private Health Insurance (PHI) Rebate for 2024-2025 ---
// Note: Rates are for 1 April 2024 - 31 March 2025. Verify for updates.
// Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/private-health-insurance-rebate/income-thresholds-and-rates-for-the-private-health-insurance-rebate
const PHI_REBATE_RATES = {
    'under65': { base: 0.24608, tier1: 0.16405, tier2: 0.08202, tier3: 0 },
    '65to69':  { base: 0.28710, tier1: 0.20507, tier2: 0.12304, tier3: 0 },
    '70plus':  { base: 0.32812, tier1: 0.24609, tier2: 0.16406, tier3: 0 }
};

// --- Work From Home Fixed Rate for 2024-2025 ---
// The 67 cents per hour rate is confirmed for the 2024-25 financial year.
// Source: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-deductions/fixed-rate-method-work-from-home-expenses
const WFH_FIXED_RATE_PER_HOUR = 0.70;

const FINANCIAL_YEAR = "2024-2025";

// --- Expose constants to the global scope for other scripts ---
window.TAX_RATES_2025 = TAX_RATES_2025;
window.LITO_MAX_OFFSET = LITO_MAX_OFFSET;
window.LITO_THRESHOLD_1 = LITO_THRESHOLD_1;
window.LITO_THRESHOLD_2 = LITO_THRESHOLD_2;
window.LITO_THRESHOLD_3 = LITO_THRESHOLD_3;
window.LITO_REDUCTION_RATE_1 = LITO_REDUCTION_RATE_1;
window.LITO_REDUCTION_RATE_2 = LITO_REDUCTION_RATE_2;
window.MEDICARE_LEVY_RATE = MEDICARE_LEVY_RATE;
window.MEDICARE_LEVY_THRESHOLD_SINGLE = MEDICARE_LEVY_THRESHOLD_SINGLE;
window.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE = MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE;
window.MLS_THRESHOLDS_SINGLE = MLS_THRESHOLDS_SINGLE;
window.MLS_THRESHOLDS_FAMILY = MLS_THRESHOLDS_FAMILY;
window.MLS_CHILD_ADJUSTMENT = MLS_CHILD_ADJUSTMENT;
window.PHI_REBATE_RATES = PHI_REBATE_RATES;
window.WFH_FIXED_RATE_PER_HOUR = WFH_FIXED_RATE_PER_HOUR;
window.FINANCIAL_YEAR = FINANCIAL_YEAR;
