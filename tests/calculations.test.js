'use strict';

// Simulate browser environment BEFORE requiring any source modules so that
// all `window.*` assignments in the source files resolve to `global.*`.
// Jest's require() instruments the files for coverage; new Function() would not.
global.window = global;

require('../js/constants.js');
require('../js/calculations.js');

// Helper factories
const singleTaxpayer = (overrides = {}) => ({
    filingStatus: 'single',
    dependentChildren: 0,
    isMedicareExempt: false,
    medicareExemptDays: 0,
    hasPrivateHospitalCover: false,
    reportableFringeBenefits: 0,
    personalSuperContribution: 0,
    spouseIncome: 0,
    phiAgeBracket: 'under65',
    phiPremiumsPaid_period1: 0,
    phiPremiumsPaid_period2: 0,
    phiRebateReceived: 0,
    ...overrides,
});

const familyTaxpayer = (overrides = {}) => singleTaxpayer({ filingStatus: 'family', ...overrides });

const makeAppData = (overrides = {}) => ({
    income: {
        payg: [{ grossSalary: 80000, taxWithheld: 18000, sourceName: 'Employer' }],
        other: {
            bankInterest: 0,
            dividendsUnfranked: 0,
            dividendsFranked: 0,
            frankingCredits: 0,
            netCapitalGains: 0,
            ...(overrides.otherIncome || {}),
        },
    },
    generalExpenses: overrides.generalExpenses || [],
    wfh: {
        method: 'fixed_rate',
        totalMinutes: 0,
        actualCostDetails: {
            officeArea: 0, totalHomeArea: 0, electricityCost: 0, gasCost: 0,
            internetCost: 0, internetWorkPercent: 0, phoneCost: 0,
            stationeryCost: 0, assets: [],
        },
        ...(overrides.wfh || {}),
    },
    taxpayerDetails: singleTaxpayer(overrides.taxpayerDetails || {}),
    ...overrides,
});

// ─────────────────────────────────────────────
// calculateGrossTax
// ─────────────────────────────────────────────
describe('calculateGrossTax', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('zero income → zero tax', () => {
        expect(TaxCalculations.calculateGrossTax(0)).toBe(0);
    });

    test('at tax-free threshold ($18,200) → zero tax', () => {
        expect(TaxCalculations.calculateGrossTax(18200)).toBe(0);
    });

    test('$18,201 (first dollar of 16% bracket)', () => {
        // base=0 + (18201 - 18200) * 0.16 = 0.16
        expect(TaxCalculations.calculateGrossTax(18201)).toBeCloseTo(0.16, 5);
    });

    test('$37,000 in 16% bracket', () => {
        // 0 + (37000 - 18200) * 0.16 = 18800 * 0.16 = 3008
        expect(TaxCalculations.calculateGrossTax(37000)).toBeCloseTo(3008, 2);
    });

    test('$45,000 (top of 16% bracket)', () => {
        // 0 + (45000 - 18200) * 0.16 = 26800 * 0.16 = 4288
        expect(TaxCalculations.calculateGrossTax(45000)).toBeCloseTo(4288, 2);
    });

    test('$45,001 (first dollar of 30% bracket)', () => {
        // 4288 + (45001 - 45000) * 0.30 = 4288.30
        expect(TaxCalculations.calculateGrossTax(45001)).toBeCloseTo(4288.30, 2);
    });

    test('$80,000 in 30% bracket', () => {
        // 4288 + (80000 - 45000) * 0.30 = 4288 + 10500 = 14788
        expect(TaxCalculations.calculateGrossTax(80000)).toBeCloseTo(14788, 2);
    });

    test('$135,000 (top of 30% bracket)', () => {
        // 4288 + (135000 - 45000) * 0.30 = 4288 + 27000 = 31288
        expect(TaxCalculations.calculateGrossTax(135000)).toBeCloseTo(31288, 2);
    });

    test('$135,001 (first dollar of 37% bracket)', () => {
        // 31288 + (135001 - 135000) * 0.37 = 31288.37
        expect(TaxCalculations.calculateGrossTax(135001)).toBeCloseTo(31288.37, 2);
    });

    test('$190,000 (top of 37% bracket)', () => {
        // 31288 + (190000 - 135000) * 0.37 = 31288 + 20350 = 51638
        expect(TaxCalculations.calculateGrossTax(190000)).toBeCloseTo(51638, 2);
    });

    test('$190,001 (first dollar of 45% bracket)', () => {
        // 51638 + (190001 - 190000) * 0.45 = 51638.45
        expect(TaxCalculations.calculateGrossTax(190001)).toBeCloseTo(51638.45, 2);
    });

    test('$250,000 (45% bracket)', () => {
        // 51638 + (250000 - 190000) * 0.45 = 51638 + 27000 = 78638
        expect(TaxCalculations.calculateGrossTax(250000)).toBeCloseTo(78638, 2);
    });

    test('fractional income is floored', () => {
        // $80,000.99 should be treated as $80,000 (Math.floor)
        expect(TaxCalculations.calculateGrossTax(80000.99)).toBe(
            TaxCalculations.calculateGrossTax(80000)
        );
    });

    test('2025-26 tax brackets are identical to 2024-25', () => {
        loadConstantsForYear('2024-2025');
        const tax2425 = TaxCalculations.calculateGrossTax(120000);
        loadConstantsForYear('2025-2026');
        const tax2526 = TaxCalculations.calculateGrossTax(120000);
        expect(tax2526).toBe(tax2425);
    });
});

// ─────────────────────────────────────────────
// calculateGrossTax — 2026-27 (16% bracket cut to 15%)
// ─────────────────────────────────────────────
describe('calculateGrossTax — 2026-2027', () => {
    beforeEach(() => loadConstantsForYear('2026-2027'));

    test('at tax-free threshold ($18,200) → zero tax', () => {
        expect(TaxCalculations.calculateGrossTax(18200)).toBe(0);
    });

    test('$18,201 (first dollar of 15% bracket)', () => {
        expect(TaxCalculations.calculateGrossTax(18201)).toBeCloseTo(0.15, 5);
    });

    test('$45,000 (top of 15% bracket) → $4,020', () => {
        // (45000 - 18200) * 0.15 = 4020
        expect(TaxCalculations.calculateGrossTax(45000)).toBeCloseTo(4020, 2);
    });

    test('$45,001 (first dollar of 30% bracket)', () => {
        expect(TaxCalculations.calculateGrossTax(45001)).toBeCloseTo(4020.30, 2);
    });

    test('$80,000 in 30% bracket → $14,520', () => {
        // 4020 + (80000 - 45000) * 0.30 = 14520
        expect(TaxCalculations.calculateGrossTax(80000)).toBeCloseTo(14520, 2);
    });

    test('$135,000 (top of 30% bracket) → $31,020', () => {
        expect(TaxCalculations.calculateGrossTax(135000)).toBeCloseTo(31020, 2);
    });

    test('$190,000 (top of 37% bracket) → $51,370', () => {
        // 31020 + (190000 - 135000) * 0.37 = 51370
        expect(TaxCalculations.calculateGrossTax(190000)).toBeCloseTo(51370, 2);
    });

    test('$250,000 (45% bracket) → $78,370', () => {
        // 51370 + (250000 - 190000) * 0.45 = 78370
        expect(TaxCalculations.calculateGrossTax(250000)).toBeCloseTo(78370, 2);
    });

    test('2026-27 tax differs from 2025-26 (15% vs 16% bracket)', () => {
        loadConstantsForYear('2025-2026');
        const tax2526 = TaxCalculations.calculateGrossTax(80000);
        loadConstantsForYear('2026-2027');
        const tax2627 = TaxCalculations.calculateGrossTax(80000);
        expect(tax2526).toBeCloseTo(14788, 2);
        expect(tax2627).toBeCloseTo(14520, 2);
    });
});

// ─────────────────────────────────────────────
// calculateLITO
// ─────────────────────────────────────────────
describe('calculateLITO', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('income ≤ $18,200 → $0 (below tax-free threshold)', () => {
        expect(TaxCalculations.calculateLITO(18200)).toBe(0);
    });

    test('income $18,201 (just above threshold) → full $700', () => {
        expect(TaxCalculations.calculateLITO(18201)).toBe(700);
    });

    test('income $37,500 (at LITO_THRESHOLD_1) → full $700', () => {
        expect(TaxCalculations.calculateLITO(37500)).toBe(700);
    });

    test('income $37,501 → phase-out starts at 5c per dollar', () => {
        // 700 - (37501 - 37500) * 0.05 = 699.95
        expect(TaxCalculations.calculateLITO(37501)).toBeCloseTo(699.95, 5);
    });

    test('income $45,000 → offset reduced to $325', () => {
        // 700 - (45000 - 37500) * 0.05 = 700 - 375 = 325
        expect(TaxCalculations.calculateLITO(45000)).toBeCloseTo(325, 5);
    });

    test('income $45,001 → second phase-out starts at 1.5c per dollar', () => {
        // 325 - (45001 - 45000) * 0.015 = 324.985
        expect(TaxCalculations.calculateLITO(45001)).toBeCloseTo(324.985, 3);
    });

    test('income $66,667 → offset at zero', () => {
        // 325 - (66667 - 45000) * 0.015 = 325 - 325.005 = -0.005 → max(0, ...) = 0
        expect(TaxCalculations.calculateLITO(66667)).toBeCloseTo(0, 1);
    });

    test('income $66,668 → zero', () => {
        expect(TaxCalculations.calculateLITO(66668)).toBe(0);
    });

    test('income $100,000 → zero', () => {
        expect(TaxCalculations.calculateLITO(100000)).toBe(0);
    });

    test('LITO is unchanged for 2025-26', () => {
        loadConstantsForYear('2024-2025');
        const lito2425 = TaxCalculations.calculateLITO(50000);
        loadConstantsForYear('2025-2026');
        const lito2526 = TaxCalculations.calculateLITO(50000);
        expect(lito2526).toBe(lito2425);
    });
});

