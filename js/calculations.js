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
    
    const calculateDepreciationForFinancialYear = (cost, workPercentage, effectiveLifeYears, purchaseDateString, method = 'prime_cost') => {
        const numCost = parseFloat(cost || 0);
        const numEffectiveLife = parseInt(effectiveLifeYears || 0);
        const numWorkPercentage = parseInt(workPercentage || 0);

        if (numCost <= 0) return 0;
        
        if (!effectiveLifeYears || effectiveLifeYears <= 0) {
             return numCost * (numWorkPercentage / 100);
        }

        if (!purchaseDateString || typeof purchaseDateString !== 'string') return 0;
        const purchaseDate = new Date(purchaseDateString);
        if (isNaN(purchaseDate.getTime())) return 0;

        const yearStart = parseInt(window.FINANCIAL_YEAR.split('-')[0]);
        const financialYearStart = new Date(yearStart, 6, 1);
        const financialYearEnd = new Date(yearStart + 1, 5, 30);

        if (purchaseDate > financialYearEnd) return 0;

        let openingValue = numCost;
        
        if (method === 'diminishing_value' && purchaseDate < financialYearStart) {
            // Determine which Australian FY the asset was acquired in (FY starts Jul 1).
            // Month >= 6 means Jul-Dec: acquisition FY starts in the purchase calendar year.
            // Month < 6 means Jan-Jun: acquisition FY started the previous calendar year.
            const purchaseMonth = purchaseDate.getMonth();
            const acqFYStartYear = purchaseMonth >= 6 ? purchaseDate.getFullYear() : purchaseDate.getFullYear() - 1;
            const acqFYEnd = new Date(acqFYStartYear + 1, 5, 30);

            // Pro-rate the acquisition year deduction, then apply full DV for each subsequent FY.
            const acqDaysOwned = Math.floor((acqFYEnd - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
            const acqAnnualDepr = numEffectiveLife <= 1 ? openingValue : openingValue * (2 / numEffectiveLife);
            openingValue = Math.max(0, openingValue - acqAnnualDepr * (acqDaysOwned / 365));

            const completeFYs = yearStart - (acqFYStartYear + 1);
            for (let i = 0; i < completeFYs; i++) {
                const deprAmt = numEffectiveLife <= 1 ? openingValue : openingValue * (2 / numEffectiveLife);
                openingValue = Math.max(0, openingValue - deprAmt);
            }
        }
        
        let annualDepreciation;
        if (method === 'diminishing_value') {
            annualDepreciation = (numEffectiveLife <= 1) ? openingValue : openingValue * (2 / numEffectiveLife);
        } else {
            annualDepreciation = numCost / numEffectiveLife;
        }

        const workRelatedDepreciation = annualDepreciation * (numWorkPercentage / 100);

        if (purchaseDate >= financialYearStart && purchaseDate <= financialYearEnd) {
            const daysInYear = 365;
            const daysOwned = Math.floor((financialYearEnd - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
            const proRataFactor = Math.max(0, daysOwned / daysInYear);
            return workRelatedDepreciation * proRataFactor;
        }
        
        return workRelatedDepreciation;
    };

    const calculateTotalGeneralDeductions = (generalExpenses) => {
        const financialYearEnd = new Date(parseInt(window.FINANCIAL_YEAR.split('-')[1]), 5, 30);
        return generalExpenses
            .filter(exp => new Date(exp.date) <= financialYearEnd)
            .reduce((total, exp) => {
                const deduction = exp.isDepreciable 
                    ? calculateDepreciationForFinancialYear(exp.cost, exp.workPercentage, exp.effectiveLife, exp.date, exp.depreciationMethod)
                    : (parseFloat(exp.cost || 0) * (parseFloat(exp.workPercentage || 0) / 100));
                return total + deduction;
            }, 0);
    };

    const calculateWfhRunningExpensesDeduction = (details) => {
        if (!details) return 0;
        let totalDeduction = 0;
        const officeArea = parseFloat(details.officeArea || 0);
        const totalHomeArea = parseFloat(details.totalHomeArea || 0);
        const floorAreaPercent = (officeArea > 0 && totalHomeArea > 0) ? officeArea / totalHomeArea : 0;

        totalDeduction += (parseFloat(details.electricityCost || 0) + parseFloat(details.gasCost || 0)) * floorAreaPercent;
        totalDeduction += parseFloat(details.internetCost || 0) * (parseFloat(details.internetWorkPercent || 0) / 100);
        totalDeduction += parseFloat(details.phoneCost || 0);
        totalDeduction += parseFloat(details.stationeryCost || 0);
        return totalDeduction;
    };

    const calculateWfhAssetsDeduction = (assets) => {
        if (!assets || assets.length === 0) return 0;
        return assets.reduce((total, asset) => {
            const deduction = asset.isDepreciable
                ? calculateDepreciationForFinancialYear(asset.cost, asset.workPercentage, asset.effectiveLife, asset.date, asset.depreciationMethod)
                : (parseFloat(asset.cost || 0) * (parseFloat(asset.workPercentage || 100) / 100));
            return total + deduction;
        }, 0);
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
        if (income <= 18200) return 0;
        const bracket = window.TAX_RATES_2025.slice().reverse().find(b => income >= b.min);
        if (!bracket) return 0;
        return bracket.base + ((income - (bracket.min - 1)) * bracket.rate);
    };

    const calculateLITO = (taxableIncome) => {
        if (taxableIncome <= 18200) return 0;
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
            const childAdjustment = (taxpayerDetails.dependentChildren || 0) * window.MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT;
            threshold = window.MEDICARE_LEVY_THRESHOLD_FAMILY + childAdjustment;
            upperThreshold = window.MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY + childAdjustment;
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
            const exemptDays = taxpayerDetails.medicareExemptDays || 0;
            if (exemptDays >= 365) return 0;
            const liableDays = 365 - exemptDays;
            return (fullYearLevy / 365) * liableDays;
        }

        return fullYearLevy;
    };

    const getIncomeForMls = (taxableIncome, taxpayerDetails) => {
         return taxableIncome + (parseFloat(taxpayerDetails.reportableFringeBenefits) || 0) + (parseFloat(taxpayerDetails.personalSuperContribution) || 0);
    }

    const calculateMLS = (taxableIncome, taxpayerDetails) => {
        if (!taxpayerDetails || taxpayerDetails.hasPrivateHospitalCover) {
            return 0;
        }
        
        const incomeForMls = getIncomeForMls(taxableIncome, taxpayerDetails);
        let surchargeRate = 0;

        if (taxpayerDetails.filingStatus === 'family') {
            const familyIncomeForMls = incomeForMls + (parseFloat(taxpayerDetails.spouseIncome) || 0);
            const childAdjustment = taxpayerDetails.dependentChildren > 1
                ? (taxpayerDetails.dependentChildren - 1) * window.MLS_CHILD_ADJUSTMENT
                : 0;

            const familyThresholds = window.MLS_THRESHOLDS_FAMILY.map(tier => ({
                ...tier,
                min: tier.min > 0 ? tier.min + childAdjustment : 0,
                max: tier.max !== Infinity ? tier.max + childAdjustment : Infinity,
            }));
            
            const bracket = familyThresholds.slice().reverse().find(b => familyIncomeForMls >= b.min);
            if (bracket) surchargeRate = bracket.rate;
        } else {
            const bracket = window.MLS_THRESHOLDS_SINGLE.slice().reverse().find(b => incomeForMls >= b.min);
            if (bracket) surchargeRate = bracket.rate;
        }

        return incomeForMls * surchargeRate;
    };
    
    const calculatePhiOffset = (taxableIncome, taxpayerDetails) => {
        const { phiAgeBracket, phiPremiumsPaid_period1, phiPremiumsPaid_period2, phiRebateReceived, filingStatus, spouseIncome } = taxpayerDetails;
        if ((phiPremiumsPaid_period1 || 0) <= 0 && (phiPremiumsPaid_period2 || 0) <= 0) {
            return 0;
        }

        const incomeForPhi = getIncomeForMls(taxableIncome, taxpayerDetails);
        const totalIncome = filingStatus === 'family' ? incomeForPhi + (parseFloat(spouseIncome) || 0) : incomeForPhi;

        const thresholds = filingStatus === 'family' ? window.MLS_THRESHOLDS_FAMILY : window.MLS_THRESHOLDS_SINGLE;
        let incomeTier = 'base';
        if (totalIncome >= thresholds[1].min && totalIncome <= thresholds[1].max) {
            incomeTier = 'tier1';
        } else if (totalIncome >= thresholds[2].min && totalIncome <= thresholds[2].max) {
            incomeTier = 'tier2';
        } else if (totalIncome >= thresholds[3].min) {
            incomeTier = 'tier3';
        }

        const periodKeys = Object.keys(window.PHI_REBATE_RATES_PERIODS).sort();
        const rebateRatePeriod1 = window.PHI_REBATE_RATES_PERIODS[periodKeys[0]][phiAgeBracket][incomeTier];
        const rebateRatePeriod2 = window.PHI_REBATE_RATES_PERIODS[periodKeys[1]][phiAgeBracket][incomeTier];

        const correctRebate1 = (parseFloat(phiPremiumsPaid_period1) || 0) * rebateRatePeriod1;
        const correctRebate2 = (parseFloat(phiPremiumsPaid_period2) || 0) * rebateRatePeriod2;

        const totalCorrectRebate = correctRebate1 + correctRebate2;
        const offset = totalCorrectRebate - (parseFloat(phiRebateReceived) || 0);

        return Math.max(0, offset);
    };

    const calculateTotalOffsets = (taxableIncome, appData) => {
        const lito = calculateLITO(taxableIncome);
        const frankingCredits = parseFloat(appData.income.other.frankingCredits || 0);
        const phiOffset = calculatePhiOffset(taxableIncome, appData.taxpayerDetails);
        return { lito, frankingCredits, phiOffset, total: lito + frankingCredits + phiOffset };
    };

    const calculateNetTaxPayable = (grossTax, medicareLevy, mls, totalOffsets) => {
        return Math.max(0, grossTax + medicareLevy + mls - totalOffsets);
    };

    const calculateFinalOutcome = (totalTaxWithheld, netTaxPayable) => {
        return totalTaxWithheld - netTaxPayable;
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

        const schedule = [];
        let openingValue = parseFloat(asset.cost);
        const workPct = (parseFloat(asset.workPercentage) || 100) / 100;
        const life = parseInt(asset.effectiveLife);
        const isDV = asset.depreciationMethod === 'diminishing_value';
        if (!asset.date || typeof asset.date !== 'string') return 'Invalid date';
        const purchaseDate = new Date(asset.date);
        if (isNaN(purchaseDate.getTime())) return 'Invalid date';
        const purchaseMonth = purchaseDate.getMonth();
        const fmt = (v) => (v || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

        // Acquisition FY: Jul-Dec purchases fall in the same calendar year's FY start.
        const acqFYStartYear = purchaseMonth >= 6 ? purchaseDate.getFullYear() : purchaseDate.getFullYear() - 1;
        const currentFYStartYear = parseInt(window.FINANCIAL_YEAR.split('-')[0]);

        // DV (life > 1) always has a residual after effective life — cap at life iterations (ATO practice).
        // PC and DV life=1 can have a partial-year residual, so allow one extra iteration.
        const maxIter = (!isDV || life <= 1) ? life + 1 : life;

        for (let i = 0; i < maxIter && openingValue > 0.005; i++) {
            const fyStartYear = acqFYStartYear + i;
            const fyLabel = `${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
            const isCurrent = fyStartYear === currentFYStartYear;

            const annualDepr = isDV
                ? (life <= 1 ? openingValue : openingValue * (2 / life))
                : parseFloat(asset.cost) / life;

            let proRataFactor = 1;
            let proRataNote = '';

            if (i === 0) {
                const acqFYEnd = new Date(acqFYStartYear + 1, 5, 30);
                const daysOwned = Math.floor((acqFYEnd - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
                if (daysOwned < 365) {
                    proRataFactor = daysOwned / 365;
                    const dvRate = isDV ? ` · ${life <= 1 ? 100 : Math.round(200 / life)}% DV/yr` : ` · ${Math.round(100 / life)}% PC/yr`;
                    proRataNote = ` <span style="opacity:0.55;font-size:0.8em">(${daysOwned}/365 days${dvRate})</span>`;
                }
            }

            const deduction = Math.min(annualDepr * workPct * proRataFactor, openingValue * workPct);
            openingValue = Math.max(0, openingValue - annualDepr * proRataFactor);

            const amountStr = `${fyLabel}: ${fmt(deduction)}${proRataNote}`;
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
        calculateDepreciationForFinancialYear,
        calculateWfhActualCostDeduction,
        calculateWfhRunningExpensesDeduction,
        calculateWfhAssetsDeduction,
        generateDepreciationSchedule
    };
})();

window.TaxCalculations = TaxCalculations;