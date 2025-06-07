// js/constants.js
// ATO Tax Rates for 2024-2025 (example, verify with ATO for actual rates)
// Source: https://www.ato.gov.au/Rates/Individual-income-tax-rates/
// Note: These are examples and should be updated annually from ATO.gov.au
const TAX_RATES_2025 = [
    { min: 0, max: 18200, rate: 0, offset: 0 },
    { min: 18201, max: 45000, rate: 0.19, offset: 3420 }, // 19c for each $1 over $18,200
    { min: 45001, max: 120000, rate: 0.325, offset: 0 }, // 32.5c for each $1 over $45,000
    { min: 120001, max: 180000, rate: 0.37, offset: 0 }, // 37c for each $1 over $120,000
    { min: 180001, max: Infinity, rate: 0.45, offset: 0 } // 45c for each $1 over $180,000
];

// Low Income Tax Offset (LITO) for 2024-2025 (example, verify with ATO)
// Source: https://www.ato.gov.au/Individuals/Income-and-deductions/Offsets-and-rebates/Low-income-tax-offset/
const LITO_MAX_OFFSET = 700;
const LITO_PHASE_OUT_START = 37500;
const LITO_PHASE_OUT_END = 66667; // (37500 + 700 / 0.02)

// Medicare Levy for 2024-2025 (example, verify with ATO)
// Source: https://www.ato.gov.au/Individuals/Medicare-levy/
const MEDICARE_LEVY_RATE = 0.02; // 2%
const MEDICARE_LEVY_THRESHOLD_SINGLE = 24276; // Example, update annually
const MEDICARE_LEVY_THRESHOLD_FAMILY = 40989; // Example, update annually

// Work From Home Fixed Rate for 2024-2025 (example, verify with ATO)
// Source: https://www.ato.gov.au/Individuals/Income-and-deductions/Deductions-you-can-claim/Home-office-expenses/
// Note: The 67 cents per hour method was for 2022-23 and 2023-24.
// For 2024-2025, ATO might revert to previous methods or introduce new ones.
// This value should be updated based on official ATO guidance for the relevant financial year.
const WFH_FIXED_RATE_PER_HOUR = 0.67; // Example, update annually

const FINANCIAL_YEAR = "2024-2025"; // Current financial year for calculations

// Export constants
window.TAX_RATES_2025 = TAX_RATES_2025;
window.LITO_MAX_OFFSET = LITO_MAX_OFFSET;
window.LITO_PHASE_OUT_START = LITO_PHASE_OUT_START;
window.LITO_PHASE_OUT_END = LITO_PHASE_OUT_END;
window.MEDICARE_LEVY_RATE = MEDICARE_LEVY_RATE;
window.MEDICARE_LEVY_THRESHOLD_SINGLE = MEDICARE_LEVY_THRESHOLD_SINGLE;
window.MEDICARE_LEVY_THRESHOLD_FAMILY = MEDICARE_LEVY_THRESHOLD_FAMILY;
window.WFH_FIXED_RATE_PER_HOUR = WFH_FIXED_RATE_PER_HOUR;
window.FINANCIAL_YEAR = FINANCIAL_YEAR;
