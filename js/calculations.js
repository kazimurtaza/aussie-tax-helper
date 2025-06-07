// js/calculations.js

const TaxCalculations = (() => {

    const calculateTotalAssessableIncome = (incomeData) => {
        const paygIncome = incomeData.payg.reduce((sum, item) => sum + parseFloat(item.grossSalary || 0), 0);
        const bankInterest = parseFloat(incomeData.other.bankInterest || 0);
        const dividendsUnfranked = parseFloat(incomeData.other.dividendsUnfranked || 0);
        const dividendsFranked = parseFloat(incomeData.other.dividendsFranked || 0);
        const frankingCredits = parseFloat(incomeData.other.frankingCredits || 0);
        const otherIncome = bankInterest + dividendsUnfranked + dividendsFranked + frankingCredits;
        return paygIncome + otherIncome;
    };

    const calculateDepreciation = (cost, effectiveLifeYears, workPercentage, purchaseDateString) => {
        const numCost = parseFloat(cost || 0);
        const numEffectiveLife = parseInt(effectiveLifeYears || 0);
        const numWorkPercentage = parseInt(workPercentage || 0);
        if (numCost <= 0 || numEffectiveLife <= 0) return 0;
        if (numCost <= 300) return numCost * (numWorkPercentage / 100);

        const annualDepreciation = numCost / numEffectiveLife;
        const workRelatedDepreciation = annualDepreciation * (numWorkPercentage / 100);
        
        const purchaseDate = new Date(purchaseDateString);
        const yearStart = parseInt(window.FINANCIAL_YEAR.split('-')[0]);
        const financialYearStart = new Date(yearStart, 6, 1);
        const financialYearEnd = new Date(yearStart + 1, 5, 30);

        if (isNaN(purchaseDate.getTime()) || purchaseDate > financialYearEnd) return 0;
        if (purchaseDate < financialYearStart) return workRelatedDepreciation;

        const daysInYear = 365; 
        const daysOwned = Math.floor((financialYearEnd - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
        const proRataFactor = Math.max(0, daysOwned / daysInYear);
        return workRelatedDepreciation * proRataFactor;
    };

    const calculateTotalGeneralDeductions = (generalExpenses) => {
        return generalExpenses.reduce((total, exp) => {
            const cost = parseFloat(exp.cost || 0);
            const workPercentage = parseFloat(exp.workPercentage || 0);
            const deduction = exp.isDepreciable 
                ? calculateDepreciation(cost, exp.effectiveLife, workPercentage, exp.date)
                : (cost * (workPercentage / 100));
            return total + deduction;
        }, 0);
    };
    
    const calculateFloorAreaPercentage = (details) => {
        const officeArea = parseFloat(details?.officeArea || 0);
        const totalHomeArea = parseFloat(details?.totalHomeArea || 0);
        if (officeArea > 0 && totalHomeArea > 0) {
            return ((officeArea / totalHomeArea) * 100).toFixed(2) + '%';
        }
        return '0.00%';
    };

    const calculateWfhActualCostDeduction = (details) => {
        if (!details) return 0;
        let totalDeduction = 0;
        const officeArea = parseFloat(details.officeArea || 0);
        const totalHomeArea = parseFloat(details.totalHomeArea || 0);
        const floorAreaPercent = (officeArea > 0 && totalHomeArea > 0) ? officeArea / totalHomeArea : 0;

        totalDeduction += parseFloat(details.electricityCost || 0) * floorAreaPercent;
        totalDeduction += parseFloat(details.gasCost || 0) * floorAreaPercent;
        totalDeduction += parseFloat(details.internetCost || 0) * (parseFloat(details.internetWorkPercent || 0) / 100);
        totalDeduction += parseFloat(details.phoneCost || 0);
        totalDeduction += parseFloat(details.stationeryCost || 0);

        if (details.assets && details.assets.length > 0) {
            details.assets.forEach(asset => {
                totalDeduction += calculateDepreciation(asset.cost, asset.effectiveLife, 100, asset.date);
            });
        }
        return totalDeduction;
    };

    const calculateTotalWfhDeductions = (wfhData) => {
        if (wfhData.method === 'fixed_rate') {
            return parseFloat(wfhData.totalHours || 0) * window.WFH_FIXED_RATE_PER_HOUR;
        } else if (wfhData.method === 'actual_cost') {
            return calculateWfhActualCostDeduction(wfhData.actualCostDetails);
        }
        return 0;
    };

    const calculateOverallTotalDeductions = (appData) => {
        const generalDeductions = calculateTotalGeneralDeductions(appData.generalExpenses);
        const wfhDeductions = calculateTotalWfhDeductions(appData.wfh);
        return generalDeductions + wfhDeductions;
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
        if (taxableIncome <= window.LITO_THRESHOLD_1) return window.LITO_MAX_OFFSET;
        if (taxableIncome > window.LITO_THRESHOLD_3) return 0;
        
        let offset;
        if (taxableIncome <= window.LITO_THRESHOLD_2) {
            offset = window.LITO_MAX_OFFSET - (taxableIncome - window.LITO_THRESHOLD_1) * window.LITO_REDUCTION_RATE_1;
        } else {
            const baseReduction = (window.LITO_THRESHOLD_2 - window.LITO_THRESHOLD_1) * window.LITO_REDUCTION_RATE_1; // This is 375
            offset = (window.LITO_MAX_OFFSET - baseReduction) - ((taxableIncome - window.LITO_THRESHOLD_2) * window.LITO_REDUCTION_RATE_2);
        }
        return Math.max(0, offset);
    };
    
    const calculateMedicareLevy = (taxableIncome) => {
        if (taxableIncome <= window.MEDICARE_LEVY_THRESHOLD_SINGLE) return 0;
        if (taxableIncome <= window.MEDICARE_LEVY_PHASE_IN_UPPER_SINGLE) {
            return (taxableIncome - window.MEDICARE_LEVY_THRESHOLD_SINGLE) * 0.10;
        }
        return taxableIncome * window.MEDICARE_LEVY_RATE;
    };

    const calculateTotalOffsets = (otherIncome, lito) => {
        return lito + parseFloat(otherIncome.frankingCredits || 0);
    };

    const calculateNetTaxPayable = (grossTax, medicareLevy, totalOffsets) => {
        return Math.max(0, grossTax + medicareLevy - totalOffsets);
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
        calculateTotalOffsets,
        calculateNetTaxPayable,
        calculateFinalOutcome,
        calculateDepreciation,
        calculateWfhActualCostDeduction,
        calculateFloorAreaPercentage
    };
})();