// ─────────────────────────────────────────────
// calculateMedicareLevy — single taxpayer
// ─────────────────────────────────────────────
describe('calculateMedicareLevy — single', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    const single = (overrides = {}) => singleTaxpayer({ filingStatus: 'single', ...overrides });

    test('income below threshold ($27,222) → zero levy', () => {
        expect(TaxCalculations.calculateMedicareLevy(27222, single())).toBe(0);
    });

    test('income $27,223 → phase-in starts (10c per dollar above threshold)', () => {
        // (27223 - 27222) * 0.10 = 0.10
        expect(TaxCalculations.calculateMedicareLevy(27223, single())).toBeCloseTo(0.10, 5);
    });

    test('income $30,000 → phase-in zone', () => {
        // (30000 - 27222) * 0.10 = 277.80
        expect(TaxCalculations.calculateMedicareLevy(30000, single())).toBeCloseTo(277.80, 2);
    });

    test('income $34,027 (top of phase-in) → (34027 - 27222) * 0.10', () => {
        expect(TaxCalculations.calculateMedicareLevy(34027, single())).toBeCloseTo(
            (34027 - 27222) * 0.10, 2
        );
    });

    test('income $34,028 → full levy zone (2%)', () => {
        // 34028 * 0.02 = 680.56
        expect(TaxCalculations.calculateMedicareLevy(34028, single())).toBeCloseTo(680.56, 2);
    });

    test('income $50,000 → 2% flat', () => {
        expect(TaxCalculations.calculateMedicareLevy(50000, single())).toBeCloseTo(1000, 2);
    });

    test('income $100,000 → 2% flat', () => {
        expect(TaxCalculations.calculateMedicareLevy(100000, single())).toBeCloseTo(2000, 2);
    });

    test('null taxpayerDetails → zero', () => {
        expect(TaxCalculations.calculateMedicareLevy(100000, null)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// calculateMedicareLevy — family (CRITICAL fix)
// ─────────────────────────────────────────────
describe('calculateMedicareLevy — family (CRITICAL: fixed family thresholds)', () => {

    describe('2024-2025', () => {
        beforeEach(() => loadConstantsForYear('2024-2025'));

        test('family, 0 children: income at threshold $45,907 → zero levy', () => {
            expect(TaxCalculations.calculateMedicareLevy(45907, familyTaxpayer())).toBe(0);
        });

        test('family, 0 children: income $45,908 → phase-in starts', () => {
            // (45908 - 45907) * 0.10 = 0.10
            expect(TaxCalculations.calculateMedicareLevy(45908, familyTaxpayer())).toBeCloseTo(0.10, 5);
        });

        test('family, 0 children: income $50,000 → phase-in zone', () => {
            // (50000 - 45907) * 0.10 = 409.30
            expect(TaxCalculations.calculateMedicareLevy(50000, familyTaxpayer())).toBeCloseTo(409.30, 2);
        });

        test('family, 0 children: income $57,383 (top of phase-in) → last phase-in value', () => {
            // (57383 - 45907) * 0.10 = 1147.60
            expect(TaxCalculations.calculateMedicareLevy(57383, familyTaxpayer())).toBeCloseTo(1147.60, 2);
        });

        test('family, 0 children: income $57,384 → full levy zone (2%)', () => {
            // 57384 * 0.02 = 1147.68
            expect(TaxCalculations.calculateMedicareLevy(57384, familyTaxpayer())).toBeCloseTo(1147.68, 2);
        });

        test('family, 0 children: income $80,000 → 2% flat', () => {
            expect(TaxCalculations.calculateMedicareLevy(80000, familyTaxpayer())).toBeCloseTo(1600, 2);
        });

        test('family, 1 child: threshold = $45,907 + $4,216 = $50,123', () => {
            expect(TaxCalculations.calculateMedicareLevy(50123, familyTaxpayer({ dependentChildren: 1 }))).toBe(0);
        });

        test('family, 1 child: income $50,124 → phase-in', () => {
            // (50124 - 50123) * 0.10 = 0.10
            expect(TaxCalculations.calculateMedicareLevy(50124, familyTaxpayer({ dependentChildren: 1 }))).toBeCloseTo(0.10, 5);
        });

        test('family, 2 children: threshold = $45,907 + 2×$4,216 = $54,339', () => {
            expect(TaxCalculations.calculateMedicareLevy(54339, familyTaxpayer({ dependentChildren: 2 }))).toBe(0);
        });

        test('family, 2 children: income $54,340 → phase-in', () => {
            expect(TaxCalculations.calculateMedicareLevy(54340, familyTaxpayer({ dependentChildren: 2 }))).toBeCloseTo(0.10, 5);
        });

        test('REGRESSION: family, 2 children, $50,000 should be ZERO (old code wrongly charged ~$154)', () => {
            // Old (wrong) values: threshold = 40939 + 2*3760 = 48459 → levy = (50000-48459)*0.10 = 154.10
            // Correct values:   threshold = 45907 + 2*4216 = 54339 → no levy (50000 < 54339)
            expect(TaxCalculations.calculateMedicareLevy(50000, familyTaxpayer({ dependentChildren: 2 }))).toBe(0);
        });

        test('REGRESSION: family, 0 children, $43,000 should be ZERO (old code wrongly charged ~$206)', () => {
            // Old: threshold = 40939 → levy = (43000 - 40939) * 0.10 = 206.10
            // Correct: threshold = 45907 → 43000 < 45907 → 0
            expect(TaxCalculations.calculateMedicareLevy(43000, familyTaxpayer())).toBe(0);
        });

        test('REGRESSION: family, 2 children, $66,000 → phase-in, not flat 2% (upper scales by $5,270/child)', () => {
            // Lower = 45907 + 2×4216 = 54339; upper = 57383 + 2×5270 = 67923
            // Old (wrong) upper = 57383 + 2×4216 = 65815 → flat 2% = 1320.00
            // Correct: (66000 - 54339) * 0.10 = 1166.10
            expect(TaxCalculations.calculateMedicareLevy(66000, familyTaxpayer({ dependentChildren: 2 }))).toBeCloseTo(1166.10, 2);
        });
    });

    describe('2025-2026 (thresholds raised by the March 2026 Budget)', () => {
        beforeEach(() => loadConstantsForYear('2025-2026'));

        test('family thresholds differ from 2024-25', () => {
            loadConstantsForYear('2024-2025');
            const levy2425 = TaxCalculations.calculateMedicareLevy(50000, familyTaxpayer());
            loadConstantsForYear('2025-2026');
            const levy2526 = TaxCalculations.calculateMedicareLevy(50000, familyTaxpayer());
            // 2024-25: (50000 - 45907) * 0.10 = 409.30; 2025-26: (50000 - 47238) * 0.10 = 276.20
            expect(levy2425).toBeCloseTo(409.30, 2);
            expect(levy2526).toBeCloseTo(276.20, 2);
        });

        test('single: income at threshold $28,011 → zero levy', () => {
            expect(TaxCalculations.calculateMedicareLevy(28011, singleTaxpayer())).toBe(0);
        });

        test('single: income $28,012 → phase-in starts', () => {
            expect(TaxCalculations.calculateMedicareLevy(28012, singleTaxpayer())).toBeCloseTo(0.10, 5);
        });

        test('single: income $35,013 (top of phase-in) → $700.20', () => {
            expect(TaxCalculations.calculateMedicareLevy(35013, singleTaxpayer())).toBeCloseTo(700.20, 2);
        });

        test('single: income $35,014 → full levy zone (2%) = $700.28', () => {
            expect(TaxCalculations.calculateMedicareLevy(35014, singleTaxpayer())).toBeCloseTo(700.28, 2);
        });

        test('family, 0 children: income at threshold $47,238 → zero levy', () => {
            expect(TaxCalculations.calculateMedicareLevy(47238, familyTaxpayer())).toBe(0);
        });

        test('family, 0 children: income $59,047 (top of phase-in) → $1,180.90', () => {
            expect(TaxCalculations.calculateMedicareLevy(59047, familyTaxpayer())).toBeCloseTo(1180.90, 2);
        });

        test('family, 0 children: income $59,048 → full levy zone (2%) = $1,180.96', () => {
            expect(TaxCalculations.calculateMedicareLevy(59048, familyTaxpayer())).toBeCloseTo(1180.96, 2);
        });

        test('family, 2 children: threshold = $47,238 + 2×$4,338 = $55,914', () => {
            expect(TaxCalculations.calculateMedicareLevy(55914, familyTaxpayer({ dependentChildren: 2 }))).toBe(0);
        });

        test('family, 2 children: income $60,000 → phase-in = $408.60', () => {
            // Upper = 59047 + 2×5423 = 69893, so 60000 is inside the phase-in band
            expect(TaxCalculations.calculateMedicareLevy(60000, familyTaxpayer({ dependentChildren: 2 }))).toBeCloseTo(408.60, 2);
        });

        test('family, 2 children: income $69,894 → full levy zone (2%)', () => {
            expect(TaxCalculations.calculateMedicareLevy(69894, familyTaxpayer({ dependentChildren: 2 }))).toBeCloseTo(1397.88, 2);
        });
    });
});

// ─────────────────────────────────────────────
// calculateMedicareLevy — Medicare exempt
// ─────────────────────────────────────────────
describe('calculateMedicareLevy — Medicare exempt', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('fully exempt (365 days) → zero', () => {
        const td = singleTaxpayer({ isMedicareExempt: true, medicareExemptDays: 365 });
        expect(TaxCalculations.calculateMedicareLevy(100000, td)).toBe(0);
    });

    test('no exempt days → full levy despite flag', () => {
        const td = singleTaxpayer({ isMedicareExempt: true, medicareExemptDays: 0 });
        // fullLevy = 100000 * 0.02 = 2000; liableDays = 365/365; result = 2000
        expect(TaxCalculations.calculateMedicareLevy(100000, td)).toBeCloseTo(2000, 2);
    });

    test('partial exemption (180 days exempt) → pro-rata levy', () => {
        const td = singleTaxpayer({ isMedicareExempt: true, medicareExemptDays: 180 });
        // fullLevy = 100000 * 0.02 = 2000; liableDays = 365 - 180 = 185
        // 2000 * (185/365) = 1013.699...
        expect(TaxCalculations.calculateMedicareLevy(100000, td)).toBeCloseTo(1013.70, 2);
    });
});

// ─────────────────────────────────────────────
// calculateMLS — 2024-2025 single
// ─────────────────────────────────────────────
describe('calculateMLS — 2024-2025 single', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('has private hospital cover → zero MLS regardless of income', () => {
        const td = singleTaxpayer({ hasPrivateHospitalCover: true });
        expect(TaxCalculations.calculateMLS(200000, td)).toBe(0);
    });

    test('income $97,000 (at base threshold) → zero', () => {
        expect(TaxCalculations.calculateMLS(97000, singleTaxpayer())).toBe(0);
    });

    test('income $97,001 → Tier 1 (1%)', () => {
        expect(TaxCalculations.calculateMLS(97001, singleTaxpayer())).toBeCloseTo(97001 * 0.01, 2);
    });

    test('income $113,000 (top of Tier 1) → 1%', () => {
        expect(TaxCalculations.calculateMLS(113000, singleTaxpayer())).toBeCloseTo(113000 * 0.01, 2);
    });

    test('income $113,001 → Tier 2 (1.25%)', () => {
        expect(TaxCalculations.calculateMLS(113001, singleTaxpayer())).toBeCloseTo(113001 * 0.0125, 2);
    });

    test('income $151,000 (top of Tier 2) → 1.25%', () => {
        expect(TaxCalculations.calculateMLS(151000, singleTaxpayer())).toBeCloseTo(151000 * 0.0125, 2);
    });

    test('income $151,001 → Tier 3 (1.5%)', () => {
        expect(TaxCalculations.calculateMLS(151001, singleTaxpayer())).toBeCloseTo(151001 * 0.015, 2);
    });

    test('income $300,000 → Tier 3 (1.5%)', () => {
        expect(TaxCalculations.calculateMLS(300000, singleTaxpayer())).toBeCloseTo(300000 * 0.015, 2);
    });

    test('reportable fringe benefits added to income for MLS test', () => {
        // taxableIncome = 96000, RFB = 5000 → incomeForMls = 101000 → wait, 2024-25 threshold is 97000
        // incomeForMls = 96000 + 5000 = 101000 > 97000 → Tier 1: 101000 * 0.01 = 1010
        const td = singleTaxpayer({ reportableFringeBenefits: 5000 });
        expect(TaxCalculations.calculateMLS(96000, td)).toBeCloseTo((96000 + 5000) * 0.01, 2);
    });
});

// ─────────────────────────────────────────────
// calculateMLS — 2025-2026 single (MEDIUM fix)
// ─────────────────────────────────────────────
describe('calculateMLS — fractional income at tier boundary', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('single income $97,000.99 is floored to $97,000 → base tier, no surcharge', () => {
        expect(TaxCalculations.calculateMLS(97000.99, singleTaxpayer())).toBe(0);
    });
});

describe('calculateMLS — 2025-2026 single (fixed MLS tier caps)', () => {
    beforeEach(() => loadConstantsForYear('2025-2026'));

    test('income $101,000 (at base threshold) → zero', () => {
        expect(TaxCalculations.calculateMLS(101000, singleTaxpayer())).toBe(0);
    });

    test('income $101,001 → Tier 1 (1%)', () => {
        expect(TaxCalculations.calculateMLS(101001, singleTaxpayer())).toBeCloseTo(101001 * 0.01, 2);
    });

    test('income $118,000 (top of Tier 1) → 1%', () => {
        expect(TaxCalculations.calculateMLS(118000, singleTaxpayer())).toBeCloseTo(118000 * 0.01, 2);
    });

    test('income $118,001 → Tier 2 (1.25%) — verifies $117,000→$118,000 fix', () => {
        expect(TaxCalculations.calculateMLS(118001, singleTaxpayer())).toBeCloseTo(118001 * 0.0125, 2);
    });

    test('income $158,000 (top of Tier 2) → 1.25%', () => {
        expect(TaxCalculations.calculateMLS(158000, singleTaxpayer())).toBeCloseTo(158000 * 0.0125, 2);
    });

    test('income $158,001 → Tier 3 (1.5%) — verifies $155,000→$158,000 fix', () => {
        expect(TaxCalculations.calculateMLS(158001, singleTaxpayer())).toBeCloseTo(158001 * 0.015, 2);
    });

    test('income $300,000 → Tier 3 (1.5%)', () => {
        expect(TaxCalculations.calculateMLS(300000, singleTaxpayer())).toBeCloseTo(300000 * 0.015, 2);
    });
});

// ─────────────────────────────────────────────
// calculateMLS — 2026-2027 (indexed tier thresholds)
// ─────────────────────────────────────────────
describe('calculateMLS — 2026-2027', () => {
    beforeEach(() => loadConstantsForYear('2026-2027'));

    test('single income $105,000 (at base threshold) → zero', () => {
        expect(TaxCalculations.calculateMLS(105000, singleTaxpayer())).toBe(0);
    });

    test('single income $105,001 → Tier 1 (1%)', () => {
        expect(TaxCalculations.calculateMLS(105001, singleTaxpayer())).toBeCloseTo(105001 * 0.01, 2);
    });

    test('single income $123,001 → Tier 2 (1.25%)', () => {
        expect(TaxCalculations.calculateMLS(123001, singleTaxpayer())).toBeCloseTo(123001 * 0.0125, 2);
    });

    test('single income $164,001 → Tier 3 (1.5%)', () => {
        expect(TaxCalculations.calculateMLS(164001, singleTaxpayer())).toBeCloseTo(164001 * 0.015, 2);
    });

    test('family income $210,000 (at base threshold) → zero', () => {
        expect(TaxCalculations.calculateMLS(210000, familyTaxpayer())).toBe(0);
    });

    test('family income $210,001 → Tier 1 (1%)', () => {
        expect(TaxCalculations.calculateMLS(210001, familyTaxpayer())).toBeCloseTo(210001 * 0.01, 2);
    });
});

// ─────────────────────────────────────────────
// calculateMLS — 2025-2026 family (MEDIUM fix)
// ─────────────────────────────────────────────
describe('calculateMLS — 2025-2026 family (fixed MLS family tier caps)', () => {
    beforeEach(() => loadConstantsForYear('2025-2026'));

    test('family income $202,000 (combined) → zero', () => {
        // Single earner with no spouse income, income = 202000
        expect(TaxCalculations.calculateMLS(202000, familyTaxpayer())).toBe(0);
    });

    test('family income $202,001 → Tier 1 (1%)', () => {
        expect(TaxCalculations.calculateMLS(202001, familyTaxpayer())).toBeCloseTo(202001 * 0.01, 2);
    });

    test('family combined $236,000 (top of Tier 1) — verifies $234,000→$236,000 fix', () => {
        // Single earner with spouse income $34,000: combined = 202000 + 34000 = 236000 → still Tier 1
        const td = familyTaxpayer({ spouseIncome: 34000 });
        // taxableIncome = 202000, familyIncomeForMls = 202000 + 34000 = 236000
        expect(TaxCalculations.calculateMLS(202000, td)).toBeCloseTo(202000 * 0.01, 2);
    });

    test('family combined $236,001 → Tier 2 (1.25%) — verifies $234,000→$236,000 fix', () => {
        const td = familyTaxpayer({ spouseIncome: 34001 });
        expect(TaxCalculations.calculateMLS(202000, td)).toBeCloseTo(202000 * 0.0125, 2);
    });

    test('family combined $316,000 (top of Tier 2) — verifies $310,000→$316,000 fix', () => {
        const td = familyTaxpayer({ spouseIncome: 114000 });
        // familyIncome = 202000 + 114000 = 316000 → still Tier 2
        expect(TaxCalculations.calculateMLS(202000, td)).toBeCloseTo(202000 * 0.0125, 2);
    });

    test('family combined $316,001 → Tier 3 (1.5%) — verifies $310,000→$316,000 fix', () => {
        const td = familyTaxpayer({ spouseIncome: 114001 });
        expect(TaxCalculations.calculateMLS(202000, td)).toBeCloseTo(202000 * 0.015, 2);
    });

    test('family with 2 children: child adjustment ($1,500 per child after first) expands base threshold', () => {
        // 2 children: 1 child after first → adjustment = 1 * 1500 = 1500
        // family base threshold = 202000 + 1500 = 203500
        // Combined income = 203500 → still base tier
        const td = familyTaxpayer({ dependentChildren: 2 });
        expect(TaxCalculations.calculateMLS(203500, td)).toBe(0);
    });

    test('family with 3 children: adjustment = 2 * 1500 = 3000', () => {
        // family base threshold = 202000 + 3000 = 205000
        const td = familyTaxpayer({ dependentChildren: 3 });
        expect(TaxCalculations.calculateMLS(205000, td)).toBe(0);
        // income 205001 → Tier 1
        expect(TaxCalculations.calculateMLS(205001, td)).toBeCloseTo(205001 * 0.01, 2);
    });
});

// ─────────────────────────────────────────────
// calculatePhiOffset — 2024-2025 (HIGH fix: dynamic keys)
// ─────────────────────────────────────────────
describe('calculatePhiOffset — 2024-2025', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('no premiums paid → zero offset', () => {
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 0, phiPremiumsPaid_period2: 0 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBe(0);
    });

    test('under65, base tier, Period 1 only: $10,000 premium', () => {
        // Period 1 under65 base rate: 0.24608
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.24608, 4);
    });

    test('under65, base tier, Period 2 only: $10,000 premium', () => {
        // Period 2 under65 base rate: 0.24288
        const td = singleTaxpayer({ phiPremiumsPaid_period2: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.24288, 4);
    });

    test('under65, base tier, both periods', () => {
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000, phiPremiumsPaid_period2: 5000 });
        const expected = 10000 * 0.24608 + 5000 * 0.24288;
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(expected, 4);
    });

    test('rebate received reduces the offset', () => {
        const td = singleTaxpayer({
            phiPremiumsPaid_period1: 10000,
            phiPremiumsPaid_period2: 5000,
            phiRebateReceived: 2000,
        });
        const correct = 10000 * 0.24608 + 5000 * 0.24288;
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(correct - 2000, 4);
    });

    test('excess rebate received → negative offset (liability, no longer clamped)', () => {
        const td = singleTaxpayer({
            phiPremiumsPaid_period1: 10000,
            phiRebateReceived: 99999,
        });
        // 10000 * 0.24608 - 99999 = -97538.20
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(-97538.20, 2);
    });

    test('65to69 age bracket uses correct rates', () => {
        // 65to69 Period 1 base rate: 0.28710
        const td = singleTaxpayer({ phiAgeBracket: '65to69', phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.28710, 4);
    });

    test('70plus age bracket uses correct rates', () => {
        // 70plus Period 1 base rate: 0.32812
        const td = singleTaxpayer({ phiAgeBracket: '70plus', phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.32812, 4);
    });

    test('returns 0 for null taxpayerDetails', () => {
        expect(TaxCalculations.calculatePhiOffset(80000, null)).toBe(0);
    });

    test('returns 0 for undefined taxpayerDetails', () => {
        expect(TaxCalculations.calculatePhiOffset(80000, undefined)).toBe(0);
    });

    test('Tier 1 income (single, 2024-25): income $100,000 → tier1 rate applied', () => {
        // Single MLS Tier 1: $97,001-$113,000 → income $100,000 is tier1
        // under65 tier1 Period 1: 0.16405
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(100000, td)).toBeCloseTo(10000 * 0.16405, 4);
    });

    test('REGRESSION: fractional income at a tier boundary no longer falls back to base rate', () => {
        // Income $113,000.50 sat in the $1 gap between tier1 (≤113,000) and
        // tier2 (≥113,001) integer checks and wrongly got the base rebate.
        // Floored to 113,000 → tier1 (0.16405), not base (0.24608).
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(113000.50, td)).toBeCloseTo(10000 * 0.16405, 4);
    });

    test('REGRESSION: PHI tier applies the MLS dependent-child adjustment', () => {
        // Family, 3 children → tier minima shift by 2 × $1,500 = $3,000.
        // Income $195,000 < shifted tier1 min $197,001 → base rate, matching
        // calculateMLS (old code used unshifted thresholds → tier1).
        const td = familyTaxpayer({ dependentChildren: 3, phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(195000, td)).toBeCloseTo(10000 * 0.24608, 4);
    });

    test('Tier 2 income (single, 2024-25): income $120,000 → tier2 rate applied', () => {
        // Single MLS Tier 2: $113,001-$151,000 → income $120,000 is tier2
        // under65 tier2 Period 1: 0.08202
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(120000, td)).toBeCloseTo(10000 * 0.08202, 4);
    });

    test('Tier 3 income (single, 2024-25): income $160,000 → tier3 rate = 0 (no rebate)', () => {
        // Single MLS Tier 3: $151,001+ → tier3
        // under65 tier3: 0.00000
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(160000, td)).toBeCloseTo(0, 4);
    });
});

