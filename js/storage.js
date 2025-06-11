// js/storage.js
const StorageManager = (() => {
    // Unique key for storing data in localStorage, specific to the financial year.
    const APP_STORAGE_KEY = 'aussieTaxHelperData-2025';

    const getDefaultData = () => ({
        userSettings: {
            currentSection: 'dashboard-section',
            financialYear: FINANCIAL_YEAR,
        },
        taxpayerDetails: {
            isMedicareExempt: false,
            hasPrivateHospitalCover: false,
            reportableFringeBenefits: 0,
            personalSuperContribution: 0,
            filingStatus: 'single',
            spouseIncome: 0,
            dependentChildren: 0,
            phiAgeBracket: 'under65',
            phiPremiumsPaid: 0,
            phiRebateReceived: 0,
        },
        income: {
            payg: [],
            other: { 
                bankInterest: 0,
                dividendsUnfranked: 0,
                dividendsFranked: 0,
                frankingCredits: 0,
                netCapitalGains: 0 
            }
        },
        generalExpenses: [],
        wfh: {
            method: 'fixed_rate',
            hoursLog: [],
            totalMinutes: 0,
            actualCostDetails: {
                officeArea: 0, totalHomeArea: 0, electricityCost: 0, gasCost: 0,
                internetCost: 0, internetWorkPercent: 0, phoneCost: 0,
                stationeryCost: 0, assets: []
            }
        }
    });

    const loadData = () => {
        try {
            const storedData = localStorage.getItem(APP_STORAGE_KEY);
            const defaultData = getDefaultData();
            if (!storedData) {
                return defaultData;
            }
            
            const parsedData = JSON.parse(storedData);
            
            // Deep merge with default data to ensure new properties from updates are included.
            const mergedData = {
                ...defaultData,
                ...parsedData,
                userSettings: { ...defaultData.userSettings, ...(parsedData.userSettings || {}) },
                taxpayerDetails: { ...defaultData.taxpayerDetails, ...(parsedData.taxpayerDetails || {}) },
                income: { 
                    ...defaultData.income, 
                    ...(parsedData.income || {}),
                    other: { ...defaultData.income.other, ...(parsedData.income?.other || {}) }
                },
                wfh: { 
                    ...defaultData.wfh, 
                    ...(parsedData.wfh || {}),
                    actualCostDetails: { ...defaultData.wfh.actualCostDetails, ...(parsedData.wfh?.actualCostDetails || {}) }
                },
            };

            // Backwards compatibility: if old totalHours exists, convert it to totalMinutes
            if (mergedData.wfh.totalHours) {
                mergedData.wfh.totalMinutes = Math.round(mergedData.wfh.totalHours * 60);
                delete mergedData.wfh.totalHours;
            }
            if (mergedData.wfh.hoursLog.length > 0 && mergedData.wfh.hoursLog[0].hours) {
                 mergedData.wfh.hoursLog.forEach(log => {
                    log.minutes = Math.round(log.hours * 60);
                    delete log.hours;
                 });
            }


            return mergedData;
        } catch (e) {
            console.error("Error loading data from local storage:", e);
            UIManager.showNotification("Could not load saved data. Starting with a clean slate.");
            return getDefaultData();
        }
    };

    const saveData = (data) => {
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving data to local storage:", e);
            UIManager.showNotification("Failed to save data. Your browser's local storage might be full or disabled.");
        }
    };

    const clearAllData = () => {
        try {
            localStorage.removeItem(APP_STORAGE_KEY);
        } catch (e) {
            console.error("Error clearing data:", e);
            UIManager.showNotification("Failed to clear data.");
        }
    };

    const exportData = (data, format) => {
        try {
            let dataStr, blobType, fileExtension;
            if (format === 'json') {
                dataStr = JSON.stringify(data, null, 2);
                blobType = 'application/json';
                fileExtension = 'json';
            } else { 
                let csvContent = `Tax Calculator Data - Financial Year: ${data.userSettings.financialYear}\n\n`;
                
                // Helper function to convert an array of objects to a CSV string
                const arrayToCsv = (arr, headers, keys) => {
                    if (!arr || arr.length === 0) return `No data for this category.\n`;
                    const headerRow = headers.map(h => `"${h}"`).join(',');
                    const dataRows = arr.map(item =>
                        keys.map(key => `"${String(item[key] ?? '').replace(/"/g, '""')}"`).join(',')
                    );
                    return [headerRow, ...dataRows].join('\n');
                };

                // --- Build CSV Content Section by Section ---

                // Taxpayer Details
                csvContent += `"Taxpayer Details"\n${arrayToCsv(
                    [data.taxpayerDetails],
                    ['Filing Status', 'Spouse Income', 'Children', 'Medicare Exempt', 'Has Private Hospital Cover', 'Reportable Fringe Benefits', 'Personal Super Contribution', 'PHI Age Bracket', 'PHI Premiums Paid', 'PHI Rebate Received'],
                    ['filingStatus', 'spouseIncome', 'dependentChildren', 'isMedicareExempt', 'hasPrivateHospitalCover', 'reportableFringeBenefits', 'personalSuperContribution', 'phiAgeBracket', 'phiPremiumsPaid', 'phiRebateReceived']
                )}\n\n`;
                
                // PAYG Income
                csvContent += `"PAYG Income"\n${arrayToCsv(data.income.payg, ['Source Name', 'Gross Salary', 'Tax Withheld'], ['sourceName', 'grossSalary', 'taxWithheld'])}\n\n`;
                
                // Other Income (Now includes Net Capital Gains)
                csvContent += `"Other Income"\n${arrayToCsv(
                    [data.income.other],
                    ['Bank Interest', 'Unfranked Dividends', 'Franked Dividends', 'Franking Credits', 'Net Capital Gains'],
                    ['bankInterest', 'dividendsUnfranked', 'dividendsFranked', 'frankingCredits', 'netCapitalGains']
                )}\n\n`;

                // General Expenses
                csvContent += `"General Expenses"\n${arrayToCsv(
                    data.generalExpenses,
                    ['Description', 'Date', 'Cost', 'Category', 'Work %', 'Depreciable', 'Effective Life', 'Depreciation Method'],
                    ['description', 'date', 'cost', 'category', 'workPercentage', 'isDepreciable', 'effectiveLife', 'depreciationMethod']
                )}\n\n`;

                // WFH Method
                csvContent += `"Work-From-Home Details"\n"Method:","${data.wfh.method}"\n\n`;
                
                // WFH Hours Log
                csvContent += `"WFH Hours Log"\n${arrayToCsv(data.wfh.hoursLog, ['Date', 'Minutes'], ['date', 'minutes'])}\n\n`;
                
                // WFH Actual Cost - Running Costs
                csvContent += `"WFH Actual Cost - Running Costs"\n${arrayToCsv(
                    [data.wfh.actualCostDetails],
                    ['Office Area (m²)', 'Total Home Area (m²)', 'Electricity Cost ($)', 'Gas Cost ($)', 'Internet Cost ($)', 'Internet Work %', 'Phone Cost ($)', 'Stationery Cost ($)'],
                    ['officeArea', 'totalHomeArea', 'electricityCost', 'gasCost', 'internetCost', 'internetWorkPercent', 'phoneCost', 'stationeryCost']
                )}\n\n`;
                
                // WFH Actual Cost - Assets
                csvContent += `"WFH Actual Cost - Assets"\n${arrayToCsv(
                    data.wfh.actualCostDetails.assets,
                    ['Description', 'Date', 'Cost', 'Work %', 'Depreciable', 'Effective Life', 'Depreciation Method'],
                    ['description', 'date', 'cost', 'workPercentage', 'isDepreciable', 'effectiveLife', 'depreciationMethod']
                )}\n\n`;
                
                dataStr = csvContent;
                blobType = 'text/csv;charset=utf-8;';
                fileExtension = 'csv';
            }

            const blob = new Blob([dataStr], { type: blobType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tax_data_${FINANCIAL_YEAR}_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error exporting data:", e);
            UIManager.showNotification("Failed to export data.");
        }
    };
    
    const validateImportedData = (data) => {
        if (!data || typeof data !== 'object') return false;
        const hasTopLevelKeys = 'userSettings' in data && 'income' in data && 'generalExpenses' in data && 'wfh' in data && 'taxpayerDetails' in data;
        if (!hasTopLevelKeys) return false;
        const hasIncomeKeys = 'payg' in data.income && 'other' in data.income;
        const hasWfhKeys = 'method' in data.wfh && 'hoursLog' in data.wfh && 'actualCostDetails' in data.wfh;
        if (!hasIncomeKeys || !hasWfhKeys) return false;
        const areArrays = Array.isArray(data.income.payg) && Array.isArray(data.generalExpenses) && Array.isArray(data.wfh.hoursLog);
        if(!areArrays) return false;
        return true;
    };

    const importData = (file, callback) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (validateImportedData(importedData)) {
                    callback(importedData);
                } else {
                    UIManager.showNotification("Invalid or corrupted data format in JSON file.");
                }
            } catch (error) {
                console.error("Failed to import data:", error);
                UIManager.showNotification("Failed to import data. File might be corrupted or not valid JSON.");
            }
        };
        reader.onerror = () => {
             UIManager.showNotification("Error reading the selected file.");
        };
        reader.readAsText(file);
    };

    const importWfhHoursFromCSV = (file, callback) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            UIManager.showNotification("Please select a valid CSV file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const lines = csvContent.split(/\r\n|\n/).filter(line => line.trim() !== '');
                
                const headerLine = lines[0] ? lines[0].toLowerCase() : '';
                if (headerLine.includes('day') && headerLine.includes('time') && headerLine.includes('description')) {
                    lines.shift();
                }

                const dailyMinutes = {};

                lines.forEach((line, index) => {
                    const columns = line.split(',');
                    if (columns.length < 2) {
                        console.warn(`Skipping malformed line ${index + 1}: Not enough columns.`);
                        return;
                    }

                    let dateStr = columns[0].replace(/^"|"$/g, '').trim();
                    const timeStr = columns[1].replace(/^"|"$/g, '').trim();
                    let totalMinutesForLine = 0;

                    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                        const timeParts = timeStr.split(':');
                        const hours = parseInt(timeParts[0], 10);
                        const minutes = parseInt(timeParts[1], 10);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            totalMinutesForLine = (hours * 60) + minutes;
                        }
                    }

                    if (totalMinutesForLine <= 0) {
                        console.warn(`Skipping line ${index + 1} due to invalid or zero duration: ${line}`);
                        return;
                    }

                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                        const parts = dateStr.split('/');
                        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                        const parts = dateStr.split('-');
                        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }

                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        dailyMinutes[dateStr] = (dailyMinutes[dateStr] || 0) + totalMinutesForLine;
                    } else {
                        console.warn(`Skipping line ${index + 1} due to unrecognized date format: ${line}`);
                    }
                });

                const importedLogs = Object.keys(dailyMinutes).map(date => ({
                    date: date,
                    minutes: dailyMinutes[date]
                }));

                if (importedLogs.length > 0) {
                    callback(importedLogs);
                } else {
                    UIManager.showNotification("Could not find any valid hour entries in the file. Please check the file format.");
                }

            } catch (error) {
                console.error("Failed to import WFH hours from CSV:", error);
                UIManager.showNotification("An error occurred while parsing the CSV file.");
            }
        };

        reader.onerror = () => {
             UIManager.showNotification("Error reading the selected file.");
        };

        reader.readAsText(file);
    };

    return { loadData, saveData, clearAllData, exportData, importData, getDefaultData, importWfhHoursFromCSV };
})();
