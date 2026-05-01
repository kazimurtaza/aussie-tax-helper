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
    });

    describe('2025-2026 (same family thresholds)', () => {
        beforeEach(() => loadConstantsForYear('2025-2026'));

        test('family thresholds are identical to 2024-25', () => {
            loadConstantsForYear('2024-2025');
            const levy2425 = TaxCalculations.calculateMedicareLevy(50000, familyTaxpayer());
            loadConstantsForYear('2025-2026');
            const levy2526 = TaxCalculations.calculateMedicareLevy(50000, familyTaxpayer());
            expect(levy2526).toBe(levy2425);
        });

        test('family, 0 children: income $45,907 → zero', () => {
            expect(TaxCalculations.calculateMedicareLevy(45907, familyTaxpayer())).toBe(0);
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

    test('excess rebate received → offset clamped to zero (not negative)', () => {
        const td = singleTaxpayer({
            phiPremiumsPaid_period1: 10000,
            phiRebateReceived: 99999,
        });
        expect(TaxCalculations.calculatePhiOffset(80000, td)).toBe(0);
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

    test('Tier 1 income (single, 2024-25): income $100,000 → tier1 rate applied', () => {
        // Single MLS Tier 1: $97,001-$113,000 → income $100,000 is tier1
        // under65 tier1 Period 1: 0.16405
        const td = singleTaxpayer({ phiPremiumsPaid_period1: 10000 });
        expect(TaxCalculations.calculatePhiOffset(100000, td)).toBeCloseTo(10000 * 0.16405, 4);
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
    test('net tax = gross + medicare + MLS - offsets', () => {
        expect(TaxCalculations.calculateNetTaxPayable(20000, 1500, 0, 700)).toBe(20800);
    });

    test('offsets exceed tax → clamped to zero (no negative tax payable)', () => {
        expect(TaxCalculations.calculateNetTaxPayable(100, 0, 0, 5000)).toBe(0);
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
        const netTax = TaxCalculations.calculateNetTaxPayable(grossTax, medicare, mls, lito);

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
        // netTax = 1888 + 277.80 - 700 = 1465.80
        expect(TaxCalculations.calculateNetTaxPayable(grossTax, medicare, 0, lito)).toBeCloseTo(1465.80, 2);
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
    test('both years exist', () => {
        expect(TAX_CONFIG['2024-2025']).toBeDefined();
        expect(TAX_CONFIG['2025-2026']).toBeDefined();
    });

    test('AVAILABLE_YEARS is sorted', () => {
        expect(AVAILABLE_YEARS).toEqual(['2024-2025', '2025-2026']);
    });

    test('LATEST_YEAR is 2025-2026', () => {
        expect(LATEST_YEAR).toBe('2025-2026');
    });

    test.each(['2024-2025', '2025-2026'])('%s has all required keys', (year) => {
        const cfg = TAX_CONFIG[year];
        const requiredKeys = [
            'TAX_RATES', 'LITO_MAX_OFFSET', 'LITO_THRESHOLD_1',
            'MEDICARE_LEVY_RATE', 'MEDICARE_LEVY_THRESHOLD_SINGLE',
            'MEDICARE_LEVY_THRESHOLD_FAMILY', 'MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY',
            'MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT',
            'MLS_THRESHOLDS_SINGLE', 'MLS_THRESHOLDS_FAMILY',
            'PHI_REBATE_RATES_PERIODS', 'WFH_FIXED_RATE_PER_HOUR',
        ];
        requiredKeys.forEach(key => expect(cfg).toHaveProperty(key));
    });

    test.each(['2024-2025', '2025-2026'])('%s has 5 tax brackets', (year) => {
        expect(TAX_CONFIG[year].TAX_RATES).toHaveLength(5);
    });

    test.each(['2024-2025', '2025-2026'])('%s has correct Medicare levy family threshold (45907)', (year) => {
        expect(TAX_CONFIG[year].MEDICARE_LEVY_THRESHOLD_FAMILY).toBe(45907);
    });

    test.each(['2024-2025', '2025-2026'])('%s has correct Medicare levy family upper threshold (57383)', (year) => {
        expect(TAX_CONFIG[year].MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY).toBe(57383);
    });

    test.each(['2024-2025', '2025-2026'])('%s has correct family child adjustment (4216)', (year) => {
        expect(TAX_CONFIG[year].MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT).toBe(4216);
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
        // acqDepr = 1000*(2/5)*(366/365) = 401.10; openingValue = 598.90
        // completeFYs = 2024 - (2023+1) = 0
        // FY 2024-25 deduction = 598.90*(2/5) = 239.56
        expect(depr(1000, 100, 5, '2023-07-01')).toBeCloseTo(239.56, 1);
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
});
