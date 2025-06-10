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
    
    /**
     * Calculates the depreciation deduction for a single asset for the current financial year.
     * Implements both Prime Cost (Straight Line) and Diminishing Value methods correctly.
     * @param {number} cost - The original cost of the asset.
     * @param {number} workPercentage - The percentage of work-related use.
     * @param {number} effectiveLifeYears - The effective life of the asset in years.
     * @param {string} purchaseDateString - The date the asset was purchased (YYYY-MM-DD).
     * @param {string} method - The depreciation method ('prime_cost' or 'diminishing_value').
     * @returns {number} The depreciation deduction for the current financial year.
     */
    const calculateDepreciationForFinancialYear = (cost, workPercentage, effectiveLifeYears, purchaseDateString, method = 'prime_cost') => {
        const numCost = parseFloat(cost || 0);
        const numEffectiveLife = parseInt(effectiveLifeYears || 0);
        const numWorkPercentage = parseInt(workPercentage || 0);

        // No depreciation if cost is zero. An item under $300 is depreciable if it has an effective life.
        if (numCost <= 0) return 0;
        
        // If it's not marked as depreciable (i.e., immediate claim)
        if (!effectiveLifeYears || effectiveLifeYears <= 0) {
             return numCost * (numWorkPercentage / 100);
        }

        const purchaseDate = new Date(purchaseDateString);
        const yearStart = parseInt(window.FINANCIAL_YEAR.split('-')[0]);
        const financialYearStart = new Date(yearStart, 6, 1); // 1 July
        const financialYearEnd = new Date(yearStart + 1, 5, 30); // 30 June
        
        // Return 0 if the purchase date is invalid or in a future financial year.
        if (isNaN(purchaseDate.getTime()) || purchaseDate > financialYearEnd) return 0;

        let openingValue = numCost;
        
        // For Diminishing Value, calculate the written-down value at the start of THIS financial year.
        if (method === 'diminishing_value' && purchaseDate < financialYearStart) {
            const purchaseYear = purchaseDate.getFullYear();
            const purchaseMonth = purchaseDate.getMonth();
            let yearsOwnedBeforeThisFY = yearStart - purchaseYear;
            if (purchaseMonth > 5) { // after 30 June, so it's in the next FY's start
                yearsOwnedBeforeThisFY -= 1;
            }

            for (let i = 0; i < yearsOwnedBeforeThisFY; i++) {
                // Base depreciation on the opening value for each year owned prior
                if (numEffectiveLife <= 1) {
                    openingValue -= openingValue;
                } else {
                    openingValue -= openingValue * (2 / numEffectiveLife);
                }
            }
        }
        
        let annualDepreciation;
        if (method === 'diminishing_value') {
            if (numEffectiveLife <= 1) { // Handle 1-year effective life edge case
                annualDepreciation = openingValue;
            } else {
                annualDepreciation = openingValue * (2 / numEffectiveLife);
            }
        } else { // Prime Cost
            annualDepreciation = numCost / numEffectiveLife;
        }

        const workRelatedDepreciation = annualDepreciation * (numWorkPercentage / 100);

        // Pro-rata calculation if purchased within the current financial year.
        if (purchaseDate >= financialYearStart && purchaseDate <= financialYearEnd) {
            const daysInYear = 365;
            const daysOwned = Math.floor((financialYearEnd - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
            const proRataFactor = Math.max(0, daysOwned / daysInYear);
            return workRelatedDepreciation * proRataFactor;
        }
        
        return workRelatedDepreciation;
    };

    const calculateTotalGeneralDeductions = (generalExpenses) => {
        const financialYearEnd = new Date(parseInt(FINANCIAL_YEAR.split('-')[1]), 5, 30);
        return generalExpenses
            .filter(exp => new Date(exp.date) <= financialYearEnd) // Filter out future-dated expenses
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
        const runningExpenses = calculateWfhRunningExpensesDeduction(details);
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
        if (!taxpayerDetails || taxpayerDetails.isMedicareExempt) {
            return 0;
        }
        // Basic logic for single threshold. A complete implementation would handle family thresholds.
        if (taxableIncome <= window.MEDICARE_LEVY_THRESHOLD_SINGLE) return 0;
        if (taxableIncome <= window.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE) {
            return (taxableIncome - window.MEDICARE_LEVY_THRESHOLD_SINGLE) * 0.10; // 10% phase-in rate
        }
        return taxableIncome * window.MEDICARE_LEVY_RATE;
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
        } else { // Single
            const bracket = window.MLS_THRESHOLDS_SINGLE.slice().reverse().find(b => incomeForMls >= b.min);
            if (bracket) surchargeRate = bracket.rate;
        }

        return incomeForMls * surchargeRate;
    };
    
    const calculatePhiOffset = (taxableIncome, taxpayerDetails) => {
        const { phiAgeBracket, phiPremiumsPaid, phiRebateReceived, filingStatus, spouseIncome } = taxpayerDetails;
        if (!phiPremiumsPaid || phiPremiumsPaid <= 0) return 0;

        const incomeForPhi = getIncomeForMls(taxableIncome, taxpayerDetails);
        let incomeTier = 'base';
        
        // Determine income tier
        const thresholds = filingStatus === 'family' ? window.MLS_THRESHOLDS_FAMILY : window.MLS_THRESHOLDS_SINGLE;
        const totalIncome = filingStatus === 'family' ? incomeForPhi + (parseFloat(spouseIncome) || 0) : incomeForPhi;

        if (totalIncome >= thresholds[1].min && totalIncome <= thresholds[1].max) incomeTier = 'tier1';
        else if (totalIncome >= thresholds[2].min && totalIncome <= thresholds[2].max) incomeTier = 'tier2';
        else if (totalIncome >= thresholds[3].min) incomeTier = 'tier3';

        const rebateRate = window.PHI_REBATE_RATES[phiAgeBracket][incomeTier];
        const correctRebate = (parseFloat(phiPremiumsPaid) || 0) * rebateRate;
        const offset = correctRebate - (parseFloat(phiRebateReceived) || 0);
        
        return Math.max(0, offset); // Cannot be negative
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
        calculateWfhAssetsDeduction
    };
})();