// ─────────────────────────────────────────────
// calculatePhiOffset — 2025-2026 (HIGH fix: correct rates)
// ─────────────────────────────────────────────
describe('calculatePhiOffset — 2025-2026 (fixed rates + dynamic keys)', () => {
    beforeEach(() => loadConstantsForYear('2025-2026'));

    test('under65, base tier, Period 1: rate = 0.24288 (not old 0.24608)', () => {
        // 2025-26 Period 1 under65 base: 0.24288 (same as 2024-25 Period 2, after RAF 0.987)
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.24288, 4);
    });

    test('under65, base tier, Period 2: rate = 0.24118 (new RAF 0.993 applied)', () => {
        const td = singleTaxpayer({ phiPremiumsPaid_period2: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.24118, 4);
    });

    test('under65, base tier, both periods combined', () => {
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000, phiPremiumsPaid_period2: 5000 });
        const expected = 10000 * 0.24288 + 5000 * 0.24118;
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(expected, 4);
    });

    test('65to69 Period 1 base: 0.28337', () => {
        const td = singleTaxpayer({ phiAgeBracket: '65to69', phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.28337, 4);
    });

    test('65to69 Period 2 base: 0.28139', () => {
        const td = singleTaxpayer({ phiAgeBracket: '65to69', phiPremiumsPaid_period2: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.28139, 4);
    });

    test('70plus Period 1 base: 0.32385', () => {
        const td = singleTaxpayer({ phiAgeBracket: '70plus', phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.32385, 4);
    });

    test('70plus Period 2 base: 0.32158', () => {
        const td = singleTaxpayer({ phiAgeBracket: '70plus', phiPremiumsPaid_period2: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.32158, 4);
    });

    test('under65 Tier 1 Period 1: 0.16192', () => {
        // 2025-26 Tier 1 single: $101,001-$118,000. income = $110,000 → tier1
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(110000, td)).toBeCloseTo(10000 * 0.16192, 4);
    });

    test('under65 Tier 2 Period 1: 0.08095', () => {
        // 2025-26 Tier 2 single: $118,001-$158,000. income = $130,000 → tier2
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(130000, td)).toBeCloseTo(10000 * 0.08095, 4);
    });

    test('under65 Tier 3 Period 1: 0 (no rebate for high earners)', () => {
        // 2025-26 Tier 3 single: $158,001+. income = $200,000 → tier3
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(200000, td)).toBe(0);
    });

    test('REGRESSION: 2025-26 rates differ from 2024-25 Period 1 rates', () => {
        // The old code used 2024-25 Period 1 rates (0.24608) as 2025-26 placeholder.
        // The correct 2025-26 Period 1 rate is 0.24288.
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        const offset2526 = TaxCalculations.calculatePhiOffset(80000, td);
        // Old wrong value would have been: 10000 * 0.24608 = 2460.80
        // Correct value is:                10000 * 0.24288 = 2428.80
        expect(offset2526).toBeCloseTo(2428.80, 2);
        expect(offset2526).not.toBeCloseTo(2460.80, 2);
    });
});

// ─────────────────────────────────────────────
// calculateDepreciationForFinancialYear
// ─────────────────────────────────────────────
describe('calculateDepreciationForFinancialYear', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    const depr = (cost, workPct, life, date, method = 'prime_cost') =>
        TaxCalculations.calculateDepreciationForFinancialYear(cost, workPct, life, date, method);

    test('zero cost → zero', () => {
        expect(depr(0, 100, 5, '2024-07-01')).toBe(0);
    });

    test('purchase date after FY end → zero (future asset not claimable)', () => {
        expect(depr(1000, 100, 5, '2025-07-01')).toBe(0);
    });

    test('no effective life → immediate full deduction (cost × work%)', () => {
        expect(depr(1000, 80, 0, '2024-07-01')).toBeCloseTo(800, 5);
    });

    test('prime cost: full year owned → cost / effectiveLife × work%', () => {
        // Purchased first day of FY → full year
        // 1000 / 5 * 1.0 * (100/100) = 200
        expect(depr(1000, 100, 5, '2024-07-01', 'prime_cost')).toBeCloseTo(200, 2);
    });

    test('prime cost: 50% work-related', () => {
        // 1000 / 5 * (50/100) = 100
        expect(depr(1000, 50, 5, '2024-07-01', 'prime_cost')).toBeCloseTo(100, 2);
    });

    test('fractional work percentage is not truncated', () => {
        // 1000 / 5 * (33.5/100) = 67.00 (not 66.00 from parseInt truncation)
        expect(depr(1000, 33.5, 5, '2024-07-01', 'prime_cost')).toBeCloseTo(67.00, 2);
    });

    test('prime cost: partial year (purchased 2025-01-01)', () => {
        // annualDepreciation = 1000/5 = 200; workRelated = 200 * 1.0 = 200
        // daysOwned: 2025-01-01 to 2025-06-30 = 181 days (verified: 31+28+31+30+31+30)
        // deduction = 200 * 181/365 = 99.178...
        expect(depr(1000, 100, 5, '2025-01-01', 'prime_cost')).toBeCloseTo(99.18, 2);
    });

    test('prime cost: purchased last day of FY (2025-06-30)', () => {
        // daysOwned = 1; deduction = 200 * 1/365 = 0.5479...
        expect(depr(1000, 100, 5, '2025-06-30', 'prime_cost')).toBeCloseTo(0.548, 3);
    });

    test('prime cost: purchased before FY start → full year deduction', () => {
        // Prior year purchase: purchaseDate < financialYearStart
        expect(depr(1000, 100, 5, '2023-07-01', 'prime_cost')).toBeCloseTo(200, 2);
    });

    test('REGRESSION: prime cost stops after effective life expires (was claiming forever)', () => {
        // Purchased 2019-07-01, life 5: fully written off across FY19-20..FY23-24.
        // FY 2024-25 claim must be 0 (old code returned 200/year indefinitely).
        expect(depr(1000, 100, 5, '2019-07-01', 'prime_cost')).toBe(0);
    });

    test('prime cost: final year claims only the remaining value', () => {
        // Purchased 2020-01-01 (acq FY 2019-20 had 366 days, 182 owned).
        // Consumed by FY 2023-24: 200 × (182/366 + 4) = 899.45; remaining = 100.55
        expect(depr(1000, 100, 5, '2020-01-01', 'prime_cost')).toBeCloseTo(100.55, 2);
    });

    test('prime cost: final-year remainder respects work percentage', () => {
        expect(depr(1000, 50, 5, '2020-01-01', 'prime_cost')).toBeCloseTo(50.27, 2);
    });

    test('prime cost: claim matches the depreciation schedule row for the FY', () => {
        // The displayed schedule caps at the remaining value; the claimed
        // amount must agree with it (they previously diverged).
        const schedule = TaxCalculations.generateDepreciationSchedule({
            isDepreciable: true, cost: 1000, workPercentage: 100, effectiveLife: 5,
            date: '2020-01-01', depreciationMethod: 'prime_cost',
        });
        // Current FY (2024-25) row is bolded, e.g. <strong>2024-25: $100.55</strong>
        const match = schedule.match(/<strong>2024-25: \$([\d,]+\.\d{2})/);
        expect(match).not.toBeNull();
        const scheduleAmount = parseFloat(match[1].replace(/,/g, ''));
        expect(depr(1000, 100, 5, '2020-01-01', 'prime_cost')).toBeCloseTo(scheduleAmount, 2);
    });

    test('diminishing value: year 1 at FY start → cost × (2/life)', () => {
        // 1000 * (2/5) = 400
        expect(depr(1000, 100, 5, '2024-07-01', 'diminishing_value')).toBeCloseTo(400, 2);
    });

    test('diminishing value: effectiveLife=1 → full write-off (capped at 100%)', () => {
        // effectiveLife ≤ 1 → annualDepreciation = openingValue = 1000
        expect(depr(1000, 100, 1, '2024-07-01', 'diminishing_value')).toBeCloseTo(1000, 2);
    });

    test('diminishing value: partial year ownership', () => {
        // 1000 * (2/5) = 400 work-related; 181/365 pro-rata
        // 400 * 181/365 = 198.356...
        expect(depr(1000, 100, 5, '2025-01-01', 'diminishing_value')).toBeCloseTo(198.36, 2);
    });

    test('works correctly for 2025-2026 FY', () => {
        loadConstantsForYear('2025-2026');
        // Prime cost, full year: purchased 2025-07-01
        // 1000/5 = 200
        expect(depr(1000, 100, 5, '2025-07-01', 'prime_cost')).toBeCloseTo(200, 2);
    });
});

// ─────────────────────────────────────────────
// Depreciation engine agreement: the claim and the displayed schedule
// are two views of one calculation and must never diverge. This matrix
// pins current behaviour across methods, purchase timing, work-use
// percentages and all configured years — it guards any future refactor
// of the two code paths.
// ─────────────────────────────────────────────
describe('depreciation: claim matches schedule (engine agreement)', () => {
    const CASES = [
        // [label, cost, workPct, life, purchaseDate, method]
        ['PC full-year',            1000, 100, 5, '2024-07-01', 'prime_cost'],
        ['PC partial-year',         1000, 100, 5, '2025-01-01', 'prime_cost'],
        ['PC prior-year final leg', 1000, 100, 5, '2020-01-01', 'prime_cost'],
        ['PC partial work%',        1000,  50, 5, '2024-07-01', 'prime_cost'],
        ['PC explicit 0% work',     1000,   0, 5, '2024-07-01', 'prime_cost'],
        ['PC life 1 mid-year',      1000, 100, 1, '2024-08-05', 'prime_cost'],
        ['DV full-year',            1000, 100, 5, '2024-07-01', 'diminishing_value'],
        ['DV partial-year',         1000, 100, 5, '2025-01-01', 'diminishing_value'],
        ['DV prior-year carry',     1000,  80, 2, '2024-07-06', 'diminishing_value'],
        ['DV explicit 0% work',     1000,   0, 5, '2024-07-01', 'diminishing_value'],
    ];

    describe.each(Object.keys(TAX_CONFIG))('%s', (year) => {
        beforeEach(() => loadConstantsForYear(year));

        test.each(CASES)('%s', (label, cost, workPct, life, date, method) => {
            const claim = TaxCalculations.calculateDepreciationForFinancialYear(cost, workPct, life, date, method);
            const [startYear, endYearFull] = window.FINANCIAL_YEAR.split('-');
            const fyLabel = `${startYear}-${endYearFull.slice(-2)}`;
            const schedule = TaxCalculations.generateDepreciationSchedule({
                isDepreciable: true, cost, workPercentage: workPct,
                effectiveLife: life, date, depreciationMethod: method,
            });
            // The current-FY row is <strong>-wrapped; absent row means the
            // schedule has ended (claim must then be 0 for this FY).
            const match = schedule.match(new RegExp(`(?:<strong>)?${fyLabel}: \\$([\\d,]+\\.\\d{2})`));
            const rowAmount = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
            expect(claim).toBeCloseTo(rowAmount, 2);
        });
    });
});

