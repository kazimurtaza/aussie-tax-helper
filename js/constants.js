// js/constants.js

// --- ATO Tax Rates for 2024-2025 ---
// These are the official legislated "Stage 3" tax rates, effective 1 July 2024.
// Source: https://www.ato.gov.au/about-ato/new-legislation/in-detail/personal-tax/changes-to-individual-income-tax-rates
const TAX_RATES_2025 = [
    { min: 0,      max: 18200,   rate: 0,     base: 0 },
    { min: 18201,  max: 45000,   rate: 0.16,   base: 0 },
    { min: 45001,  max: 135000,  rate: 0.30,   base: 4288 },   // 4288 = 16% of (45000 - 18200)
    { min: 135001, max: 190000,  rate: 0.37,   base: 31288 },  // 31288 = 4288 + 30% of (135000 - 45000)
    { min: 190001, max: Infinity,rate: 0.45,   base: 51638 }   // 51638 = 31288 + 37% of (190000 - 135000)
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
// Note: Thresholds are for 2023-24, verify for 2024-25 when released.
// Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction-for-low-income-earners
const MEDICARE_LEVY_RATE = 0.02; // 2%
const MEDICARE_LEVY_THRESHOLD_SINGLE = 24276;
const MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE = 30345; // Upper threshold for phase-in rate

// --- Work From Home Fixed Rate for 2024-2025 ---
// The 67 cents per hour rate is confirmed for the 2024-25 financial year.
// Source: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-deductions/fixed-rate-method-work-from-home-expenses
const WFH_FIXED_RATE_PER_HOUR = 0.67;

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
window.WFH_FIXED_RATE_PER_HOUR = WFH_FIXED_RATE_PER_HOUR;
window.FINANCIAL_YEAR = FINANCIAL_YEAR;