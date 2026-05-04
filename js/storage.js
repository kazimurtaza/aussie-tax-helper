const StorageManager = (() => {
    // Notify callback — defaults to UIManager but can be overridden (e.g. in tests).
    let _notify = (msg) => {
        if (typeof UIManager !== 'undefined') UIManager.showNotification(msg);
    };
    const setNotifyCallback = (fn) => { _notify = fn; };

    // Dynamic storage key based on financial year (backward compatible)
    // 2024-2025 resolves to aussieTaxHelperData-2025
    const getStorageKey = (year) => `aussieTaxHelperData-${year.split('-')[1]}`;

    const getDefaultData = () => ({
        userSettings: {
            currentSection: 'dashboard-section',
            financialYear: window.FINANCIAL_YEAR,
        },
        taxpayerDetails: {
            isMedicareExempt: false,
            medicareExemptDays: 0,
            hasPrivateHospitalCover: false,
            reportableFringeBenefits: 0,
            personalSuperContribution: 0,
            filingStatus: 'single',
            spouseIncome: 0,
            dependentChildren: 0,
            phiAgeBracket: 'under65',
            phiPremiumsPaid_period1: 0, // For premiums from 1 July 2024 to 31 March 2025
            phiPremiumsPaid_period2: 0, // For premiums from 1 April 2025 to 30 June 2025
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
                properties: [],
                assets: []
            }
        }
    });

    const getYearsWithData = () => {
        return window.AVAILABLE_YEARS.filter(year => {
            const key = getStorageKey(year);
            const data = localStorage.getItem(key);
            return data !== null;
        });
    };

    const detectDefaultYear = () => {
        // Derive the current Australian financial year from today's date.
        // FY starts Jul 1: Jan-Jun → FY started previous calendar year.
        const today = new Date();
        const m = today.getMonth(); // 0 = Jan
        const y = today.getFullYear();
        const fyStartYear = m >= 6 ? y : y - 1;
        const currentFY = `${fyStartYear}-${fyStartYear + 1}`;

        // 1. Check saved preference — but only honour it if it matches the current FY
        //    or is the only year with data (user deliberately switched back to a prior year).
        const savedPreference = localStorage.getItem('aussieTaxHelper-activeYear');
        if (savedPreference && window.AVAILABLE_YEARS.includes(savedPreference)) {
            // If they explicitly chose a prior year we respect it; if it IS the current
            // FY that's fine too. Only ignore it if current FY is available and the
            // saved pref is stale from a previous tax season with no data yet this year.
            const currentFYAvailable = window.AVAILABLE_YEARS.includes(currentFY);
            const currentFYHasData = !!localStorage.getItem(getStorageKey(currentFY));
            if (savedPreference === currentFY || !currentFYAvailable || !currentFYHasData) {
                return savedPreference;
            }
            // Saved pref is a prior year AND current FY has data → switch to current FY.
            return currentFY;
        }

        // 2. Current Australian FY (if available)
        if (window.AVAILABLE_YEARS.includes(currentFY)) {
            return currentFY;
        }

        // 3. Most recent year with data
        const yearsWithData = getYearsWithData();
        if (yearsWithData.length > 0) {
            return yearsWithData[yearsWithData.length - 1];
        }

        // 4. Latest configured year
        return window.LATEST_YEAR;
    };

    const saveActiveYearPreference = (year) => {
        localStorage.setItem('aussieTaxHelper-activeYear', year);
    };

    const loadData = (year) => {
        const targetYear = year || window.FINANCIAL_YEAR;
        try {
            const key = getStorageKey(targetYear);
            const storedData = localStorage.getItem(key);
            const defaultData = getDefaultData();
            if (!storedData) {
                return defaultData;
            }

            const parsedData = JSON.parse(storedData);
            // --- BACKWARD COMPATIBILITY ---
            // If the old phiPremiumsPaid field exists, migrate its value to the new
            // phiPremiumsPaid_period1 field and delete the old one.
            if (parsedData.taxpayerDetails && parsedData.taxpayerDetails.phiPremiumsPaid) {
                parsedData.taxpayerDetails.phiPremiumsPaid_period1 = parsedData.taxpayerDetails.phiPremiumsPaid;
                delete parsedData.taxpayerDetails.phiPremiumsPaid;
            }
            // --- END BACKWARD COMPATIBILITY ---

            // Migrate old flat actualCostDetails to new properties-array format
            const acd = parsedData.wfh?.actualCostDetails;
            if (acd && !acd.properties) {
                const hasData = acd.officeArea || acd.totalHomeArea || acd.electricityCost ||
                    acd.gasCost || acd.internetCost || acd.phoneCost || acd.stationeryCost;
                parsedData.wfh.actualCostDetails = {
                    properties: hasData ? [{
                        id: 'migrated_prop_1',
                        description: 'Home (migrated)',
                        fromDate: '',
                        toDate: '',
                        officeArea: acd.officeArea || 0,
                        totalHomeArea: acd.totalHomeArea || 0,
                        electricityCost: acd.electricityCost || 0,
                        gasCost: acd.gasCost || 0,
                        internetCost: acd.internetCost || 0,
                        internetWorkPercent: acd.internetWorkPercent || 0,
                        phoneCost: acd.phoneCost || 0,
                        stationeryCost: acd.stationeryCost || 0,
                    }] : [],
                    assets: acd.assets || []
                };
            }

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
                    actualCostDetails: {
                        properties: parsedData.wfh?.actualCostDetails?.properties || defaultData.wfh.actualCostDetails.properties,
                        assets: parsedData.wfh?.actualCostDetails?.assets || defaultData.wfh.actualCostDetails.assets
                    }
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
            _notify("Could not load saved data. Starting with a clean slate.");
            return getDefaultData();
        }
    };

    const saveData = (data) => {
        try {
            const key = getStorageKey(window.FINANCIAL_YEAR);
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving data to local storage:", e);
            const isQuotaError = e instanceof DOMException && (
                e.code === 22 || e.code === 1014 ||
                e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
            );
            _notify(isQuotaError
                ? "Storage is full. Export your data and clear old years to free space."
                : "Failed to save data. Your browser's local storage may be disabled.");
        }
    };

    const clearAllData = () => {
        try {
            const key = getStorageKey(window.FINANCIAL_YEAR);
            localStorage.removeItem(key);
        } catch (e) {
            console.error("Error clearing data:", e);
            _notify("Failed to clear data.");
        }
    };

    const exportData = (currentData, format, scope = 'all') => {
        try {
            // Build the dataset based on scope
            let exportYearsData = {};
            if (scope === 'current') {
                exportYearsData[window.FINANCIAL_YEAR] = currentData;
            } else {
                // Collect all years from localStorage
                window.AVAILABLE_YEARS.forEach(year => {
                    const stored = localStorage.getItem(getStorageKey(year));
                    if (stored) {
                        try { exportYearsData[year] = JSON.parse(stored); } catch (_) {}
                    }
                });
                // Always include the current (possibly unsaved) appData for the active year
                exportYearsData[window.FINANCIAL_YEAR] = currentData;
            }

            const today = new Date().toISOString().slice(0, 10);
            const yearSlug = scope === 'current'
                ? window.FINANCIAL_YEAR.replace('-', '_')
                : 'all_years';
            let dataStr, blobType, fileExtension;

            if (format === 'json') {
                dataStr = JSON.stringify({ exportVersion: '2', exportDate: today, years: exportYearsData }, null, 2);
                blobType = 'application/json';
                fileExtension = 'json';
            } else {
                const arrayToCsv = (arr, headers, keys) => {
                    if (!arr || arr.length === 0) return `No data for this category.\n`;
                    const headerRow = headers.map(h => `"${h}"`).join(',');
                    const dataRows = arr.map(item =>
                        keys.map(key => `"${String(item[key] ?? '').replace(/"/g, '""')}"`).join(',')
                    );
                    return [headerRow, ...dataRows].join('\n');
                };

                const buildYearCsv = (data, year) => {
                    let s = `"=== Financial Year: ${year} ==="\n\n`;
                    s += `"Taxpayer Details"\n${arrayToCsv(
                        [data.taxpayerDetails],
                        ['Filing Status', 'Spouse Income', 'Children', 'Medicare Exempt', 'Medicare Exempt Days', 'Has Private Hospital Cover', 'Reportable Fringe Benefits', 'Personal Super Contribution', 'PHI Age Bracket', 'PHI Premiums Paid (Jul-Mar)', 'PHI Premiums Paid (Apr-Jun)', 'PHI Rebate Received'],
                        ['filingStatus', 'spouseIncome', 'dependentChildren', 'isMedicareExempt', 'medicareExemptDays', 'hasPrivateHospitalCover', 'reportableFringeBenefits', 'personalSuperContribution', 'phiAgeBracket', 'phiPremiumsPaid_period1', 'phiPremiumsPaid_period2', 'phiRebateReceived']
                    )}\n\n`;
                    s += `"PAYG Income"\n${arrayToCsv(data.income.payg, ['Source Name', 'Gross Salary', 'Tax Withheld'], ['sourceName', 'grossSalary', 'taxWithheld'])}\n\n`;
                    s += `"Other Income"\n${arrayToCsv(
                        [data.income.other],
                        ['Bank Interest', 'Unfranked Dividends', 'Franked Dividends', 'Franking Credits', 'Net Capital Gains'],
                        ['bankInterest', 'dividendsUnfranked', 'dividendsFranked', 'frankingCredits', 'netCapitalGains']
                    )}\n\n`;
                    s += `"General Expenses"\n${arrayToCsv(
                        data.generalExpenses,
                        ['Description', 'Date', 'Cost', 'Category', 'Work %', 'Depreciable', 'Effective Life', 'Depreciation Method'],
                        ['description', 'date', 'cost', 'category', 'workPercentage', 'isDepreciable', 'effectiveLife', 'depreciationMethod']
                    )}\n\n`;
                    s += `"Work-From-Home Details"\n"Method:","${data.wfh.method}"\n\n`;
                    s += `"WFH Hours Log"\n${arrayToCsv(data.wfh.hoursLog, ['Date', 'Minutes'], ['date', 'minutes'])}\n\n`;
                    const wfhProps = data.wfh.actualCostDetails.properties || [];
                    s += `"WFH Actual Cost - Property Periods"\n${arrayToCsv(
                        wfhProps,
                        ['Description', 'From Date', 'To Date', 'Office Area (m²)', 'Total Home Area (m²)', 'Electricity Cost ($)', 'Gas Cost ($)', 'Internet Cost ($)', 'Internet Work %', 'Phone Cost ($)', 'Stationery Cost ($)'],
                        ['description', 'fromDate', 'toDate', 'officeArea', 'totalHomeArea', 'electricityCost', 'gasCost', 'internetCost', 'internetWorkPercent', 'phoneCost', 'stationeryCost']
                    )}\n\n`;
                    s += `"WFH Actual Cost - Assets"\n${arrayToCsv(
                        data.wfh.actualCostDetails.assets,
                        ['Description', 'Date', 'Cost', 'Work %', 'Depreciable', 'Effective Life', 'Depreciation Method'],
                        ['description', 'date', 'cost', 'workPercentage', 'isDepreciable', 'effectiveLife', 'depreciationMethod']
                    )}\n\n`;
                    return s;
                };

                dataStr = Object.entries(exportYearsData).map(([yr, d]) => buildYearCsv(d, yr)).join('\n');
                blobType = 'text/csv;charset=utf-8;';
                fileExtension = 'csv';
            }

            const blob = new Blob([dataStr], { type: blobType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tax_data_${yearSlug}_${today}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error exporting data:", e);
            _notify("Failed to export data.");
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
                // --- BACKWARD COMPATIBILITY MIGRATION ---
                // If old phiPremiumsPaid exists, migrate it to the new period1 field.
                if (importedData.taxpayerDetails && importedData.taxpayerDetails.phiPremiumsPaid) {
                    importedData.taxpayerDetails.phiPremiumsPaid_period1 = importedData.taxpayerDetails.phiPremiumsPaid;
                    delete importedData.taxpayerDetails.phiPremiumsPaid; // Remove the old field
                }
                // Backwards compatibility for WFH hours
                if (importedData.wfh && importedData.wfh.totalHours) {
                    importedData.wfh.totalMinutes = Math.round(importedData.wfh.totalHours * 60);
                    delete importedData.wfh.totalHours;
                }
                if (importedData.wfh && importedData.wfh.hoursLog.length > 0 && importedData.wfh.hoursLog[0].hours) {
                    importedData.wfh.hoursLog.forEach(log => {
                        log.minutes = Math.round(log.hours * 60);
                        delete log.hours;
                    });
                }
                // --- END BACKWARD COMPATIBILITY MIGRATION ---
                // Detect multi-year export format (exportVersion 2)
                if (importedData.exportVersion === '2' && importedData.years && typeof importedData.years === 'object') {
                    const yearsImported = Object.keys(importedData.years);
                    if (yearsImported.length === 0) {
                        _notify("No year data found in file.");
                        return;
                    }
                    // Save each year's data directly to localStorage
                    yearsImported.forEach(year => {
                        const yearData = importedData.years[year];
                        if (validateImportedData(yearData)) {
                            localStorage.setItem(getStorageKey(year), JSON.stringify(yearData));
                        }
                    });
                    // Switch to the most recent available imported year
                    const bestYear = yearsImported.filter(y => window.AVAILABLE_YEARS.includes(y)).pop()
                        || window.FINANCIAL_YEAR;
                    window.loadConstantsForYear(bestYear);
                    saveActiveYearPreference(bestYear);
                    callback(importedData.years[bestYear] || loadData(bestYear));
                } else if (validateImportedData(importedData)) {
                    // Legacy single-year format
                    const importedYear = importedData.userSettings?.financialYear;
                    if (importedYear && window.AVAILABLE_YEARS.includes(importedYear)) {
                        window.loadConstantsForYear(importedYear);
                        saveActiveYearPreference(importedYear);
                    }
                    callback(importedData);
                } else {
                    _notify("Invalid data format. Expected fields (income, generalExpenses, wfh, taxpayerDetails) not found. Is this an Aussie Tax Helper export?");
                }
            } catch (error) {
                console.error("Failed to import data:", error);
                const msg = error instanceof SyntaxError
                    ? `Invalid JSON: ${error.message}. Ensure the file has not been manually edited.`
                    : "Failed to import data. The file may be corrupted.";
                _notify(msg);
            }
        };
        reader.onerror = () => {
             _notify("Error reading the selected file.");
        };
        reader.readAsText(file);
    };

    const importWfhHoursFromCSV = (file, callback) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            _notify("Please select a valid CSV file.");
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
                        const parsedYear = parseInt(dateStr.slice(0, 4), 10);
                        if (parsedYear < 2000 || parsedYear > 2100) {
                            console.warn(`Skipping line ${index + 1} due to out-of-range date (${dateStr}): ${line}`);
                        } else {
                            dailyMinutes[dateStr] = (dailyMinutes[dateStr] || 0) + totalMinutesForLine;
                        }
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
                    _notify("Could not find any valid hour entries in the file. Please check the file format.");
                }

            } catch (error) {
                console.error("Failed to import WFH hours from CSV:", error);
                _notify("An error occurred while parsing the CSV file.");
            }
        };

        reader.onerror = () => {
             _notify("Error reading the selected file.");
        };

        reader.readAsText(file);
    };

    return {
        loadData,
        saveData,
        clearAllData,
        exportData,
        importData,
        getDefaultData,
        importWfhHoursFromCSV,
        getYearsWithData,
        detectDefaultYear,
        saveActiveYearPreference,
        setNotifyCallback
    };
})();