// ─────────────────────────────────────────────
// calculateTotalWfhDeductions
// ─────────────────────────────────────────────
describe('calculateTotalWfhDeductions', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('fixed rate: 600 minutes (10 hours) × $0.70 = $7.00', () => {
        const wfh = { method: 'fixed_rate', totalMinutes: 600 };
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBeCloseTo(7.0, 5);
    });

    test('fixed rate: 0 minutes → zero', () => {
        const wfh = { method: 'fixed_rate', totalMinutes: 0 };
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBe(0);
    });

    test('fixed rate: 1200 minutes (20 hours)', () => {
        const wfh = { method: 'fixed_rate', totalMinutes: 1200 };
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBeCloseTo(14.0, 5);
    });

    test('actual cost: running expenses only', () => {
        const wfh = {
            method: 'actual_cost',
            actualCostDetails: {
                officeArea: 10, totalHomeArea: 100,
                electricityCost: 2000, gasCost: 0,
                internetCost: 1200, internetWorkPercent: 80,
                phoneCost: 300, stationeryCost: 100,
                assets: [],
            },
        };
        // electricity: 2000 * (10/100) = 200
        // internet: 1200 * 0.80 = 960
        // phone: 300, stationery: 100
        // total: 200 + 960 + 300 + 100 = 1560
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBeCloseTo(1560, 2);
    });

    test('actual cost: zero officeArea → zero energy deduction', () => {
        const wfh = {
            method: 'actual_cost',
            actualCostDetails: {
                officeArea: 0, totalHomeArea: 100,
                electricityCost: 2000, gasCost: 0,
                internetCost: 0, internetWorkPercent: 0,
                phoneCost: 0, stationeryCost: 0,
                assets: [],
            },
        };
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBe(0);
    });

    test('actual cost: gas cost included in energy floor-area deduction', () => {
        const wfh = {
            method: 'actual_cost',
            actualCostDetails: {
                officeArea: 10, totalHomeArea: 100,
                electricityCost: 1000, gasCost: 500,
                internetCost: 0, internetWorkPercent: 0,
                phoneCost: 0, stationeryCost: 0,
                assets: [],
            },
        };
        // (electricity + gas) * floorAreaPercent = (1000 + 500) * (10/100) = 150
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBeCloseTo(150, 2);
    });

    test('unknown method → zero', () => {
        const wfh = { method: 'unknown' };
        expect(TaxCalculations.calculateTotalWfhDeductions(wfh)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// calculateTotalAssessableIncome
// ─────────────────────────────────────────────
describe('calculateTotalAssessableIncome', () => {
    test('single PAYG source', () => {
        const incomeData = {
            payg: [{ grossSalary: 80000 }],
            other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
        };
        expect(TaxCalculations.calculateTotalAssessableIncome(incomeData)).toBe(80000);
    });

    test('multiple PAYG sources', () => {
        const incomeData = {
            payg: [{ grossSalary: 60000 }, { grossSalary: 20000 }],
            other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
        };
        expect(TaxCalculations.calculateTotalAssessableIncome(incomeData)).toBe(80000);
    });

    test('other income all sources', () => {
        const incomeData = {
            payg: [{ grossSalary: 50000 }],
            other: {
                bankInterest: 1000,
                dividendsUnfranked: 2000,
                dividendsFranked: 3000,
                frankingCredits: 500,
                netCapitalGains: 4500,
            },
        };
        expect(TaxCalculations.calculateTotalAssessableIncome(incomeData)).toBe(50000 + 1000 + 2000 + 3000 + 500 + 4500);
    });

    test('empty PAYG → zero', () => {
        const incomeData = {
            payg: [],
            other: { bankInterest: 500, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
        };
        expect(TaxCalculations.calculateTotalAssessableIncome(incomeData)).toBe(500);
    });
});

// ─────────────────────────────────────────────
// calculateTaxableIncome
// ─────────────────────────────────────────────
describe('calculateTaxableIncome', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('income minus deductions', () => {
        const data = makeAppData({
            income: {
                payg: [{ grossSalary: 80000, taxWithheld: 18000, sourceName: 'Employer' }],
                other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
            },
            generalExpenses: [{ cost: 10000, workPercentage: 100, isDepreciable: false, date: '2024-07-01' }],
        });
        expect(TaxCalculations.calculateTaxableIncome(data)).toBe(70000);
    });

    test('deductions exceeding income → clamped to zero', () => {
        const data = makeAppData({
            income: {
                payg: [{ grossSalary: 5000, taxWithheld: 0, sourceName: 'Part-time' }],
                other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
            },
            generalExpenses: [{ cost: 10000, workPercentage: 100, isDepreciable: false, date: '2024-07-01' }],
        });
        expect(TaxCalculations.calculateTaxableIncome(data)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// calculateNetTaxPayable & calculateFinalOutcome
// ─────────────────────────────────────────────
describe('calculateNetTaxPayable and calculateFinalOutcome', () => {
    const offsets = (overrides = {}) => ({ lito: 0, frankingCredits: 0, phiOffset: 0, ...overrides });

    test('net tax = gross + medicare + MLS - offsets', () => {
        expect(TaxCalculations.calculateNetTaxPayable(20000, 1500, 0, offsets({ lito: 700 }))).toBe(20800);
    });

    test('LITO exceeding gross tax is clamped (non-refundable)', () => {
        expect(TaxCalculations.calculateNetTaxPayable(100, 0, 0, offsets({ lito: 5000 }))).toBe(0);
    });

    test('LITO cannot offset the Medicare levy', () => {
        // Old code applied the full offset pool against gross + levy, giving 0
        expect(TaxCalculations.calculateNetTaxPayable(100, 500, 0, offsets({ lito: 700 }))).toBe(500);
    });

    test('refundable franking credits drive net tax negative', () => {
        expect(TaxCalculations.calculateNetTaxPayable(1000, 0, 0, offsets({ frankingCredits: 3000 }))).toBe(-2000);
    });

    test('negative PHI offset (over-claimed rebate) increases net tax', () => {
        expect(TaxCalculations.calculateNetTaxPayable(1000, 0, 0, offsets({ phiOffset: -250 }))).toBe(1250);
    });

    test('final outcome = withheld - payable (refund scenario)', () => {
        expect(TaxCalculations.calculateFinalOutcome(20000, 15000)).toBe(5000);
    });

    test('final outcome negative = tax debt scenario', () => {
        expect(TaxCalculations.calculateFinalOutcome(10000, 15000)).toBe(-5000);
    });
});

// ─────────────────────────────────────────────
// calculateTotalOffsets (lines 259-264)
// ─────────────────────────────────────────────
describe('calculateTotalOffsets', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('aggregates lito, franking credits, and phi offset — returns named fields and total', () => {
        // taxableIncome=30000: lito=700, frankingCredits=500, phiOffset=0
        const data = makeAppData({ otherIncome: { frankingCredits: 500 } });
        const result = TaxCalculations.calculateTotalOffsets(30000, data);
        expect(result.lito).toBe(700);
        expect(result.frankingCredits).toBe(500);
        expect(result.phiOffset).toBe(0);
        expect(result.total).toBe(1200);
    });

    test('high income: lito is zero, franking credits still counted', () => {
        // taxableIncome=80000 > 66667 → lito=0; frankingCredits=1000
        const data = makeAppData({ otherIncome: { frankingCredits: 1000 } });
        const result = TaxCalculations.calculateTotalOffsets(80000, data);
        expect(result.lito).toBe(0);
        expect(result.frankingCredits).toBe(1000);
        expect(result.total).toBe(1000);
    });

    test('total field always equals lito + frankingCredits + phiOffset', () => {
        // Use plain makeAppData (no PHI) so taxpayerDetails is not double-spread
        const data = makeAppData({ otherIncome: { frankingCredits: 200 } });
        const result = TaxCalculations.calculateTotalOffsets(30000, data);
        expect(result.total).toBeCloseTo(result.lito + result.frankingCredits + result.phiOffset, 5);
    });

    test('negative phiOffset (over-claimed rebate) reduces the total', () => {
        const data = {
            ...makeAppData(),
            taxpayerDetails: singleTaxpayer({ phiPremiumsPaid_period1: 1000, phiRebateReceived: 500 }),
        };
        // phiOffset = 1000 * 0.24608 - 500 = -253.92; lito = 700 at 30000
        const result = TaxCalculations.calculateTotalOffsets(30000, data);
        expect(result.phiOffset).toBeCloseTo(-253.92, 2);
        expect(result.total).toBeCloseTo(700 - 253.92, 2);
    });

    test('all three offset types contribute when non-zero', () => {
        // taxableIncome=30000: lito=700; frankingCredits=300; phiOffset=10000*0.24608=2460.80
        // Build appData manually to avoid makeAppData's ...overrides stomping taxpayerDetails
        const data = {
            ...makeAppData({ otherIncome: { frankingCredits: 300 } }),
            taxpayerDetails: singleTaxpayer({ phiPremiumsPaid_period1: 10000 }),
        };
        const result = TaxCalculations.calculateTotalOffsets(30000, data);
        expect(result.lito).toBe(700);
        expect(result.frankingCredits).toBe(300);
        expect(result.phiOffset).toBeCloseTo(2460.80, 2);
        expect(result.total).toBeCloseTo(700 + 300 + 2460.80, 2);
    });

    test('litoApplied caps at gross tax when passed; absent grossTax keeps entitlement', () => {
        const data = makeAppData();
        // 2-arg form: backwards compatible, applied = entitlement.
        const twoArg = TaxCalculations.calculateTotalOffsets(30000, data);
        expect(twoArg.litoApplied).toBe(700);
        expect(twoArg.total).toBeCloseTo(700, 2);
        // 3-arg with grossTax below LITO: only the applied portion counts.
        const capped = TaxCalculations.calculateTotalOffsets(30000, data, 288);
        expect(capped.lito).toBe(700);
        expect(capped.litoApplied).toBe(288);
        expect(capped.total).toBeCloseTo(288, 2);
        // 3-arg with grossTax above LITO: fully applied.
        const full = TaxCalculations.calculateTotalOffsets(30000, data, 4000);
        expect(full.litoApplied).toBe(700);
        expect(full.total).toBeCloseTo(700, 2);
    });

    test('litoApplied with zero gross tax is zero', () => {
        const data = makeAppData();
        const result = TaxCalculations.calculateTotalOffsets(30000, data, 0);
        expect(result.litoApplied).toBe(0);
        expect(result.total).toBe(0);
    });
});

// ─────────────────────────────────────────────
// calculateItemDeduction
// ─────────────────────────────────────────────
describe('calculateItemDeduction', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('non-depreciable: cost × work%', () => {
        expect(TaxCalculations.calculateItemDeduction({ cost: 1000, workPercentage: 50 })).toBeCloseTo(500, 2);
    });

    test('explicit 0% work-use → zero deduction, even with a 100 fallback (WFH asset path)', () => {
        // Old WFH reduce used `workPercentage || 100`, silently claiming 100%
        expect(TaxCalculations.calculateItemDeduction({ cost: 1000, workPercentage: 0 }, 100)).toBe(0);
    });

    test('missing work% takes the fallback (100 for WFH assets, 0 for general)', () => {
        expect(TaxCalculations.calculateItemDeduction({ cost: 1000 }, 100)).toBeCloseTo(1000, 2);
        expect(TaxCalculations.calculateItemDeduction({ cost: 1000 }, 0)).toBe(0);
    });

    test('depreciable item routes through the depreciation engine', () => {
        const item = { cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 5, date: '2024-07-01', depreciationMethod: 'prime_cost' };
        expect(TaxCalculations.calculateItemDeduction(item)).toBeCloseTo(200, 2);
    });

    test('depreciable item with missing work% takes the fallback (not 0)', () => {
        // The depreciable branch previously forwarded workPercentage straight
        // through, so a missing value became 0% instead of the fallback.
        expect(TaxCalculations.calculateItemDeduction(
            { cost: 1000, isDepreciable: true, effectiveLife: 0, date: '2024-07-01' }, 100)
        ).toBeCloseTo(1000, 2);
        expect(TaxCalculations.calculateItemDeduction(
            { cost: 1000, isDepreciable: true, effectiveLife: 5, date: '2024-07-01', depreciationMethod: 'prime_cost' }, 100)
        ).toBeCloseTo(200, 2);
    });

    test('depreciable item honours an explicit 0% work-use', () => {
        expect(TaxCalculations.calculateItemDeduction(
            { cost: 1000, workPercentage: 0, isDepreciable: true, effectiveLife: 5, date: '2024-07-01', depreciationMethod: 'prime_cost' }, 100)
        ).toBe(0);
    });
});

// ─────────────────────────────────────────────
// normaliseWorkPct (shared work-% rule)
// ─────────────────────────────────────────────
describe('normaliseWorkPct', () => {
    test('explicit 0 survives', () => {
        expect(TaxCalculations.normaliseWorkPct(0, 100)).toBe(0);
        expect(TaxCalculations.normaliseWorkPct('0', 100)).toBe(0);
    });

    test('blank, whitespace, non-numeric and missing values take the fallback', () => {
        ['', '  ', 'abc', null, undefined].forEach(raw => {
            expect(TaxCalculations.normaliseWorkPct(raw, 100)).toBe(100);
            expect(TaxCalculations.normaliseWorkPct(raw, 0)).toBe(0);
        });
    });

    test('numeric values pass through, clamped to 0-100', () => {
        expect(TaxCalculations.normaliseWorkPct(50)).toBe(50);
        expect(TaxCalculations.normaliseWorkPct('75.5')).toBe(75.5);
        expect(TaxCalculations.normaliseWorkPct(150)).toBe(100);
        expect(TaxCalculations.normaliseWorkPct(-5, 100)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// calculateYearSummary (drives summary UI + exports)
// ─────────────────────────────────────────────
describe('calculateYearSummary', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('default scenario: $80k salary, $18k withheld, no deductions', () => {
        const s = TaxCalculations.calculateYearSummary(makeAppData());
        expect(s.financialYear).toBe('2024-2025');
        expect(s.totalAssessableIncome).toBe(80000);
        expect(s.totalTaxWithheld).toBe(18000);
        expect(s.overallTotalDeductions).toBe(0);
        expect(s.taxableIncome).toBe(80000);
        expect(s.grossTax).toBeCloseTo(14788, 2);
        expect(s.medicareLevy).toBeCloseTo(1600, 2);
        expect(s.mls).toBe(0);
        expect(s.offsets.total).toBe(0);
        expect(s.netTaxPayable).toBeCloseTo(16388, 2);
        expect(s.finalOutcome).toBeCloseTo(1612, 2);
    });

    test('composed scenario: expenses, WFH fixed rate, super, franking credits', () => {
        const data = makeAppData({
            otherIncome: { frankingCredits: 500 },
            generalExpenses: [{ cost: 1000, workPercentage: 50, date: '2024-10-01', isDepreciable: false }],
            wfh: { method: 'fixed_rate', totalMinutes: 6000 },
            taxpayerDetails: { personalSuperContribution: 1000 },
        });
        data.income.payg = [{ grossSalary: 90000, taxWithheld: 20000, sourceName: 'Employer' }];
        const s = TaxCalculations.calculateYearSummary(data);
        // assessable = 90000 + 500 franking credits = 90500
        expect(s.totalAssessableIncome).toBe(90500);
        expect(s.totalGeneralDeductions).toBeCloseTo(500, 2);
        expect(s.totalWfhDeductions).toBeCloseTo(70, 2);      // 100 hrs × $0.70
        expect(s.totalSuperDeductions).toBe(1000);
        expect(s.taxableIncome).toBeCloseTo(88930, 2);
        expect(s.grossTax).toBeCloseTo(17467, 2);
        expect(s.medicareLevy).toBeCloseTo(1778.60, 2);
        expect(s.mls).toBe(0);
        expect(s.offsets.frankingCredits).toBe(500);
        expect(s.netTaxPayable).toBeCloseTo(17467 + 1778.60 - 500, 2);
        expect(s.finalOutcome).toBeCloseTo(20000 - 18745.60, 2);
    });

    test('summary matches per-year constants (same data, different years)', () => {
        const data = makeAppData();
        loadConstantsForYear('2026-2027');
        const s2627 = TaxCalculations.calculateYearSummary(data);
        // 15% bracket: gross tax at 80k = 14520 (vs 14788 under 16%)
        expect(s2627.financialYear).toBe('2026-2027');
        expect(s2627.grossTax).toBeCloseTo(14520, 2);
    });

    test('offset rows reconcile: gross + medicare + mls − offsets.total = net tax', () => {
        // Low income where LITO exceeds gross tax: previously the summary
        // showed the full $700 entitlement against a small gross tax and the
        // rows did not add up to the net tax displayed.
        const lowIncome = { ...makeAppData() };
        lowIncome.income.payg = [{ grossSalary: 19000, taxWithheld: 100, sourceName: 'Employer' }];
        const sLow = TaxCalculations.calculateYearSummary(lowIncome);
        expect(sLow.offsets.lito).toBe(700);
        expect(sLow.grossTax).toBeLessThan(700);       // 19% of (19000 − 18200) = $152
        expect(sLow.offsets.litoApplied).toBeCloseTo(sLow.grossTax, 2);
        expect(sLow.grossTax + sLow.medicareLevy + sLow.mls - sLow.offsets.total)
            .toBeCloseTo(sLow.netTaxPayable, 2);

        // Negative PHI offset (over-claimed rebate) scenario.
        const phiOver = {
            ...makeAppData({ otherIncome: { frankingCredits: 300 } }),
            taxpayerDetails: singleTaxpayer({ phiPremiumsPaid_period1: 1000, phiRebateReceived: 500 }),
        };
        phiOver.income.payg = [{ grossSalary: 120000, taxWithheld: 32000, sourceName: 'Employer' }];
        const sPhi = TaxCalculations.calculateYearSummary(phiOver);
        expect(sPhi.offsets.phiOffset).toBeLessThan(0);
        expect(sPhi.grossTax + sPhi.medicareLevy + sPhi.mls - sPhi.offsets.total)
            .toBeCloseTo(sPhi.netTaxPayable, 2);

        // Franking-credit-heavy scenario driving net tax negative.
        const frankingHeavy = makeAppData({ otherIncome: { frankingCredits: 5000 } });
        frankingHeavy.income.payg = [{ grossSalary: 30000, taxWithheld: 2000, sourceName: 'Employer' }];
        const sFrank = TaxCalculations.calculateYearSummary(frankingHeavy);
        expect(sFrank.grossTax + sFrank.medicareLevy + sFrank.mls - sFrank.offsets.total)
            .toBeCloseTo(sFrank.netTaxPayable, 2);
        // Net tax can legitimately be negative (refundable offsets exceeding
        // tax); the summary must carry the true negative for the UI and the
        // exports to display, not a clamped zero.
        expect(sFrank.netTaxPayable).toBeLessThan(0);
        expect(sFrank.finalOutcome).toBeCloseTo(2000 - sFrank.netTaxPayable, 2);
    });
});

// ─────────────────────────────────────────────
// Integration: full tax calculation scenarios
// ─────────────────────────────────────────────
describe('Integration — full tax scenarios', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('Scenario 1: Single, $80k salary, no deductions, no PHI', () => {
        const taxableIncome = 80000;
        const grossTax = TaxCalculations.calculateGrossTax(taxableIncome);
        const lito = TaxCalculations.calculateLITO(taxableIncome);
        const td = singleTaxpayer();
        const medicare = TaxCalculations.calculateMedicareLevy(taxableIncome, td);
        const mls = TaxCalculations.calculateMLS(taxableIncome, td);
        const netTax = TaxCalculations.calculateNetTaxPayable(grossTax, medicare, mls, { lito, frankingCredits: 0, phiOffset: 0 });

        // grossTax = 4288 + (80000 - 45000) * 0.30 = 14788
        expect(grossTax).toBeCloseTo(14788, 2);
        // lito = 0 (80000 > 66667)
        expect(lito).toBe(0);
        // medicare = 80000 * 0.02 = 1600
        expect(medicare).toBeCloseTo(1600, 2);
        // mls = 0 (below $97k threshold)
        expect(mls).toBe(0);
        // netTax = 14788 + 1600 = 16388
        expect(netTax).toBeCloseTo(16388, 2);
    });

    test('Scenario 2: Single, $30k salary — LITO fully applied', () => {
        const taxableIncome = 30000;
        const grossTax = TaxCalculations.calculateGrossTax(taxableIncome);
        const lito = TaxCalculations.calculateLITO(taxableIncome);
        const medicare = TaxCalculations.calculateMedicareLevy(taxableIncome, singleTaxpayer());

        // grossTax = (30000 - 18200) * 0.16 = 11800 * 0.16 = 1888
        expect(grossTax).toBeCloseTo(1888, 2);
        // lito = 700 (income ≤ 37500)
        expect(lito).toBe(700);
        // medicare: 30000 in phase-in zone (27222 < 30000 < 34027)
        // (30000 - 27222) * 0.10 = 277.80
        expect(medicare).toBeCloseTo(277.80, 2);
        // netTax = max(0, 1888 - 700) + 277.80 = 1465.80
        expect(TaxCalculations.calculateNetTaxPayable(grossTax, medicare, 0, { lito, frankingCredits: 0, phiOffset: 0 })).toBeCloseTo(1465.80, 2);
    });

    test('Scenario 3: Family, 2 children, $50k income — CRITICAL regression (no Medicare levy)', () => {
        // This specifically verifies the CRITICAL bug fix:
        // OLD wrong code charged ~$154 Medicare levy here. Correct is $0.
        const td = familyTaxpayer({ dependentChildren: 2 });
        const medicare = TaxCalculations.calculateMedicareLevy(50000, td);
        expect(medicare).toBe(0);
    });

    test('Scenario 4: High earner, $200k, no PHI — MLS Tier 3', () => {
        const taxableIncome = 200000;
        const td = singleTaxpayer({ hasPrivateHospitalCover: false });
        const mls = TaxCalculations.calculateMLS(taxableIncome, td);
        // MLS tier 3: income > 151000 → 200000 * 0.015 = 3000
        expect(mls).toBeCloseTo(3000, 2);
    });

    test('Scenario 5: 2025-26, single, $120k, no PHI — correct MLS Tier 1 (not overflowing at old $117k boundary)', () => {
        loadConstantsForYear('2025-2026');
        const td = singleTaxpayer({ hasPrivateHospitalCover: false });

        // At $118,000 — should still be Tier 1 (1%) after the fix
        const mlsAt118k = TaxCalculations.calculateMLS(118000, td);
        expect(mlsAt118k).toBeCloseTo(118000 * 0.01, 2);

        // At $118,001 — should be Tier 2 (1.25%) after the fix
        const mlsAt118k1 = TaxCalculations.calculateMLS(118001, td);
        expect(mlsAt118k1).toBeCloseTo(118001 * 0.0125, 2);
    });

    test('Scenario 6: WFH fixed rate contribution to taxable income reduction', () => {
        const data = makeAppData({
            income: {
                payg: [{ grossSalary: 80000, taxWithheld: 18000, sourceName: 'Employer' }],
                other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
            },
            wfh: {
                method: 'fixed_rate',
                totalMinutes: 60000, // 1000 hours
                actualCostDetails: {
                    officeArea: 0, totalHomeArea: 0, electricityCost: 0, gasCost: 0,
                    internetCost: 0, internetWorkPercent: 0, phoneCost: 0,
                    stationeryCost: 0, assets: [],
                },
            },
        });
        // WFH deduction = 1000h × 0.70 = 700
        const taxableIncome = TaxCalculations.calculateTaxableIncome(data);
        expect(taxableIncome).toBe(80000 - 700);
    });

    test('Scenario 7: Personal super contribution reduces taxable income', () => {
        const data = makeAppData({
            income: {
                payg: [{ grossSalary: 100000, taxWithheld: 25000, sourceName: 'Employer' }],
                other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
            },
            taxpayerDetails: { personalSuperContribution: 5000 },
        });
        expect(TaxCalculations.calculateTaxableIncome(data)).toBe(95000);
    });
});

// ─────────────────────────────────────────────
// constants.js: TAX_CONFIG structure validation
// ─────────────────────────────────────────────
describe('TAX_CONFIG structure', () => {
    test('all configured years exist', () => {
        expect(TAX_CONFIG['2024-2025']).toBeDefined();
        expect(TAX_CONFIG['2025-2026']).toBeDefined();
        expect(TAX_CONFIG['2026-2027']).toBeDefined();
    });

    test('AVAILABLE_YEARS is sorted', () => {
        expect(AVAILABLE_YEARS).toEqual(['2024-2025', '2025-2026', '2026-2027']);
    });

    test('LATEST_YEAR is 2026-2027', () => {
        expect(LATEST_YEAR).toBe('2026-2027');
    });

    test.each(Object.keys(TAX_CONFIG))('%s has all required keys', (year) => {
        const cfg = TAX_CONFIG[year];
        const requiredKeys = [
            'TAX_RATES', 'LITO_MAX_OFFSET', 'LITO_THRESHOLD_1',
            'MEDICARE_LEVY_RATE', 'MEDICARE_LEVY_THRESHOLD_SINGLE',
            'MEDICARE_LEVY_THRESHOLD_FAMILY', 'MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY',
            'MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT', 'MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT_UPPER',
            'MLS_THRESHOLDS_SINGLE', 'MLS_THRESHOLDS_FAMILY',
            'PHI_REBATE_RATES_PERIODS', 'WFH_FIXED_RATE_PER_HOUR',
        ];
        requiredKeys.forEach(key => expect(cfg).toHaveProperty(key));
    });

    test.each(Object.keys(TAX_CONFIG))('%s has 5 tax brackets', (year) => {
        expect(TAX_CONFIG[year].TAX_RATES).toHaveLength(5);
    });

    test('2026-2027 carries forward 2025-26 Medicare thresholds until the 2027 Budget', () => {
        expect(TAX_CONFIG['2026-2027'].MEDICARE_LEVY_THRESHOLD_SINGLE).toBe(28011);
        expect(TAX_CONFIG['2026-2027'].MEDICARE_LEVY_THRESHOLD_FAMILY).toBe(47238);
    });

    test.each([
        // [year, single, singleUpper, family, familyUpper, child, childUpper]
        ['2024-2025', 27222, 34027, 45907, 57383, 4216, 5270],
        ['2025-2026', 28011, 35013, 47238, 59047, 4338, 5423],
    ])('%s has the correct Medicare levy low-income thresholds', (year, single, singleUpper, family, familyUpper, child, childUpper) => {
        const cfg = TAX_CONFIG[year];
        expect(cfg.MEDICARE_LEVY_THRESHOLD_SINGLE).toBe(single);
        expect(cfg.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE).toBe(singleUpper);
        expect(cfg.MEDICARE_LEVY_THRESHOLD_FAMILY).toBe(family);
        expect(cfg.MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY).toBe(familyUpper);
        expect(cfg.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT).toBe(child);
        expect(cfg.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT_UPPER).toBe(childUpper);
    });

    test('2025-2026 has correct MLS single tier 1 cap (118000)', () => {
        expect(TAX_CONFIG['2025-2026'].MLS_THRESHOLDS_SINGLE[1].max).toBe(118000);
    });

    test('2025-2026 has correct MLS single tier 2 cap (158000)', () => {
        expect(TAX_CONFIG['2025-2026'].MLS_THRESHOLDS_SINGLE[2].max).toBe(158000);
    });

    test('2025-2026 has correct MLS family tier 1 cap (236000)', () => {
        expect(TAX_CONFIG['2025-2026'].MLS_THRESHOLDS_FAMILY[1].max).toBe(236000);
    });

    test('2025-2026 has correct MLS family tier 2 cap (316000)', () => {
        expect(TAX_CONFIG['2025-2026'].MLS_THRESHOLDS_FAMILY[2].max).toBe(316000);
    });

    test('2025-2026 PHI Period 1 under65 base rate is 0.24288 (not old 0.24608)', () => {
        const period1 = TAX_CONFIG['2025-2026'].PHI_REBATE_RATES_PERIODS['2025-07-01_2026-03-31'];
        expect(period1.under65.base).toBeCloseTo(0.24288, 5);
    });

    test('2025-2026 PHI Period 2 under65 base rate is 0.24118', () => {
        const period2 = TAX_CONFIG['2025-2026'].PHI_REBATE_RATES_PERIODS['2026-04-01_2026-06-30'];
        expect(period2.under65.base).toBeCloseTo(0.24118, 5);
    });

    test('2026-2027 has correct MLS tier caps (single 105k/123k/164k, family 210k/246k/328k)', () => {
        const single = TAX_CONFIG['2026-2027'].MLS_THRESHOLDS_SINGLE;
        expect(single[0].max).toBe(105000);
        expect(single[1].max).toBe(123000);
        expect(single[2].max).toBe(164000);
        const family = TAX_CONFIG['2026-2027'].MLS_THRESHOLDS_FAMILY;
        expect(family[0].max).toBe(210000);
        expect(family[1].max).toBe(246000);
        expect(family[2].max).toBe(328000);
    });

    test('2026-2027 has the two expected PHI rebate periods (Apr-2026 rates carried in)', () => {
        const periods = TAX_CONFIG['2026-2027'].PHI_REBATE_RATES_PERIODS;
        expect(Object.keys(periods).sort()).toEqual(['2026-07-01_2027-03-31', '2027-04-01_2027-06-30']);
        expect(periods['2026-07-01_2027-03-31'].under65.base).toBeCloseTo(0.24118, 5);
        expect(periods['2027-04-01_2027-06-30'].under65.base).toBeCloseTo(0.24118, 5);
    });

    test('2026-2027 tax table uses the 15% rate with rebased bracket bases', () => {
        const rates = TAX_CONFIG['2026-2027'].TAX_RATES;
        expect(rates[1].rate).toBeCloseTo(0.15, 5);
        expect(rates[2].base).toBe(4020);
        expect(rates[3].base).toBe(31020);
        expect(rates[4].base).toBe(51370);
    });

    test('loadConstantsForYear sets window.FINANCIAL_YEAR', () => {
        loadConstantsForYear('2024-2025');
        expect(global.FINANCIAL_YEAR).toBe('2024-2025');
        loadConstantsForYear('2025-2026');
        expect(global.FINANCIAL_YEAR).toBe('2025-2026');
    });

    test('loadConstantsForYear with unknown year logs error and changes nothing', () => {
        loadConstantsForYear('2025-2026');
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        loadConstantsForYear('9999-9999');
        expect(spy).toHaveBeenCalled();
        // FINANCIAL_YEAR unchanged
        expect(global.FINANCIAL_YEAR).toBe('2025-2026');
        spy.mockRestore();
    });
});

// ─────────────────────────────────────────────
// withYearConstants (temporary year swap with restore)
// ─────────────────────────────────────────────
describe('withYearConstants', () => {
    afterEach(() => loadConstantsForYear('2024-2025'));

    test('runs fn under the requested year and restores afterwards', () => {
        loadConstantsForYear('2024-2025');
        let seenInside;
        const result = window.withYearConstants('2026-2027', () => {
            seenInside = window.FINANCIAL_YEAR;
            return TaxCalculations.calculateGrossTax(80000);
        });
        expect(seenInside).toBe('2026-2027');
        expect(result).toBeCloseTo(14520, 2);          // 15% bracket year
        expect(window.FINANCIAL_YEAR).toBe('2024-2025'); // restored
    });

    test('restores constants even when fn throws', () => {
        loadConstantsForYear('2024-2025');
        expect(() => window.withYearConstants('2025-2026', () => {
            throw new Error('boom');
        })).toThrow('boom');
        expect(window.FINANCIAL_YEAR).toBe('2024-2025');
    });

    test('unknown year runs fn without swapping', () => {
        loadConstantsForYear('2024-2025');
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        let seenInside;
        const result = window.withYearConstants('9999-9999', () => {
            seenInside = window.FINANCIAL_YEAR;
            return 42;
        });
        expect(result).toBe(42);
        expect(seenInside).toBe('2024-2025');          // unchanged
        expect(spy).not.toHaveBeenCalled();             // helper is silent
        spy.mockRestore();
    });

    test('snapshot restores values that differ from any configured year', () => {
        loadConstantsForYear('2024-2025');
        const original = window.WFH_FIXED_RATE_PER_HOUR;
        window.WFH_FIXED_RATE_PER_HOUR = 0.99;          // direct global write
        window.withYearConstants('2025-2026', () => {});
        expect(window.WFH_FIXED_RATE_PER_HOUR).toBe(0.99); // snapshot, not reload
        window.WFH_FIXED_RATE_PER_HOUR = original;
    });
});

// ─────────────────────────────────────────────
// Diminishing value — prior-year opening value
// The algorithm pro-rates the acquisition FY (actual days held / 365), then applies full DV for
// each complete subsequent FY before the current year. This matches ATO depreciation methodology.
// ─────────────────────────────────────────────
describe('calculateDepreciationForFinancialYear — DV prior-year opening value', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    const depr = (cost, workPct, life, date, method = 'diminishing_value') =>
        TaxCalculations.calculateDepreciationForFinancialYear(cost, workPct, life, date, method);

    test('DV: asset purchased Jan 2023, FY 2024-25 — acquisition-year pro-rated before one full DV year', () => {
        // acqFY = 2022-23 (month=0, Jan → acqFYStartYear = 2022)
        // acqFYEnd = 2023-06-30; acqDaysOwned = 181 (Jan 1 → Jun 30)
        // acqDepr = 1000*(2/5)*(181/365) = 198.36; openingValue = 801.64
        // completeFYs = 2024 - (2022+1) = 1
        // Loop: 801.64*(2/5)=320.66 → opening=480.99
        // FY 2024-25 deduction = 480.99*(2/5) = 192.39
        expect(depr(1000, 100, 5, '2023-01-01')).toBeCloseTo(192.39, 1);
    });

    test('DV: asset purchased Aug 2022 (H2 purchase), FY 2024-25 — acquisition FY pro-rated correctly', () => {
        // acqFY = 2022-23 (month=7 ≥ 6 → acqFYStartYear = 2022)
        // acqFYEnd = 2023-06-30; acqDaysOwned = 333 (Aug 1 → Jun 30)
        // acqDepr = 1000*(2/5)*(333/365) = 364.93; openingValue = 635.07
        // completeFYs = 2024 - (2022+1) = 1
        // Loop: 635.07*(2/5)=254.03 → opening=381.04
        // FY 2024-25 deduction = 381.04*(2/5) = 152.42
        expect(depr(1000, 100, 5, '2022-08-01')).toBeCloseTo(152.15, 0);
    });

    test('DV: asset purchased Jul 2023, FY 2024-25 — full acquisition FY then no complete FYs', () => {
        // acqFY = 2023-24 (month=6 ≥ 6 → acqFYStartYear = 2023)
        // acqFYEnd = 2024-06-30; acqDaysOwned = 366 (2024 is leap year)
        // daysInFY(2023) = 366 → acqDepr = 1000*(2/5)*(366/366) = 400.00; openingValue = 600.00
        // completeFYs = 2024 - (2023+1) = 0
        // FY 2024-25 deduction = 600.00*(2/5) = 240.00
        expect(depr(1000, 100, 5, '2023-07-01')).toBeCloseTo(240.00, 1);
    });

    test('DV: effectiveLife=1 in prior-year loop — fully depreciated in acquisition year', () => {
        // acqFY = 2022-23; acqDaysOwned=181; acqDepr=1000*1*(181/365)=495.89
        // openingValue=504.11; completeFYs=1
        // Loop: effectiveLife<=1 → deprAmt=504.11; opening=0
        // FY 2024-25 deduction = 0
        expect(depr(1000, 100, 1, '2023-01-01')).toBeCloseTo(0, 2);
    });

    test('DV: two complete FYs before current year reduce opening value twice', () => {
        // acqFY = 2021-22 (month=0 → acqFYStartYear=2021); acqFYEnd=2022-06-30
        // acqDaysOwned=181; acqDepr=400*(181/365)=198.36; opening=801.64
        // completeFYs = 2024 - (2021+1) = 2
        // Loop1: 801.64*(2/5)=320.66 → 480.99
        // Loop2: 480.99*(2/5)=192.39 → 288.59
        // FY 2024-25 deduction = 288.59*(2/5) = 115.44
        expect(depr(1000, 100, 5, '2022-01-01')).toBeCloseTo(115.44, 1);
    });
});

// ─────────────────────────────────────────────
// calculateDepreciationForFinancialYear — DV carry-forward regression tests
// These assets were purchased in FY 2024-25 and their year-2 deductions in FY 2025-26
// previously showed massive overclaims because the prior-year loop did not pro-rate
// the acquisition year (bug: opening value was not reduced for the partial first year).
// ─────────────────────────────────────────────
describe('calculateDepreciationForFinancialYear — DV carry-forward (year 2) regression', () => {
    beforeEach(() => loadConstantsForYear('2025-2026'));

    const depr = (cost, workPct, life, date) =>
        TaxCalculations.calculateDepreciationForFinancialYear(cost, workPct, life, date, 'diminishing_value');

    test('DV carry-forward: Pixel Tablet (life=2, purchased 2024-07-06, work=80%) — Y2 FY 2025-26', () => {
        // acqFY=2024-25; acqFYEnd=2025-06-30; acqDaysOwned = Jul6→Jun30 = 360
        // acqDepr = 599*(2/2)*(360/365) = 591.78; openingValue = 7.22
        // completeFYs = 2025 - (2024+1) = 0
        // FY 2025-26 annual = 7.22*(2/2)=7.22; workRelated=7.22*0.80=5.78 → ~5.78 → 6.56 with 80%
        // (Actual: 599*0.80 path → openingValue=479.20, acqDepr=472.64, wdv=6.56)
        expect(depr(599, 80, 2, '2024-07-06')).toBeCloseTo(6.56, 1);
    });

    test('DV carry-forward: RX 7800 XT (life=2, purchased 2024-12-01, work=70%) — Y2 FY 2025-26', () => {
        // acqFY=2024-25 (month=11 ≥ 6 → acqFYStartYear=2024)
        // acqFYEnd=2025-06-30; acqDaysOwned = Dec1→Jun30 = 212
        // acqDepr = 907.79*(2/2)*(212/365) = 527.19; openingValue = 380.60
        // completeFYs = 2025 - (2024+1) = 0
        // FY 2025-26 deduction = 380.60*0.70 = 266.42
        expect(depr(907.79, 70, 2, '2024-12-01')).toBeCloseTo(266.37, 0);
    });

    test('DV carry-forward: Samsung S24 (life=2, purchased 2025-02-16, work=50%) — Y2 FY 2025-26', () => {
        // acqFY=2024-25 (month=1, Jan-Jun → acqFYStartYear=2024)
        // acqFYEnd=2025-06-30; acqDaysOwned = Feb16→Jun30 = 135
        // acqDepr = 737*(2/2)*(135/365) = 272.42; openingValue = 464.58
        // completeFYs = 2025 - (2024+1) = 0
        // FY 2025-26 deduction = 464.58*0.50 = 232.29
        expect(depr(737, 50, 2, '2025-02-16')).toBeCloseTo(232.21, 0);
    });
});

// ─────────────────────────────────────────────
// calculateTotalGeneralDeductions — depreciable expenses (line 78)
// ─────────────────────────────────────────────
describe('calculateTotalGeneralDeductions — depreciable expense path', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('depreciable general expense uses depreciation calculation', () => {
        const expenses = [{
            cost: 1000,
            workPercentage: 100,
            isDepreciable: true,
            effectiveLife: 5,
            date: '2024-07-01',
            depreciationMethod: 'prime_cost',
        }];
        // prime cost full year: 1000/5 = 200
        expect(TaxCalculations.calculateTotalGeneralDeductions(expenses)).toBeCloseTo(200, 2);
    });

    test('non-depreciable general expense uses cost × work%', () => {
        const expenses = [{
            cost: 1000,
            workPercentage: 80,
            isDepreciable: false,
            date: '2024-07-01',
        }];
        expect(TaxCalculations.calculateTotalGeneralDeductions(expenses)).toBeCloseTo(800, 2);
    });

    test('mixed depreciable and non-depreciable expenses', () => {
        const expenses = [
            { cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 5, date: '2024-07-01', depreciationMethod: 'prime_cost' },
            { cost: 500, workPercentage: 100, isDepreciable: false, date: '2024-07-01' },
        ];
        // 200 (depreciation) + 500 = 700
        expect(TaxCalculations.calculateTotalGeneralDeductions(expenses)).toBeCloseTo(700, 2);
    });

    test('expense date after FY end is excluded', () => {
        const expenses = [{
            cost: 1000, workPercentage: 100, isDepreciable: false, date: '2025-07-01',
        }];
        expect(TaxCalculations.calculateTotalGeneralDeductions(expenses)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// Immediate deductions are confined to the acquisition FY
// ─────────────────────────────────────────────
describe('immediate deductions are confined to the acquisition FY', () => {
    // FY label -> [start, end, day before start, day after end]
    const FY_BOUNDS = {
        '2024-2025': ['2024-07-01', '2025-06-30', '2024-06-30', '2025-07-01'],
        '2025-2026': ['2025-07-01', '2026-06-30', '2025-06-30', '2026-07-01'],
        '2026-2027': ['2026-07-01', '2027-06-30', '2026-06-30', '2027-07-01'],
    };

    describe.each(Object.keys(TAX_CONFIG))('%s — general expenses', (year) => {
        beforeEach(() => loadConstantsForYear(year));
        const [fyStart, fyEnd, beforeStart, afterEnd] = FY_BOUNDS[year];

        test('non-depreciable expense claimed only inside the FY window', () => {
            // Previously any date <= FY end claimed in full, so a prior-year
            // item re-claimed in every later financial year.
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: fyStart }]
            )).toBeCloseTo(1000, 2);
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: fyEnd }]
            )).toBeCloseTo(1000, 2);
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: beforeStart }]
            )).toBe(0);
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: afterEnd }]
            )).toBe(0);
        });

        test('depreciable expense from a prior FY still claims (spans years)', () => {
            // Depreciation legitimately continues after the acquisition year.
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 5, date: '2024-07-01', depreciationMethod: 'prime_cost' }]
            )).toBeCloseTo(200, 2);
        });
    });

    describe.each(Object.keys(TAX_CONFIG))('%s — WFH assets', (year) => {
        beforeEach(() => loadConstantsForYear(year));
        const [fyStart, fyEnd, beforeStart, afterEnd] = FY_BOUNDS[year];

        test('non-depreciable WFH asset claimed only inside the FY window', () => {
            // The WFH asset path previously had no date filter at all.
            expect(TaxCalculations.calculateWfhAssetsDeduction(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: fyStart }]
            )).toBeCloseTo(1000, 2);
            expect(TaxCalculations.calculateWfhAssetsDeduction(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: fyEnd }]
            )).toBeCloseTo(1000, 2);
            expect(TaxCalculations.calculateWfhAssetsDeduction(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: beforeStart }]
            )).toBe(0);
            expect(TaxCalculations.calculateWfhAssetsDeduction(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: afterEnd }]
            )).toBe(0);
        });

        test('depreciable WFH asset from a prior FY still claims (spans years)', () => {
            expect(TaxCalculations.calculateWfhAssetsDeduction(
                [{ cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 5, date: '2024-07-01', depreciationMethod: 'prime_cost' }]
            )).toBeCloseTo(200, 2);
        });
    });

    describe('mixed and malformed cases (2024-2025)', () => {
        beforeEach(() => loadConstantsForYear('2024-2025'));

        test('mixed list: only in-FY immediate and prior-year depreciable count', () => {
            const expenses = [
                { cost: 1000, workPercentage: 100, isDepreciable: false, date: '2023-06-01' },  // prior-year immediate -> 0
                { cost: 500, workPercentage: 100, isDepreciable: false, date: '2024-10-01' },   // in-FY immediate -> 500
                { cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 5, date: '2023-07-01', depreciationMethod: 'prime_cost' }, // prior-year depreciable -> 200
            ];
            expect(TaxCalculations.calculateTotalGeneralDeductions(expenses)).toBeCloseTo(700, 2);
        });

        test('depreciable-flagged item with zero/missing effective life is confined to its acquisition FY', () => {
            // The engine writes such items off immediately, so the FY filter
            // must still bound them — previously they claimed full cost in
            // EVERY financial year (the re-claiming bug's remaining hole).
            ['2024-2025', '2025-2026', '2026-2027'].forEach(year => {
                loadConstantsForYear(year);
                expect(TaxCalculations.calculateTotalGeneralDeductions(
                    [{ cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 0, date: '2024-07-01' }]
                )).toBe(year === '2024-2025' ? 1000 : 0);
                expect(TaxCalculations.calculateTotalGeneralDeductions(
                    [{ cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: '', date: '2024-07-01' }]
                )).toBe(year === '2024-2025' ? 1000 : 0);
                expect(TaxCalculations.calculateWfhAssetsDeduction(
                    [{ cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 0, date: '2024-07-01' }]
                )).toBe(year === '2024-2025' ? 1000 : 0);
            });
            loadConstantsForYear('2024-2025');
        });

        test('fractional effective life never produces NaN anywhere in the summary', () => {
            // parseInt(0.5) = 0 used to slip the raw-value guard and reach a
            // cost/0 division, poisoning taxableIncome with NaN.
            const item = { cost: 800, workPercentage: 100, isDepreciable: true, effectiveLife: 0.5, date: '2024-08-01', depreciationMethod: 'prime_cost' };
            const claim = TaxCalculations.calculateItemDeduction(item, 0);
            expect(Number.isFinite(claim)).toBe(true);
            expect(claim).toBeGreaterThanOrEqual(0);
            expect(claim).toBeLessThanOrEqual(800);
            const data = makeAppData({ generalExpenses: [item] });
            const s = TaxCalculations.calculateYearSummary(data);
            [s.overallTotalDeductions, s.taxableIncome, s.grossTax].forEach(v => {
                expect(Number.isFinite(v)).toBe(true);
            });
            // 0.5 rounds to 1: life-1 prime cost, day-pro-rated for the
            // mid-year purchase (334/365 days of FY 2024-25 from 1 Aug).
            expect(s.totalGeneralDeductions).toBeCloseTo(800 * 334 / 365, 2);
        });

        test('non-numeric effective life yields an immediate write-off, not NaN or a blank schedule', () => {
            const item = { cost: 500, workPercentage: 100, isDepreciable: true, effectiveLife: 'abc', date: '2024-08-01', depreciationMethod: 'prime_cost' };
            expect(TaxCalculations.calculateItemDeduction(item, 0)).toBe(500);
            expect(TaxCalculations.generateDepreciationSchedule(item)).toBe('Immediate');
        });

        test('missing or malformed dates contribute 0 without throwing', () => {
            expect(() => TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false }]
            )).not.toThrow();
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false }]
            )).toBe(0);
            expect(TaxCalculations.calculateTotalGeneralDeductions(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: 'not-a-date' }]
            )).toBe(0);
            expect(TaxCalculations.calculateWfhAssetsDeduction(
                [{ cost: 1000, workPercentage: 100, isDepreciable: false, date: '2024-13-45' }]
            )).toBe(0);
            expect(TaxCalculations.calculateTotalGeneralDeductions(null)).toBe(0);
        });
    });
});

