// js/storage.js

const StorageManager = (() => {
    // Unique key for storing data in localStorage, specific to the financial year.
    const APP_STORAGE_KEY = 'aussieTaxHelperData-2025';

    /**
     * Returns the default data structure for the application.
     * Ensures all necessary keys and objects exist, preventing errors.
     */
    const getDefaultData = () => ({
        userSettings: {
            currentSection: 'dashboard-section',
            financialYear: FINANCIAL_YEAR,
        },
        income: {
            payg: [],
            other: { bankInterest: 0, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0 }
        },
        generalExpenses: [],
        wfh: {
            method: 'fixed_rate',
            hoursLog: [],
            totalHours: 0,
            actualCostDetails: {
                officeArea: 0,
                totalHomeArea: 0,
                electricityCost: 0,
                gasCost: 0,
                internetCost: 0,
                internetWorkPercent: 0,
                phoneCost: 0,
                stationeryCost: 0,
                assets: []
            }
        }
    });

    /**
     * Loads application data from localStorage.
     * If no data is found, or if data is corrupt, returns the default structure.
     * It performs a deep merge to ensure data integrity if the app is updated with new fields.
     */
    const loadData = () => {
        try {
            const storedData = localStorage.getItem(APP_STORAGE_KEY);
            if (!storedData) {
                return getDefaultData();
            }
            const parsedData = JSON.parse(storedData);
            
            // Deep merge with default data to ensure new properties from updates are included.
            const defaultData = getDefaultData();
            const mergedData = {
                ...defaultData,
                ...parsedData,
                userSettings: { ...defaultData.userSettings, ...(parsedData.userSettings || {}) },
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
            return mergedData;
        } catch (e) {
            console.error("Error loading data from local storage:", e);
            UIManager.showNotification("Could not load saved data. Starting with a clean slate.");
            return getDefaultData();
        }
    };

    /**
     * Saves the provided data object to localStorage.
     * @param {object} data - The application state to save.
     */
    const saveData = (data) => {
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving data to local storage:", e);
            UIManager.showNotification("Failed to save data. Your browser's local storage might be full or disabled.");
        }
    };

    /**
     * Clears all application data from localStorage.
     */
    const clearAllData = () => {
        try {
            localStorage.removeItem(APP_STORAGE_KEY);
        } catch (e) {
            console.error("Error clearing data:", e);
            UIManager.showNotification("Failed to clear data.");
        }
    };

    /**
     * Exports the current application data to a file (JSON or CSV).
     * @param {object} data - The application state to export.
     * @param {string} format - The desired format ('json' or 'csv').
     */
    const exportData = (data, format) => {
        try {
            let dataStr, blobType, fileExtension;
            if (format === 'json') {
                dataStr = JSON.stringify(data, null, 2);
                blobType = 'application/json';
                fileExtension = 'json';
            } else { // csv
                let csvContent = `Tax Calculator Data - Financial Year: ${data.userSettings.financialYear}\n\n`;
                const arrayToCsv = (arr, headers, keys) => {
                    if (!arr || arr.length === 0) return `No data for this category.\n`;
                    const headerRow = headers.map(h => `"${h}"`).join(',');
                    const dataRows = arr.map(item =>
                        keys.map(key => `"${String(item[key] ?? '').replace(/"/g, '""')}"`).join(',')
                    );
                    return [headerRow, ...dataRows].join('\n');
                };
                csvContent += `"PAYG Income"\n${arrayToCsv(data.income.payg, ['Source Name', 'Gross Salary', 'Tax Withheld'], ['sourceName', 'grossSalary', 'taxWithheld'])}\n\n`;
                csvContent += `"Other Income"\n${arrayToCsv([data.income.other], ['Bank Interest', 'Unfranked Dividends', 'Franked Dividends', 'Franking Credits'], ['bankInterest', 'dividendsUnfranked', 'dividendsFranked', 'frankingCredits'])}\n\n`;
                csvContent += `"General Expenses"\n${arrayToCsv(data.generalExpenses, ['Description', 'Date', 'Cost', 'Category', 'Work %', 'Depreciable', 'Effective Life'], ['description', 'date', 'cost', 'category', 'workPercentage', 'isDepreciable', 'effectiveLife'])}\n\n`;
                csvContent += `"WFH Hours Log"\n${arrayToCsv(data.wfh.hoursLog, ['Date', 'Hours'], ['date', 'hours'])}\n\n`;
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

    /**
     * Imports data from a JSON file and uses a callback to update the app's state.
     * @param {File} file - The file selected by the user.
     * @param {function} callback - The function to call with the imported data.
     */
    const importData = (file, callback) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation to check if the file seems correct.
                if (importedData && importedData.userSettings && importedData.income && importedData.generalExpenses && importedData.wfh) {
                    callback(importedData); // Pass the data back to the app controller.
                } else {
                    UIManager.showNotification("Invalid data format in JSON file.");
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

    return { loadData, saveData, clearAllData, exportData, importData, getDefaultData };
})();
