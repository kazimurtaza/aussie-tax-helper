// js/calculations.js

const TaxCalculations = (() => {

    const calculateTotalAssessableIncome = (incomeData) => {
        const paygIncome = incomeData.payg.reduce((sum, item) => sum + parseFloat(item.grossSalary || 0), 0);
        const bankInterest = parseFloat(incomeData.other.bankInterest || 0);
        const dividendsUnfranked = parseFloat(incomeData.other.dividendsUnfranked || 0);
        const dividendsFranked = parseFloat(incomeData.other.dividendsFranked || 0);
        const frankingCredits = parseFloat(incomeData.other.frankingCredits || 0);
        const netCapitalGains = parseFloat(incomeData.other.netCapitalGains || 0);
        const otherIncome = bankInterest + dividendsUnfranked + dividendsFranked + frankingCredits + netCapitalGains;
        return paygIncome + otherIncome;
    };
    
        // Compute actual days in a financial year (366 for leap years like 2023-24, 2027-28).
    const daysInFY = (fyStartYear) => {
        const fyEnd = new Date(fyStartYear + 1, 5, 30);
        const fyStart = new Date(fyStartYear, 6, 1);
        return Math.floor((fyEnd - fyStart) / 86400000) + 1;
    };

    // Bounds of an Australian financial year label ("2024-2025" -> 1 Jul 2024
    // .. 30 Jun 2025), or null when the label can't be parsed.
    const fyBounds = (financialYear) => {
        const startYear = parseInt(String(financialYear).split('-')[0], 10);
        return Number.isNaN(startYear) ? null : {
            startYear,
            start: new Date(startYear, 6, 1),
            end: new Date(startYear + 1, 5, 30),
        };
    };

    // True when a YYYY-MM-DD date string falls inside the financial year
    // [1 Jul .. 30 Jun]. Malformed, missing, or out-of-range month/day values
    // are excluded rather than throwing — callers treat an unparseable date
    // as "not claimable this FY". Shared by the deduction totals and the
    // CSV export so both bound items identically.
    const dateInFinancialYear = (dateStr, financialYear = window.FINANCIAL_YEAR) => {
        if (!dateStr || typeof dateStr !== 'string') return false;
        const parts = dateStr.split('-').map(Number);
        if (parts.length !== 3 || parts.some(n => !Number.isInteger(n))) return false;
        const [y, m, d] = parts;
        if (m < 1 || m > 12 || d < 1 || d > 31) return false;
        const bounds = fyBounds(financialYear);
        if (!bounds) return false;
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? false : date >= bounds.start && date <= bounds.end;
    };

    // ── Depreciation engine ────────────────────────────────────────────────
    // One implementation of the decline-in-value maths, consumed by both the
    // claim path (calculateDepreciationForFinancialYear) and the display path
    // (generateDepreciationSchedule) so the two cannot drift. The claim for a
    // given FY is always the engine's row for that FY; the schedule simply
    // walks the engine's rows from the acquisition year.

    // Parse and validate an asset into an engine context, or null when the
    // purchase date can't be parsed.
    const parseDepreciableAsset = (cost, workPercentage, effectiveLifeYears, purchaseDateString, method) => {
        const numCost = parseFloat(cost || 0);
        const life = parseInt(effectiveLifeYears || 0);
        const workPct = parseFloat(workPercentage || 0);
        if (!purchaseDateString || typeof purchaseDateString !== 'string') return null;
        // Parse as local time to stay consistent with FY boundary dates (also local).
        const [py, pm, pd] = purchaseDateString.split('-').map(Number);
        const purchaseDate = new Date(py, pm - 1, pd);
        if (isNaN(purchaseDate.getTime())) return null;

        // Determine which Australian FY the asset was acquired in (FY starts Jul 1).
        // Month >= 6 means Jul-Dec: acquisition FY starts in the purchase calendar year.
        // Month < 6 means Jan-Jun: acquisition FY started the previous calendar year.
        const purchaseMonth = purchaseDate.getMonth();
        const acqFYStartYear = purchaseMonth >= 6 ? purchaseDate.getFullYear() : purchaseDate.getFullYear() - 1;

        return {
            numCost,
            life,
            workPct,
            isDV: method === 'diminishing_value',
            purchaseDate,
            acqFYStartYear,
        };
    };

    // Work-share deduction for ONE financial year (identified by its start
    // year) of a parsed asset. Walks from the acquisition year, so a
    // far-past purchase still resolves correctly. Returns null for FYs the
    // asset doesn't cover (before acquisition, or not yet purchased).
    const depreciationRowForFY = (ctx, targetFYStartYear) => {
        const { numCost, life, workPct, isDV, purchaseDate, acqFYStartYear } = ctx;
        const fyStart = new Date(targetFYStartYear, 6, 1);
        const fyEnd = new Date(targetFYStartYear + 1, 5, 30);
        if (purchaseDate > fyEnd || targetFYStartYear < acqFYStartYear) return null;

        // Pro-rata for the acquisition FY: days owned out of the FY's actual
        // length (366 in leap years).
        const acqFYEnd = new Date(acqFYStartYear + 1, 5, 30);
        const acqDaysOwned = Math.floor((acqFYEnd - purchaseDate) / 86400000) + 1;
        const acqFYDays = daysInFY(acqFYStartYear);
        const acqFraction = Math.min(1, acqDaysOwned / acqFYDays);
        const isAcqYear = targetFYStartYear === acqFYStartYear;

        const annualAt = (value) => (life <= 1 ? value : value * (2 / life));

        // Opening value at the start of the target FY. The full value (not
        // the work share) is consumed each year.
        let openingValueBefore;
        if (isDV) {
            openingValueBefore = numCost;
            if (!isAcqYear) {
                // DV: pro-rate the acquisition year, then full DV for each
                // complete FY since.
                openingValueBefore = Math.max(0, openingValueBefore - annualAt(numCost) * acqFraction);
                const completeFYs = targetFYStartYear - (acqFYStartYear + 1);
                for (let i = 0; i < completeFYs; i++) {
                    openingValueBefore = Math.max(0, openingValueBefore - annualAt(openingValueBefore));
                }
            }
        } else {
            // PC: flat rate from cost; the acquisition year counts pro-rata.
            const consumedBefore = (numCost / life)
                * (isAcqYear ? 0 : acqFraction + (targetFYStartYear - acqFYStartYear - 1));
            openingValueBefore = Math.max(0, numCost - consumedBefore);
        }

        // This year's claim is capped at the value remaining (prime cost
        // ends once the asset is fully written off). For DV the cap is a
        // no-op (the rate never exceeds the opening value) but applying it
        // uniformly keeps one code path.
        const annual = isDV ? annualAt(openingValueBefore) : numCost / life;
        const capped = Math.min(annual, openingValueBefore);
        const proRata = isAcqYear ? Math.max(0, acqFraction) : 1;

        return {
            amount: capped * (workPct / 100) * proRata,
            daysOwned: isAcqYear ? acqDaysOwned : null,
            fyDays: isAcqYear ? acqFYDays : null,
            remainingValueAfter: Math.max(0, openingValueBefore - annual * proRata),
        };
    };

    const calculateDepreciationForFinancialYear = (cost, workPercentage, effectiveLifeYears, purchaseDateString, method = 'prime_cost') => {
        const numCost = parseFloat(cost || 0);
        if (numCost <= 0) return 0;

        if (!effectiveLifeYears || effectiveLifeYears <= 0) {
            // No schedule to depreciate over — immediate write-off of the
            // work-related portion (handled by callers as a non-depreciable item).
            return numCost * (parseFloat(workPercentage || 0) / 100);
        }

        const ctx = parseDepreciableAsset(numCost, workPercentage, effectiveLifeYears, purchaseDateString, method);
        if (!ctx) return 0;

        const bounds = fyBounds(window.FINANCIAL_YEAR);
        const row = depreciationRowForFY(ctx, bounds.startYear);
        return row ? row.amount : 0;
    };

    // Single work-use-% rule for both the calculation layer and the form
    // boundary: an explicit 0 survives, blank/invalid input takes the
    // caller's fallback (0 for general expenses, 100 for WFH assets), and
    // anything numeric is clamped to 0-100.
    const normaliseWorkPct = (raw, fallback = 0) => {
        const parsed = parseFloat(raw);
        return Number.isNaN(parsed) ? fallback : Math.min(100, Math.max(0, parsed));
    };

    // Deduction for a single expense/asset in the active FY. Non-depreciable
    // items claim cost x work%; depreciable items go through the depreciation
    // engine. Both branches share the work-% fallback rule.
    const calculateItemDeduction = (item, fallbackWorkPct = 0) => {
        const workPct = normaliseWorkPct(item.workPercentage, fallbackWorkPct);
        if (item.isDepreciable) {
            return calculateDepreciationForFinancialYear(item.cost, workPct, item.effectiveLife, item.date, item.depreciationMethod);
        }
        return parseFloat(item.cost || 0) * (workPct / 100);
    };

    // Immediate (non-depreciable) claims are confined to the FY the item was
    // acquired in — without the FY-start bound a $1,000 item dated 2024-07-01
    // claimed in full again in every later year. Depreciable items span years
    // legitimately via the depreciation engine and are not filtered here.
    const calculateTotalGeneralDeductions = (generalExpenses) => {
        return (generalExpenses || [])
            .filter(exp => exp.isDepreciable || dateInFinancialYear(exp.date))
            .reduce((total, exp) => total + calculateItemDeduction(exp, 0), 0);
    };

    const calculateWfhRunningExpensesDeduction = (details) => {
        if (!details) return 0;
        let totalDeduction = 0;
        const officeArea = parseFloat(details.officeArea || 0);
        const totalHomeArea = parseFloat(details.totalHomeArea || 0);
        const floorAreaPercent = (officeArea > 0 && totalHomeArea > 0) ? officeArea / totalHomeArea : 0;

        // Occupancy costs (rent or mortgage interest) share the floor-area
        // apportionment with utilities — only deductible for employees in
        // limited circumstances, so the field is opt-in with a caution.
        totalDeduction += (parseFloat(details.electricityCost || 0) + parseFloat(details.gasCost || 0)
            + parseFloat(details.occupancyCost || 0)) * floorAreaPercent;
        totalDeduction += parseFloat(details.internetCost || 0) * (parseFloat(details.internetWorkPercent || 0) / 100);
        totalDeduction += parseFloat(details.phoneCost || 0);
        totalDeduction += parseFloat(details.stationeryCost || 0);
        return totalDeduction;
    };

    const calculateWfhAssetsDeduction = (assets) => {
        if (!assets || assets.length === 0) return 0;
        return assets
            .filter(asset => asset.isDepreciable || dateInFinancialYear(asset.date))
            .reduce((total, asset) => total + calculateItemDeduction(asset, 100), 0);
    };

    // ATO: the ≤$300 immediate deduction is excluded when an asset is one of
    // a number of identical, or substantially identical, assets started to
    // hold during the income year that together cost more than $300. Items
    // from other years are excluded from the grouping. Detection only — the
    // app surfaces a warning and the user decides; nothing is reclassified.
    const IDENTICAL_ASSET_THRESHOLD = 300;

    const normaliseDescription = (desc) =>
        String(desc ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    const findIdenticalAssetGroups = (generalExpenses = [], wfhAssets = [], financialYear = window.FINANCIAL_YEAR) => {
        const candidates = [
            ...(generalExpenses || []).map(item => ({ ...item, source: 'General Expenses' })),
            ...(wfhAssets || []).map(item => ({ ...item, source: 'WFH Assets' })),
        ].filter(item => !item.isDepreciable && dateInFinancialYear(item.date, financialYear));

        const groups = new Map();
        candidates.forEach(item => {
            const key = normaliseDescription(item.description);
            if (!key) return;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(item);
        });

        return [...groups.entries()]
            .filter(([, items]) => items.length > 1)
            .map(([description, items]) => ({
                description,
                financialYear,
                count: items.length,
                combinedCost: items.reduce((sum, i) => sum + (parseFloat(i.cost) || 0), 0),
                items: items.map(({ id, description: d, cost, date, source }) => ({ id, description: d, cost, date, source })),
            }))
            .filter(group => group.combinedCost > IDENTICAL_ASSET_THRESHOLD);
    };

    const calculateWfhActualCostDeduction = (details) => {
        if (!details) return 0;
        const properties = details.properties || [details];
        const runningExpenses = properties.reduce((sum, prop) =>
            sum + calculateWfhRunningExpensesDeduction(prop), 0);
        const assetExpenses = calculateWfhAssetsDeduction(details.assets);
        return runningExpenses + assetExpenses;
    };

    const calculateTotalWfhDeductions = (wfhData) => {
        if (wfhData.method === 'fixed_rate') {
            const decimalHours = (wfhData.totalMinutes || 0) / 60;
            return decimalHours * window.WFH_FIXED_RATE_PER_HOUR;
        } else if (wfhData.method === 'actual_cost') {
            return calculateWfhActualCostDeduction(wfhData.actualCostDetails);
        }
        return 0;
    };

    const calculateOverallTotalDeductions = (appData) => {
        const generalDeductions = calculateTotalGeneralDeductions(appData.generalExpenses);
        const wfhDeductions = calculateTotalWfhDeductions(appData.wfh);
        const superDeductions = parseFloat(appData.taxpayerDetails.personalSuperContribution) || 0;
        return generalDeductions + wfhDeductions + superDeductions;
    };

    const calculateTaxableIncome = (appData) => {
        const totalAssessableIncome = calculateTotalAssessableIncome(appData.income);
        const overallTotalDeductions = calculateOverallTotalDeductions(appData);
        return Math.max(0, totalAssessableIncome - overallTotalDeductions);
    };

    const calculateGrossTax = (taxableIncome) => {
        const income = Math.floor(taxableIncome);
        if (income <= window.TAX_RATES[0].max) return 0;
        const bracket = window.TAX_RATES.slice().reverse().find(b => income >= b.min);
        if (!bracket) return 0;
        return bracket.base + ((income - (bracket.min - 1)) * bracket.rate);
    };

    const calculateLITO = (taxableIncome) => {
        if (taxableIncome <= window.TAX_RATES[0].max) return 0;
        if (taxableIncome <= window.LITO_THRESHOLD_1) return window.LITO_MAX_OFFSET;
        if (taxableIncome > window.LITO_THRESHOLD_3) return 0;
        let offset;
        if (taxableIncome <= window.LITO_THRESHOLD_2) {
            offset = window.LITO_MAX_OFFSET - (taxableIncome - window.LITO_THRESHOLD_1) * window.LITO_REDUCTION_RATE_1;
        } else {
            const baseReduction = (window.LITO_THRESHOLD_2 - window.LITO_THRESHOLD_1) * window.LITO_REDUCTION_RATE_1;
            offset = (window.LITO_MAX_OFFSET - baseReduction) - ((taxableIncome - window.LITO_THRESHOLD_2) * window.LITO_REDUCTION_RATE_2);
        }
        return Math.max(0, offset);
    };
    
    const calculateMedicareLevy = (taxableIncome, taxpayerDetails) => {
        if (!taxpayerDetails) {
            return 0;
        }

        let threshold = window.MEDICARE_LEVY_THRESHOLD_SINGLE;
        let upperThreshold = window.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE;

        if (taxpayerDetails.filingStatus === 'family') {
            const children = taxpayerDetails.dependentChildren || 0;
            threshold = window.MEDICARE_LEVY_THRESHOLD_FAMILY + children * window.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT;
            upperThreshold = window.MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY + children * window.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT_UPPER;
        }

        let fullYearLevy = 0;
        if (taxableIncome > threshold) {
            if (taxableIncome <= upperThreshold) {
                fullYearLevy = (taxableIncome - threshold) * 0.10;
            } else {
                fullYearLevy = taxableIncome * window.MEDICARE_LEVY_RATE;
            }
        }

        if (taxpayerDetails.isMedicareExempt) {
            const totalDays = daysInFY(parseInt(window.FINANCIAL_YEAR.split('-')[0], 10));
            const exemptDays = taxpayerDetails.medicareExemptDays || 0;
            if (exemptDays >= totalDays) return 0;
            return (fullYearLevy / totalDays) * (totalDays - exemptDays);
        }

        return fullYearLevy;
    };

    const getIncomeForMls = (taxableIncome, taxpayerDetails) => {
         return taxableIncome + (parseFloat(taxpayerDetails.reportableFringeBenefits) || 0) + (parseFloat(taxpayerDetails.personalSuperContribution) || 0);
    }

    const MLS_TIER_NAMES = ['base', 'tier1', 'tier2', 'tier3'];

    // Single source of truth for MLS/PHI income-tier determination. Tier
    // tables use integer boundaries, so income is floored to whole dollars;
    // family tier minima shift by (children - 1) x MLS_CHILD_ADJUSTMENT.
    const getMlsTier = (incomeForTest, taxpayerDetails) => {
        const income = Math.floor(incomeForTest);
        const isFamily = taxpayerDetails.filingStatus === 'family';
        const childAdjustment = isFamily && taxpayerDetails.dependentChildren > 1
            ? (taxpayerDetails.dependentChildren - 1) * window.MLS_CHILD_ADJUSTMENT
            : 0;
        const tiers = isFamily ? window.MLS_THRESHOLDS_FAMILY : window.MLS_THRESHOLDS_SINGLE;
        for (let i = tiers.length - 1; i >= 1; i--) {
            if (income >= tiers[i].min + childAdjustment) {
                return { index: i, rate: tiers[i].rate };
            }
        }
        return { index: 0, rate: tiers[0].rate };
    };

    const calculateMLS = (taxableIncome, taxpayerDetails) => {
        if (!taxpayerDetails || taxpayerDetails.hasPrivateHospitalCover) {
            return 0;
        }

        const incomeForMls = getIncomeForMls(taxableIncome, taxpayerDetails);
        const testIncome = taxpayerDetails.filingStatus === 'family'
            ? incomeForMls + (parseFloat(taxpayerDetails.spouseIncome) || 0)
            : incomeForMls;

        // Tier is set by family income; the surcharge applies to the individual's own MLS income
        const { rate } = getMlsTier(testIncome, taxpayerDetails);
        return incomeForMls * rate;
    };
    
    const calculatePhiOffset = (taxableIncome, taxpayerDetails) => {
        if (!taxpayerDetails) {
            return 0;
        }
        const { phiAgeBracket, phiPremiumsPaid_period1, phiPremiumsPaid_period2, phiRebateReceived, filingStatus, spouseIncome } = taxpayerDetails;
        if ((phiPremiumsPaid_period1 || 0) <= 0 && (phiPremiumsPaid_period2 || 0) <= 0) {
            return 0;
        }

        const incomeForPhi = getIncomeForMls(taxableIncome, taxpayerDetails);
        const totalIncome = filingStatus === 'family' ? incomeForPhi + (parseFloat(spouseIncome) || 0) : incomeForPhi;

        const incomeTier = MLS_TIER_NAMES[getMlsTier(totalIncome, taxpayerDetails).index];

        const periodKeys = Object.keys(window.PHI_REBATE_RATES_PERIODS).sort();
        const rebateRatePeriod1 = window.PHI_REBATE_RATES_PERIODS[periodKeys[0]][phiAgeBracket][incomeTier];
        const rebateRatePeriod2 = window.PHI_REBATE_RATES_PERIODS[periodKeys[1]][phiAgeBracket][incomeTier];

        const correctRebate1 = (parseFloat(phiPremiumsPaid_period1) || 0) * rebateRatePeriod1;
        const correctRebate2 = (parseFloat(phiPremiumsPaid_period2) || 0) * rebateRatePeriod2;

        const totalCorrectRebate = correctRebate1 + correctRebate2;
        // May be negative when more rebate was received than the entitlement —
        // that liability flows through as a negative offset.
        return totalCorrectRebate - (parseFloat(phiRebateReceived) || 0);
    };

    // Offsets actually applied, not just entitled to: LITO is non-refundable
    // and capped at gross income tax, so the total only reconciles with net
    // tax when the capped amount is shown. Callers without a grossTax figure
    // (2-argument form) get the uncapped entitlement, as before.
    const calculateTotalOffsets = (taxableIncome, appData, grossTax) => {
        const lito = calculateLITO(taxableIncome);
        const litoApplied = Math.min(lito, Number.isFinite(grossTax) ? grossTax : Infinity);
        const frankingCredits = parseFloat(appData.income.other.frankingCredits || 0);
        const phiOffset = calculatePhiOffset(taxableIncome, appData.taxpayerDetails);
        return { lito, litoApplied, frankingCredits, phiOffset, total: litoApplied + frankingCredits + phiOffset };
    };

    const calculateNetTaxPayable = (grossTax, medicareLevy, mls, offsets) => {
        // LITO is non-refundable and offsets income tax only (not the levy or
        // MLS). Franking credits and the PHI offset are refundable, so the
        // result can go negative — a larger refund in calculateFinalOutcome.
        return Math.max(0, grossTax - offsets.lito)
            + medicareLevy + mls - offsets.frankingCredits - offsets.phiOffset;
    };

    const calculateFinalOutcome = (totalTaxWithheld, netTaxPayable) => {
        return totalTaxWithheld - netTaxPayable;
    };

    // Full calculation breakdown for one year's data under the active FY
    // constants — drives the summary UI and is embedded in exports so an
    // accountant sees the derived figures, not just the raw inputs.
    const calculateYearSummary = (appData) => {
        const totalAssessableIncome = calculateTotalAssessableIncome(appData.income);
        const totalTaxWithheld = appData.income.payg.reduce((sum, item) => sum + (parseFloat(item.taxWithheld) || 0), 0);
        const totalGeneralDeductions = calculateTotalGeneralDeductions(appData.generalExpenses);
        const totalWfhDeductions = calculateTotalWfhDeductions(appData.wfh);
        const totalSuperDeductions = parseFloat(appData.taxpayerDetails.personalSuperContribution) || 0;
        const overallTotalDeductions = totalGeneralDeductions + totalWfhDeductions + totalSuperDeductions;
        // Derived from the totals already in scope — calculateTaxableIncome
        // would recompute all three deduction passes (including depreciation)
        // from scratch on every UI refresh.
        const taxableIncome = Math.max(0, totalAssessableIncome - overallTotalDeductions);
        const grossTax = calculateGrossTax(taxableIncome);
        const medicareLevy = calculateMedicareLevy(taxableIncome, appData.taxpayerDetails);
        const mls = calculateMLS(taxableIncome, appData.taxpayerDetails);
        const offsets = calculateTotalOffsets(taxableIncome, appData, grossTax);
        const netTaxPayable = calculateNetTaxPayable(grossTax, medicareLevy, mls, offsets);
        const finalOutcome = calculateFinalOutcome(totalTaxWithheld, netTaxPayable);
        const identicalAssetWarnings = findIdenticalAssetGroups(
            appData.generalExpenses,
            (appData.wfh && appData.wfh.actualCostDetails && appData.wfh.actualCostDetails.assets) || [],
        );
        return {
            financialYear: window.FINANCIAL_YEAR,
            totalAssessableIncome,
            totalTaxWithheld,
            totalGeneralDeductions,
            totalWfhDeductions,
            totalSuperDeductions,
            overallTotalDeductions,
            taxableIncome,
            grossTax,
            medicareLevy,
            mls,
            identicalAssetWarnings,
            offsets,
            netTaxPayable,
            finalOutcome,
        };
    };

    const escapeHtml = (str) => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const generateDepreciationSchedule = (asset) => {
        if (!asset.isDepreciable || !asset.effectiveLife || asset.effectiveLife <= 0) {
            return 'Immediate';
        }

        const life = parseInt(asset.effectiveLife);
        const isDV = asset.depreciationMethod === 'diminishing_value';
        const ctx = parseDepreciableAsset(
            parseFloat(asset.cost),
            normaliseWorkPct(asset.workPercentage, 100),
            life, asset.date, asset.depreciationMethod,
        );
        if (!ctx) return 'Invalid date';
        const fmt = (v) => (v || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

        const currentFYStartYear = fyBounds(window.FINANCIAL_YEAR).startYear;

        // DV (life > 1) always has a residual after effective life — cap at life iterations (ATO practice).
        // PC and DV life=1 can have a partial-year residual, so allow one extra iteration.
        const maxIter = (!isDV || life <= 1) ? life + 1 : life;

        const schedule = [];
        let remainingValue = ctx.numCost;
        for (let i = 0; i < maxIter && remainingValue > 0.005; i++) {
            const fyStartYear = ctx.acqFYStartYear + i;
            const row = depreciationRowForFY(ctx, fyStartYear);
            if (!row) break;

            const fyLabel = `${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
            const isCurrent = fyStartYear === currentFYStartYear;

            let proRataNote = '';
            if (row.daysOwned !== null && row.daysOwned < row.fyDays) {
                const dvRate = isDV ? ` · ${life <= 1 ? 100 : Math.round(200 / life)}% DV/yr` : ` · ${Math.round(100 / life)}% PC/yr`;
                proRataNote = ` <span style="opacity:0.55;font-size:0.8em">(${row.daysOwned}/${row.fyDays} days${dvRate})</span>`;
            }

            remainingValue = row.remainingValueAfter;
            const amountStr = `${fyLabel}: ${fmt(row.amount)}${proRataNote}`;
            schedule.push(isCurrent ? `<strong>${amountStr}</strong>` : amountStr);
        }

        return schedule.join('<br>');
    };

    return {
        calculateTotalAssessableIncome,
        calculateTotalGeneralDeductions,
        calculateTotalWfhDeductions,
        calculateOverallTotalDeductions,
        calculateTaxableIncome,
        calculateGrossTax,
        calculateLITO,
        calculateMedicareLevy,
        calculateMLS,
        calculatePhiOffset,
        calculateTotalOffsets,
        calculateNetTaxPayable,
        calculateFinalOutcome,
        calculateYearSummary,
        calculateItemDeduction,
        normaliseWorkPct,
        dateInFinancialYear,
        findIdenticalAssetGroups,
        calculateDepreciationForFinancialYear,
        calculateWfhActualCostDeduction,
        calculateWfhRunningExpensesDeduction,
        calculateWfhAssetsDeduction,
        generateDepreciationSchedule,
        escapeHtml
    };
})();

window.TaxCalculations = TaxCalculations;