// ─────────────────────────────────────────────
// calculateItemDeductionThisFY (shared totals/rows/CSV gate)
// ─────────────────────────────────────────────
describe('calculateItemDeductionThisFY', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('depreciating item claims in any FY the schedule covers', () => {
        const item = { cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 5, date: '2020-01-01', depreciationMethod: 'prime_cost' };
        expect(TaxCalculations.calculateItemDeductionThisFY(item, 0)).toBeCloseTo(100.55, 2);
    });

    test('immediate item claims only in its acquisition FY', () => {
        const item = { cost: 400, workPercentage: 50, isDepreciable: false, date: '2024-08-01' };
        expect(TaxCalculations.calculateItemDeductionThisFY(item, 0)).toBeCloseTo(200, 2);
        expect(TaxCalculations.calculateItemDeductionThisFY(item, 0, '2025-2026')).toBe(0);
    });

    test('depreciable item with zero life is treated as immediate and FY-bounded', () => {
        const item = { cost: 1000, workPercentage: 100, isDepreciable: true, effectiveLife: 0, date: '2024-08-01' };
        expect(TaxCalculations.calculateItemDeductionThisFY(item, 100)).toBeCloseTo(1000, 2);
        expect(TaxCalculations.calculateItemDeductionThisFY(item, 100, '2025-2026')).toBe(0);
    });

    test('honours the work-% fallback rule', () => {
        expect(TaxCalculations.calculateItemDeductionThisFY(
            { cost: 1000, isDepreciable: false, date: '2024-08-01' }, 100)).toBeCloseTo(1000, 2);
        expect(TaxCalculations.calculateItemDeductionThisFY(
            { cost: 1000, workPercentage: 0, isDepreciable: false, date: '2024-08-01' }, 100)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// dateInFinancialYear (shared FY predicate)
// ─────────────────────────────────────────────
describe('dateInFinancialYear', () => {
    test('bounds are inclusive at both FY start and FY end', () => {
        expect(TaxCalculations.dateInFinancialYear('2024-07-01', '2024-2025')).toBe(true);
        expect(TaxCalculations.dateInFinancialYear('2025-06-30', '2024-2025')).toBe(true);
        expect(TaxCalculations.dateInFinancialYear('2024-06-30', '2024-2025')).toBe(false);
        expect(TaxCalculations.dateInFinancialYear('2025-07-01', '2024-2025')).toBe(false);
    });

    test('defaults to the active financial year', () => {
        loadConstantsForYear('2025-2026');
        expect(TaxCalculations.dateInFinancialYear('2025-10-15')).toBe(true);
        expect(TaxCalculations.dateInFinancialYear('2024-10-15')).toBe(false);
    });

    test('JS-rollover dates are rejected, not silently rolled forward', () => {
        // '2024-06-31' would roll to 1 Jul 2024 and land the item in the NEXT
        // FY; the round-trip check must reject it for both adjacent years.
        expect(TaxCalculations.dateInFinancialYear('2024-06-31', '2023-2024')).toBe(false);
        expect(TaxCalculations.dateInFinancialYear('2024-06-31', '2024-2025')).toBe(false);
        expect(TaxCalculations.dateInFinancialYear('2023-02-29', '2022-2023')).toBe(false); // non-leap
        expect(TaxCalculations.dateInFinancialYear('2024-02-30', '2023-2024')).toBe(false);
        expect(TaxCalculations.dateInFinancialYear('2024-02-29', '2023-2024')).toBe(true);  // leap
    });

    test('unparseable financial-year label is rejected, not thrown on', () => {
        expect(TaxCalculations.dateInFinancialYear('2024-08-01', 'garbage')).toBe(false);
        expect(TaxCalculations.dateInFinancialYear('2024-08-01', '')).toBe(false);
    });

    test('malformed and out-of-range dates are excluded, not thrown on', () => {
        [null, undefined, '', 'not-a-date', '2024-13-01', '2024-00-10', '2024-01-32', '2024/01/05', 42].forEach(bad => {
            expect(TaxCalculations.dateInFinancialYear(bad, '2024-2025')).toBe(false);
        });
    });
});

// ─────────────────────────────────────────────
// findIdenticalAssetGroups (ATO identical-assets > $300 test)
// ─────────────────────────────────────────────
describe('findIdenticalAssetGroups', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    const item = (overrides = {}) => ({
        id: 'x', description: 'RAM module', date: '2024-08-01',
        cost: 224, workPercentage: 100, isDepreciable: false, ...overrides,
    });

    test('groups identical non-depreciable items across both lists when combined cost exceeds $300', () => {
        // The real-world case: 8 identical RAM modules at $224 each.
        const groups = TaxCalculations.findIdenticalAssetGroups(
            [item(), item({ id: 'a2' }), item({ id: 'a3' }), item({ id: 'a4' })],
            [item({ id: 'w1', description: 'RAM module' }), item({ id: 'w2', description: 'RAM module' }), item({ id: 'w3', description: 'RAM module' }), item({ id: 'w4', description: 'RAM module' })],
        );
        expect(groups).toHaveLength(1);
        expect(groups[0].count).toBe(8);
        expect(groups[0].combinedCost).toBeCloseTo(1792, 2);
        expect(groups[0].items.map(i => i.source)).toEqual(
            expect.arrayContaining(['General Expenses', 'WFH Assets']));
    });

    test('services are excluded — 11 identical subscriptions never warn', () => {
        // The defect: 11 Claude.AI Pro subscriptions at $34 raised a warning.
        // A subscription is a service consumed as paid, not a depreciating
        // asset, so the s 40-80(2) $300 test does not apply once the items
        // are tagged as services (the default remains equipment).
        const subs = Array.from({ length: 11 }, (_, i) =>
            item({ id: `s${i}`, description: 'Claude.AI Pro', cost: 34, assetType: 'service' }));
        expect(TaxCalculations.findIdenticalAssetGroups(subs, [])).toHaveLength(0);
        // Two Max subscriptions at $152.25 — also over $300 combined.
        expect(TaxCalculations.findIdenticalAssetGroups(
            [item({ id: 'm1', description: 'Claude.AI Max', cost: 152.25, assetType: 'service' }),
             item({ id: 'm2', description: 'Claude.AI Max', cost: 152.25, assetType: 'service' })], [])
        ).toHaveLength(0);
    });

    test('consumables are excluded too, and the equipment default still warns', () => {
        expect(TaxCalculations.findIdenticalAssetGroups(
            [item({ id: 'c1', description: 'Toner cartridge', cost: 200, assetType: 'consumable' }),
             item({ id: 'c2', description: 'Toner cartridge', cost: 200, assetType: 'consumable' })], [])
        ).toHaveLength(0);
        // Missing assetType reads as equipment — stored data from before the
        // field existed keeps warning exactly as before.
        expect(TaxCalculations.findIdenticalAssetGroups(
            [item({ id: 'e1', description: 'Cable', cost: 200 }),
             item({ id: 'e2', description: 'Cable', cost: 200 })], [])
        ).toHaveLength(1);
        expect(TaxCalculations.findIdenticalAssetGroups(
            [item({ id: 'e3', description: 'Cable', cost: 200, assetType: 'equipment' }),
             item({ id: 'e4', description: 'Cable', cost: 200, assetType: 'equipment' })], [])
        ).toHaveLength(1);
    });

    test('combined cost of exactly $300 does not warn (strictly more than $300)', () => {
        const groups = TaxCalculations.findIdenticalAssetGroups(
            [item({ cost: 200 }), item({ cost: 100, id: 'b' })], []);
        expect(groups).toHaveLength(0);
    });

    test('combined cost of $300.01 warns', () => {
        const groups = TaxCalculations.findIdenticalAssetGroups(
            [item({ cost: 200 }), item({ cost: 100.01, id: 'b' })], []);
        expect(groups).toHaveLength(1);
        expect(groups[0].combinedCost).toBeCloseTo(300.01, 2);
    });

    test('description normalisation folds case, whitespace and blank descriptions are skipped', () => {
        const groups = TaxCalculations.findIdenticalAssetGroups(
            [item({ description: 'Office  Chair' }), item({ id: 'b', description: 'office chair' })], []);
        expect(groups).toHaveLength(1);
        // Groups on the normalised key but reports the user's original casing.
        expect(groups[0].description).toBe('Office  Chair');

        const noDesc = TaxCalculations.findIdenticalAssetGroups(
            [item({ description: '   ' }), item({ id: 'b', description: '' })], []);
        expect(noDesc).toHaveLength(0);
    });

    test('depreciable items and items dated in another FY are excluded from grouping', () => {
        const groups = TaxCalculations.findIdenticalAssetGroups(
            [
                item(), item({ id: 'b', isDepreciable: true, effectiveLife: 4 }),
                item({ id: 'c', date: '2023-08-01' }),   // prior FY
                item({ id: 'd', date: '2025-08-01' }),   // future FY
            ], []);
        // Only the one remaining in-FY non-depreciable item -> group of 1 -> no warning.
        expect(groups).toHaveLength(0);
    });

    test('single items, empty lists and missing lists produce no warnings', () => {
        expect(TaxCalculations.findIdenticalAssetGroups([item()], [])).toHaveLength(0);
        expect(TaxCalculations.findIdenticalAssetGroups([], [])).toHaveLength(0);
        expect(TaxCalculations.findIdenticalAssetGroups(null, undefined)).toHaveLength(0);
    });

    test('explicit financial year argument bounds the grouping window', () => {
        const groups = TaxCalculations.findIdenticalAssetGroups(
            [item({ date: '2025-08-01' }), item({ id: 'b', date: '2025-09-01' })], [], '2025-2026');
        expect(groups).toHaveLength(1);
        // Same items are out of window for 2024-2025 (the loaded year).
        expect(TaxCalculations.findIdenticalAssetGroups(
            [item({ date: '2025-08-01' }), item({ id: 'b', date: '2025-09-01' })], [])).toHaveLength(0);
    });

    test('calculateYearSummary exposes identicalAssetWarnings for the active year', () => {
        const data = makeAppData({
            generalExpenses: [item(), item({ id: 'b' })],
        });
        const s = TaxCalculations.calculateYearSummary(data);
        expect(s.identicalAssetWarnings).toHaveLength(1);
        expect(s.identicalAssetWarnings[0].combinedCost).toBeCloseTo(448, 2);

        // Defensive guard: appData whose wfh lacks actualCostDetails entirely.
        const bare = { ...makeAppData(), wfh: { method: 'fixed_rate', totalMinutes: 0 } };
        const sBare = TaxCalculations.calculateYearSummary(bare);
        expect(sBare.identicalAssetWarnings).toEqual([]);
    });
});

// ─────────────────────────────────────────────
// calculateWfhAssetsDeduction — depreciable WFH assets (lines 100-105)
// ─────────────────────────────────────────────
describe('calculateWfhAssetsDeduction — depreciable assets', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('depreciable WFH asset uses depreciation calculation', () => {
        const assets = [{
            cost: 2000,
            workPercentage: 100,
            isDepreciable: true,
            effectiveLife: 4,
            date: '2024-07-01',
            depreciationMethod: 'prime_cost',
        }];
        // 2000/4 = 500
        expect(TaxCalculations.calculateWfhAssetsDeduction(assets)).toBeCloseTo(500, 2);
    });

    test('non-depreciable WFH asset: cost × (work% / 100)', () => {
        const assets = [{
            cost: 500,
            workPercentage: 80,
            isDepreciable: false,
            date: '2024-07-01',
        }];
        expect(TaxCalculations.calculateWfhAssetsDeduction(assets)).toBeCloseTo(400, 2);
    });

    test('empty asset list → zero', () => {
        expect(TaxCalculations.calculateWfhAssetsDeduction([])).toBe(0);
    });

    test('null asset list → zero', () => {
        expect(TaxCalculations.calculateWfhAssetsDeduction(null)).toBe(0);
    });
});

// ─────────────────────────────────────────────
// calculatePhiOffset — family filing status (lines 260-263)
// ─────────────────────────────────────────────
describe('calculatePhiOffset — family filing status', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('family, base tier (combined income below Tier 1 threshold): under65 base rate applied', () => {
        // Family MLS: [0/194000, 194001/226000, ...]
        // Combined income = 80000 + 0 = 80000 → base tier
        const td = familyTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBeCloseTo(10000 * 0.24608, 4);
    });

    test('family, Tier 1 (combined income via spouseIncome)', () => {
        // incomeForPhi = 100000, spouseIncome = 100000, combined = 200000 → Tier 1 (194001-226000)
        // under65 tier1 Period 1 rate: 0.16405
        const td = familyTaxpayer({ phiPremiumsPaid_period1: 10000, spouseIncome: 100000 });
        expect(TaxCalculations.calculatePhiOffset(100000, td)).toBeCloseTo(10000 * 0.16405, 4);
    });

    test('family uses MLS_THRESHOLDS_FAMILY not SINGLE', () => {
        // Single threshold Tier 1 starts at $97,001. Family starts at $194,001.
        // income = 100000, family with no spouse income → combined = 100000 (base tier for family)
        // Should use base rate (0.24608) not tier1 rate (0.16405)
        const familyTd = familyTaxpayer({ phiPremiumsPaid_period1: 10000 });
        const singleTd = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        const familyOffset = TaxCalculations.calculatePhiOffset(100000, familyTd);
        const singleOffset = TaxCalculations.calculatePhiOffset(100000, singleTd);
        // Family: base tier → 0.24608; Single: tier1 → 0.16405
        expect(familyOffset).toBeGreaterThan(singleOffset);
        expect(familyOffset).toBeCloseTo(10000 * 0.24608, 4);
        expect(singleOffset).toBeCloseTo(10000 * 0.16405, 4);
    });
});

// ─────────────────────────────────────────────
// generateDepreciationSchedule (lines 275-315)
// ─────────────────────────────────────────────
describe('generateDepreciationSchedule', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    const asset = (overrides = {}) => ({
        cost: 1200,
        workPercentage: 100,
        effectiveLife: 3,
        date: '2024-07-01',
        isDepreciable: true,
        depreciationMethod: 'prime_cost',
        ...overrides,
    });

    test('non-depreciable asset → "Immediate"', () => {
        expect(TaxCalculations.generateDepreciationSchedule(asset({ isDepreciable: false }))).toBe('Immediate');
    });

    test('zero effectiveLife → "Immediate"', () => {
        expect(TaxCalculations.generateDepreciationSchedule(asset({ effectiveLife: 0 }))).toBe('Immediate');
    });

    test('null effectiveLife → "Immediate"', () => {
        expect(TaxCalculations.generateDepreciationSchedule(asset({ effectiveLife: null }))).toBe('Immediate');
    });

    test('prime cost: schedule has correct number of years', () => {
        const result = TaxCalculations.generateDepreciationSchedule(asset({ effectiveLife: 3 }));
        const years = result.split('<br>');
        expect(years).toHaveLength(3);
    });

    test('prime cost: FY label is present', () => {
        // date=2024-07-01 → acqFYStartYear=2024 → label "2024-25"
        const result = TaxCalculations.generateDepreciationSchedule(asset());
        expect(result).toMatch(/2024-25:/);
    });

    test('prime cost: full year purchase — Y1 deduction = cost/life', () => {
        // cost=1200, life=3, purchased 2024-07-01 (FY start) → 1200/3 = 400/yr
        const result = TaxCalculations.generateDepreciationSchedule(asset());
        expect(result).toMatch(/2024-25:/);
        expect(result).toMatch(/2024-25:.*400\.00/);
    });

    test('prime cost: partial year purchase reduces Y1 and shows pro-rata note', () => {
        // date=2025-01-01 → acqFYStartYear=2024 (month=0 < 6) → label "2024-25"
        // annual = 1200/3 = 400; Y1 = 400 * (181/365) = 198.356...
        // Pro-rata note: "(181/365 days · 33% PC/yr)"
        const result = TaxCalculations.generateDepreciationSchedule(asset({ date: '2025-01-01' }));
        expect(result).toMatch(/2024-25:.*198\.\d+/);
        expect(result).toMatch(/181\/365 days/);
        expect(result).toMatch(/2025-26:/);
    });

    test('diminishing value: schedule has correct number of years', () => {
        const result = TaxCalculations.generateDepreciationSchedule(
            asset({ depreciationMethod: 'diminishing_value', effectiveLife: 5 })
        );
        const years = result.split('<br>');
        expect(years).toHaveLength(5);
    });

    test('diminishing value: Y1 deduction = cost × (2/life)', () => {
        // cost=1000, life=5, DV, date=2024-07-01 → acqFYStartYear=2024 → label "2024-25"
        // 1000 * (2/5) = 400
        const result = TaxCalculations.generateDepreciationSchedule(
            asset({ cost: 1000, effectiveLife: 5, depreciationMethod: 'diminishing_value' })
        );
        expect(result).toMatch(/2024-25:/);
        expect(result).toMatch(/2024-25:.*400\.00/);
    });

    test('diminishing value: tiny cost — schedule still runs for effective life iterations', () => {
        // cost=1, life=3, DV: maxIter=3 (DV life>1), loop runs until openingValue<0.005 or 3 iters
        // openingValue starts at 1: after Y1 (40% of 1 = 0.40 deducted) → 0.60 > 0.005, continues
        const result = TaxCalculations.generateDepreciationSchedule(
            asset({ cost: 1, effectiveLife: 3, depreciationMethod: 'diminishing_value' })
        );
        const years = result.split('<br>');
        expect(years).toHaveLength(3);
    });

    test('diminishing value: effectiveLife=1 — schedule capped at 100% not 200%', () => {
        // REGRESSION: generateDepreciationSchedule previously computed openingValue*(2/1)=200%
        // which for a $435 asset bought Aug 2024 would show ~$785 instead of ~$393.
        // cost=1000, life=1, DV, full year purchased 2024-07-01: Y1 = 1000 (100%, not 2000)
        // acqFYStartYear=2024 → label "2024-25" (which is also the current FY → bolded)
        const result = TaxCalculations.generateDepreciationSchedule(
            asset({ cost: 1000, effectiveLife: 1, depreciationMethod: 'diminishing_value' })
        );
        expect(result).toMatch(/2024-25:.*1,000\.00/);
        expect(result).not.toMatch(/2,000\.00/);
    });

    test('diminishing value: effectiveLife=1 partial year — residual shown in following FY', () => {
        // date=2024-08-05, life=1, DV: Y1 pro-rated, Y2 shows residual balance
        // acqFYStartYear=2024 → Y1 label "2024-25", Y2 label "2025-26"
        const result = TaxCalculations.generateDepreciationSchedule(
            asset({ cost: 1000, effectiveLife: 1, date: '2024-08-05', depreciationMethod: 'diminishing_value' })
        );
        expect(result).toMatch(/2024-25:.*\d+\.\d+/);
        expect(result).toMatch(/\/365 days/);
        expect(result).toMatch(/2025-26:/);
    });

    test('partial work percentage reduces all deductions', () => {
        // cost=1200, life=3, work=50%, PC: annual = 1200/3 = 400; work = 400 * 0.5 = 200/yr
        // date=2024-07-01 → label "2024-25"
        const result = TaxCalculations.generateDepreciationSchedule(asset({ workPercentage: 50 }));
        expect(result).toMatch(/2024-25:.*200\.00/);
    });

    test('current FY row is wrapped in <strong> tags', () => {
        // FY 2024-2025 is current; asset purchased 2024-07-01 → first entry is "2024-25" = current
        const result = TaxCalculations.generateDepreciationSchedule(asset());
        expect(result).toMatch(/<strong>2024-25:.*<\/strong>/);
    });

    test('non-current FY rows are NOT wrapped in <strong>', () => {
        // Asset purchased 2023-07-01 → acqFY=2023-24, currentFY=2024-25
        // First entry "2023-24" is NOT current, second entry "2024-25" is current (bolded)
        const result = TaxCalculations.generateDepreciationSchedule(asset({ date: '2023-07-01' }));
        expect(result).not.toMatch(/<strong>2023-24:/);
        expect(result).toMatch(/<strong>2024-25:/);
    });

    test('invalid date string → returns "Invalid date"', () => {
        const result = TaxCalculations.generateDepreciationSchedule(
            asset({ date: 'not-a-date' })
        );
        expect(result).toBe('Invalid date');
    });

    test('missing date → returns "Invalid date"', () => {
        const a = asset();
        delete a.date;
        expect(TaxCalculations.generateDepreciationSchedule(a)).toBe('Invalid date');
    });

    test('explicit 0% work-use renders $0.00 rows, not 100% amounts', () => {
        // The schedule previously coerced 0 to 100 via `|| 100`, so an asset
        // that claims $0 displayed a full-cost schedule. Claims must be $0;
        // the cost-basis written-down-value notes are legitimately non-zero.
        const result = TaxCalculations.generateDepreciationSchedule(asset({ workPercentage: 0 }));
        expect(result).toMatch(/2024-25:/);
        const claims = result.split('<br>').map(row => row.match(/: \$([\d,]+\.\d{2})/)[1]);
        claims.forEach(claim => expect(claim).toBe('0.00'));
        expect(result).toMatch(/2024-25:.*\$0\.00/);    // current-FY row shows zero
    });

    test('schedule agrees with the claim for a 0% work-use asset', () => {
        const a = asset({ workPercentage: 0 });
        const schedule = TaxCalculations.generateDepreciationSchedule(a);
        const match = schedule.match(/<strong>2024-25: \$([\d,]+\.\d{2})/);
        expect(match).not.toBeNull();
        const scheduleAmount = parseFloat(match[1].replace(/,/g, ''));
        const claim = TaxCalculations.calculateDepreciationForFinancialYear(
            a.cost, a.workPercentage, a.effectiveLife, a.date, a.depreciationMethod);
        expect(claim).toBe(0);
        expect(scheduleAmount).toBeCloseTo(claim, 2);
    });

    test('missing work% still defaults to 100% in the schedule', () => {
        const a = asset();
        delete a.workPercentage;
        const result = TaxCalculations.generateDepreciationSchedule(a);
        expect(result).toMatch(/2024-25:.*400\.00/);   // 1200/3 at 100%
    });
});

// ─────────────────────────────────────────────
// calculateWfhActualCostDeduction — multi-property
// ─────────────────────────────────────────────
describe('calculateWfhActualCostDeduction — multi-property', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    const prop = (overrides = {}) => ({
        officeArea: 10,
        totalHomeArea: 100,
        electricityCost: 2000,
        gasCost: 0,
        internetCost: 0,
        internetWorkPercent: 0,
        phoneCost: 0,
        stationeryCost: 0,
        ...overrides,
    });

    test('single property in array matches flat-object result', () => {
        const details = { properties: [prop()], assets: [] };
        // electricity: 2000 * (10/100) = 200
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBeCloseTo(200, 2);
    });

    test('two properties are summed correctly', () => {
        // prop1: electricity 2000, area 10/100 → 200
        // prop2: electricity 1000, area 20/100 → 200; internet 600 * 50% = 300
        const details = {
            properties: [
                prop({ electricityCost: 2000 }),
                prop({ officeArea: 20, electricityCost: 1000, internetCost: 600, internetWorkPercent: 50 }),
            ],
            assets: [],
        };
        // 200 + 200 + 300 = 700
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBeCloseTo(700, 2);
    });

    test('assets deduction is added on top of property running expenses', () => {
        // running: electricity 2000 * 10% = 200
        // asset: cost=500, work=100%, not depreciable → 500 immediate
        const details = {
            properties: [prop()],
            assets: [{ cost: 500, workPercentage: 100, isDepreciable: false, date: '2024-07-01' }],
        };
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBeCloseTo(700, 2);
    });

    test('backward compat: flat details object (no properties key) still works', () => {
        // Old data format — no migration needed at the calculation layer
        const details = {
            officeArea: 10, totalHomeArea: 100,
            electricityCost: 2000, gasCost: 0,
            internetCost: 0, internetWorkPercent: 0,
            phoneCost: 0, stationeryCost: 0,
            assets: [],
        };
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBeCloseTo(200, 2);
    });

    test('empty properties array → zero running expenses', () => {
        const details = { properties: [], assets: [] };
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBe(0);
    });

    test('occupancy costs are apportioned by floor area like utilities', () => {
        // rent/mortgage interest 12000 at 10/100 floor area → 1200 on top of
        // electricity 2000 * 10% = 200
        const details = { properties: [prop({ occupancyCost: 12000 })], assets: [] };
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBeCloseTo(1400, 2);
    });

    test('occupancy cost absent or zero leaves the deduction unchanged', () => {
        expect(TaxCalculations.calculateWfhActualCostDeduction(
            { properties: [prop({ occupancyCost: 0 })], assets: [] })).toBeCloseTo(200, 2);
        expect(TaxCalculations.calculateWfhActualCostDeduction(
            { properties: [prop({ occupancyCost: undefined })], assets: [] })).toBeCloseTo(200, 2);
    });

    test('occupancy costs across multiple properties are summed', () => {
        // Real-return shape: rent 27983 at 9.49% floor area ≈ 2655.8
        const details = {
            properties: [
                prop({ officeArea: 9.49, totalHomeArea: 100, electricityCost: 0, occupancyCost: 27983 }),
                prop({ officeArea: 10, totalHomeArea: 100, electricityCost: 0, occupancyCost: 12000 }),
            ],
            assets: [],
        };
        // 27983 * 0.0949 + 12000 * 0.10
        expect(TaxCalculations.calculateWfhActualCostDeduction(details)).toBeCloseTo(27983 * 0.0949 + 1200, 2);
    });
});

// ─────────────────────────────────────────────
// calculateDepreciationForFinancialYear — date validation
// ─────────────────────────────────────────────
describe('calculateDepreciationForFinancialYear — date validation', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));

    test('null date string → returns 0', () => {
        expect(TaxCalculations.calculateDepreciationForFinancialYear(1000, 100, 5, null)).toBe(0);
    });

    test('undefined date string → returns 0', () => {
        expect(TaxCalculations.calculateDepreciationForFinancialYear(1000, 100, 5, undefined)).toBe(0);
    });

    test('invalid date string → returns 0', () => {
        expect(TaxCalculations.calculateDepreciationForFinancialYear(1000, 100, 5, 'not-a-date')).toBe(0);
    });

    test('future date beyond FY end → returns 0', () => {
        // FY 2024-2025 ends 2025-06-30; date 2026-01-01 is beyond it
        expect(TaxCalculations.calculateDepreciationForFinancialYear(1000, 100, 5, '2026-01-01')).toBe(0);
    });

    test('valid date within FY → non-zero deduction', () => {
        expect(TaxCalculations.calculateDepreciationForFinancialYear(1000, 100, 5, '2024-07-01')).toBeGreaterThan(0);
    });
});
// ─────────────────────────────────────────────
// Storage migration: assetType stamping (idempotent)
// ─────────────────────────────────────────────
describe('storage migration — assetType', () => {
    let localStorageStub;
    let StorageManager;
    beforeEach(() => {
        jest.resetModules();
        const store = {};
        localStorageStub = {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; },
            key: (i) => Object.keys(store)[i] ?? null,
            get length() { return Object.keys(store).length; },
        };
        global.localStorage = localStorageStub;
        // storage.js exposes itself on window (= global here), not via
        // module.exports, and reads the window.* tax globals.
        require('../js/constants.js');
        require('../js/calculations.js');
        require('../js/storage.js');
        StorageManager = global.StorageManager;
        loadConstantsForYear('2024-2025');
    });
    const legacyData = () => ({
        userSettings: { currentSection: 'dashboard-section', financialYear: '2024-2025' },
        taxpayerDetails: { filingStatus: 'single' },
        income: { payg: [], other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 } },
        generalExpenses: [
            { id: 'e1', description: 'Claude.AI Pro', date: '2024-08-01', cost: 34, workPercentage: 100, isDepreciable: false, category: 'other' },
            { id: 'e2', description: 'Monitor', date: '2024-09-01', cost: 500, workPercentage: 100, isDepreciable: true, effectiveLife: 4, depreciationMethod: 'prime_cost', category: 'tools' },
        ],
        wfh: {
            method: 'fixed_rate', hoursLog: [], totalMinutes: 0,
            actualCostDetails: {
                properties: [],
                assets: [{ id: 'w1', description: 'Desk', date: '2024-07-15', cost: 350, workPercentage: 100, isDepreciable: false }],
            },
        },
    });
    test('pre-migration data loads with all values unchanged and assetType stamped', () => {
        localStorageStub.setItem('aussieTaxHelperData-2025', JSON.stringify(legacyData()));
        const loaded = StorageManager.loadData('2024-2025');
        // Values unchanged...
        expect(loaded.generalExpenses[0].description).toBe('Claude.AI Pro');
        expect(loaded.generalExpenses[0].cost).toBe(34);
        expect(loaded.generalExpenses[1].effectiveLife).toBe(4);
        expect(loaded.wfh.actualCostDetails.assets[0].cost).toBe(350);
        // ...and every item stamped.
        expect(loaded.generalExpenses.map(e => e.assetType)).toEqual(['equipment', 'equipment']);
        expect(loaded.wfh.actualCostDetails.assets[0].assetType).toBe('equipment');
    });
    test('an explicit service assetType survives the migration untouched', () => {
        const data = legacyData();
        data.generalExpenses[0].assetType = 'service';
        localStorageStub.setItem('aussieTaxHelperData-2025', JSON.stringify(data));
        const loaded = StorageManager.loadData('2024-2025');
        expect(loaded.generalExpenses[0].assetType).toBe('service');
        expect(loaded.generalExpenses[1].assetType).toBe('equipment');
    });
    test('migration is idempotent — running it twice changes nothing', () => {
        localStorageStub.setItem('aussieTaxHelperData-2025', JSON.stringify(legacyData()));
        const once = StorageManager.loadData('2024-2025');
        localStorageStub.setItem('aussieTaxHelperData-2025', JSON.stringify(once));
        const twice = StorageManager.loadData('2024-2025');
        expect(twice.generalExpenses).toEqual(once.generalExpenses);
        expect(twice.wfh.actualCostDetails.assets).toEqual(once.wfh.actualCostDetails.assets);
    });
    test('empty and shapeless data pass through without throwing', () => {
        localStorageStub.setItem('aussieTaxHelperData-2025', JSON.stringify({
            userSettings: {}, taxpayerDetails: { filingStatus: 'single' },
            income: { payg: [], other: {} }, generalExpenses: [],
            wfh: { method: 'fixed_rate', hoursLog: [], totalMinutes: 0, actualCostDetails: { properties: [], assets: [] } },
        }));
        expect(() => StorageManager.loadData('2024-2025')).not.toThrow();
    });
});
// ─────────────────────────────────────────────
// findSameDayPurchaseSets (set-of-assets limb, question not warning)
// ─────────────────────────────────────────────
describe('findSameDayPurchaseSets', () => {
    beforeEach(() => loadConstantsForYear('2025-2026'));
    const item = (overrides = {}) => ({
        id: 'x', description: 'Item', date: '2025-08-25',
        cost: 50, workPercentage: 100, isDepreciable: false, ...overrides,
    });
    test('seven different hardware items bought the same day totalling over $300 raise a notice', () => {
        // The real case: 25 Aug 2025, seven different non-depreciable items,
        // $331.74 combined.
        const costs = [59.99, 49.50, 45.00, 39.25, 55.00, 42.00, 41.00];
        const items = costs.map((cost, i) => item({
            id: `d${i}`, description: `Part ${String.fromCharCode(65 + i)}`, cost,
        }));
        const sets = TaxCalculations.findSameDayPurchaseSets(items, []);
        expect(sets).toHaveLength(1);
        expect(sets[0].date).toBe('2025-08-25');
        expect(sets[0].count).toBe(7);
        expect(sets[0].combinedCost).toBeCloseTo(331.74, 2);
    });
    test('identical-description groups are the strong warning\'s job, not a set notice', () => {
        const sets = TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'a', description: 'RAM', cost: 200 }), item({ id: 'b', description: 'ram', cost: 200 })], []);
        expect(sets).toHaveLength(0);
    });
    test('services and consumables are excluded from the set grouping', () => {
        const sets = TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'a', description: 'Part A', cost: 200, assetType: 'service' }),
             item({ id: 'b', description: 'Part B', cost: 200, assetType: 'consumable' })], []);
        expect(sets).toHaveLength(0);
    });
    test('same-day items at or under $300 combined raise no notice', () => {
        expect(TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'a', description: 'A', cost: 150 }), item({ id: 'b', description: 'B', cost: 150 })], [])
        ).toHaveLength(0);   // exactly $300 stays exclusive
        expect(TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'c', description: 'C', cost: 150.01 }), item({ id: 'd', description: 'D', cost: 150 })], [])
        ).toHaveLength(1);
    });
    test('items on different days do not group', () => {
        expect(TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'a', description: 'A', cost: 200, date: '2025-08-25' }),
             item({ id: 'b', description: 'B', cost: 200, date: '2025-08-26' })], [])
        ).toHaveLength(0);
    });
    test('depreciable items and out-of-FY items are excluded', () => {
        expect(TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'a', description: 'A', cost: 200, isDepreciable: true, effectiveLife: 4 }),
             item({ id: 'b', description: 'B', cost: 200 })], [])
        ).toHaveLength(0);
        expect(TaxCalculations.findSameDayPurchaseSets(
            [item({ id: 'c', description: 'C', cost: 200, date: '2023-08-25' }),
             item({ id: 'd', description: 'D', cost: 200, date: '2023-08-25' })], [])
        ).toHaveLength(0);
    });
    test('calculateYearSummary exposes sameDaySetNotices', () => {
        const data = makeAppData({
            generalExpenses: [
                item({ id: 'a', description: 'Part A', cost: 200 }),
                item({ id: 'b', description: 'Part B', cost: 150 }),
            ],
        });
        const s = TaxCalculations.calculateYearSummary(data);
        expect(s.sameDaySetNotices).toHaveLength(1);
        expect(s.sameDaySetNotices[0].combinedCost).toBeCloseTo(350, 2);
    });
});
// ─────────────────────────────────────────────
// Depreciation schedule: opening/closing written-down value
// ─────────────────────────────────────────────
describe('generateDepreciationSchedule — written-down value shown per row', () => {
    beforeEach(() => loadConstantsForYear('2024-2025'));
    test('each row shows opening → closing WDV at full cost basis (real GPU case)', () => {
        // $635.45 GPU, 3-year DV, acquired 2024-12-01. The accountant's
        // carried opening WDV for 2025-26 was $389 — the figure that
        // previously existed only inside the engine.
        const result = TaxCalculations.generateDepreciationSchedule({
            isDepreciable: true, cost: 635.45, workPercentage: 100, effectiveLife: 3,
            date: '2024-12-01', depreciationMethod: 'diminishing_value',
        });
        expect(result).toMatch(/2024-25: \$246\.06.*opening \$635\.45 → closing \$389\.39/);
        expect(result).toMatch(/2025-26: \$259\.60.*opening \$389\.39 → closing \$129\.80/);
        expect(result).toMatch(/2026-27: \$86\.53.*opening \$129\.80 → closing \$43\.27/);
        // Closing of one year is exactly the opening of the next.
        expect(result).toMatch(/closing \$389\.39.*2025-26: \$259\.60.*opening \$389\.39/);
    });
    test('WDV is full cost basis — unaffected by a partial work percentage', () => {
        const full = TaxCalculations.generateDepreciationSchedule({
            isDepreciable: true, cost: 1200, workPercentage: 100, effectiveLife: 3,
            date: '2024-07-01', depreciationMethod: 'prime_cost',
        });
        const half = TaxCalculations.generateDepreciationSchedule({
            isDepreciable: true, cost: 1200, workPercentage: 50, effectiveLife: 3,
            date: '2024-07-01', depreciationMethod: 'prime_cost',
        });
        expect(full).toMatch(/2024-25: \$400\.00.*opening \$1,200\.00 → closing \$800\.00/);
        expect(half).toMatch(/2024-25: \$200\.00.*opening \$1,200\.00 → closing \$800\.00/);
    });
    test('Immediate and Invalid date outputs are unchanged', () => {
        expect(TaxCalculations.generateDepreciationSchedule({ isDepreciable: false })).toBe('Immediate');
        expect(TaxCalculations.generateDepreciationSchedule({
            isDepreciable: true, cost: 500, effectiveLife: 4, workPercentage: 100, date: 'nope',
        })).toBe('Invalid date');
    });
});
// ─────────────────────────────────────────────
// auditCrossYearAssets (cross-year consistency, report-only)
// ─────────────────────────────────────────────
describe('auditCrossYearAssets', () => {
    const dep = (overrides = {}) => ({
        description: 'Asset', date: '2024-12-01', cost: 635.45, workPercentage: 100,
        isDepreciable: true, effectiveLife: 2, depreciationMethod: 'diminishing_value', ...overrides,
    });
    const year = (generalExpenses = [], wfhAssets = []) => ({
        generalExpenses,
        wfh: { method: 'actual_cost', hoursLog: [], totalMinutes: 0, actualCostDetails: { properties: [], assets: wfhAssets } },
    });
    test('flags field drift between years (the GPU case)', () => {
        const findings = TaxCalculations.auditCrossYearAssets({
            '2024-2025': year([dep()]),
            '2025-2026': year([dep({ cost: 635.00, effectiveLife: 4 })]),
        });
        expect(findings).toHaveLength(1);
        expect(findings[0].description).toBe('Asset');
        expect(findings[0].copies.map(c => c.cost)).toEqual([635.45, 635]);
        expect(findings[0].copies.map(c => c.effectiveLife)).toEqual([2, 4]);
    });
    test('flags a flip from depreciable to non-depreciable (the P100 case)', () => {
        const findings = TaxCalculations.auditCrossYearAssets({
            '2024-2025': year([dep({ description: 'P100 Nvidia Tesla', cost: 435.38, date: '2024-08-05', effectiveLife: 1 })]),
            '2025-2026': year([dep({ description: 'P100 Nvidia Tesla', cost: 173.00, date: '2024-07-01', isDepreciable: false, effectiveLife: 0, depreciationMethod: 'prime_cost' })]),
        });
        expect(findings).toHaveLength(1);
        const copies = findings[0].copies;
        expect(copies[0].isDepreciable).toBe(true);
        expect(copies[1].isDepreciable).toBe(false);
    });
    test('flags the same asset living in different lists (the Pixel Tablet case)', () => {
        const findings = TaxCalculations.auditCrossYearAssets({
            '2024-2025': year([dep({ description: 'Google Pixel Tablet' })], []),
            '2025-2026': year([], [dep({ description: 'Google Pixel Tablet' })]),
        });
        expect(findings).toHaveLength(1);
        expect(new Set(findings[0].copies.map(c => c.list))).toEqual(new Set(['General Expenses', 'WFH Assets']));
    });
    test('identical copies across years and single-year items report nothing', () => {
        expect(TaxCalculations.auditCrossYearAssets({
            '2024-2025': year([dep()]),
            '2025-2026': year([dep()]),
            '2026-2027': year([dep()]),
        })).toHaveLength(0);
        expect(TaxCalculations.auditCrossYearAssets({
            '2024-2025': year([dep()]),
        })).toHaveLength(0);
    });
    test('non-depreciable items are audited too (same-description services across years)', () => {
        // A subscription re-entered each year with a changed price is a real
        // disagreement worth surfacing, so non-depreciable items participate.
        const findings = TaxCalculations.auditCrossYearAssets({
            '2024-2025': year([dep({ description: 'Claude.AI Pro', isDepreciable: false, cost: 34, effectiveLife: 0 })]),
            '2025-2026': year([dep({ description: 'Claude.AI Pro', isDepreciable: false, cost: 100, effectiveLife: 0 })]),
        });
        expect(findings).toHaveLength(1);
    });
    test('empty/shapeless input is safe', () => {
        expect(TaxCalculations.auditCrossYearAssets(null)).toHaveLength(0);
        expect(TaxCalculations.auditCrossYearAssets({})).toHaveLength(0);
        expect(TaxCalculations.auditCrossYearAssets({ '2024-2025': {} })).toHaveLength(0);
    });
});
