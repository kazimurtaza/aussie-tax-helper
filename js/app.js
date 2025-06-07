// js/app.js

const App = (() => {
    // The single source of truth for the application's state.
    let appData = StorageManager.loadData();

    /**
     * Initializes the application, sets up event listeners, and performs the first render.
     */
    const init = () => {
        setupEventListeners();
        refreshUI(); // Initial render based on loaded data.
    };
    
    /**
     * A centralized function to refresh the entire UI based on the current appData.
     * This function is the single point of contact for all major UI updates.
     */
    const refreshUI = () => {
        UIManager.updateAllSummaries(appData);
        UIManager.displayIncomeList(appData.income.payg, appData.income.other);
        UIManager.displayGeneralExpensesList(appData.generalExpenses);
        UIManager.displayWfhHoursList(appData.wfh.hoursLog);
        UIManager.displayWfhAssetsList(appData.wfh.actualCostDetails.assets);
        UIManager.updateWfhMethodDisplay(appData.wfh.method);
        UIManager.populateOtherIncomeForm(appData.income.other);
        UIManager.populateWfhActualCostForm(appData.wfh.actualCostDetails);
        UIManager.showSection(appData.userSettings.currentSection || 'dashboard-section');
    };

    /**
     * Saves the current application state to local storage and then refreshes the UI.
     * This is the primary method to call after any data modification.
     */
    const saveAndRefresh = () => {
        StorageManager.saveData(appData);
        refreshUI();
    };

    /**
     * Generates a unique ID for new data entries.
     * @param {string} prefix - A prefix for the ID (e.g., 'payg', 'exp').
     * @returns {string} A unique identifier.
     */
    const generateId = (prefix) => `${prefix}_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Sets up all the necessary event listeners for the application's interactive elements.
     */
    const setupEventListeners = () => {
        // Navigation: Handle switching between sections.
        document.getElementById('main-nav').addEventListener('click', (e) => {
            if (e.target.matches('.nav-button')) {
                const sectionId = e.target.dataset.section;
                appData.userSettings.currentSection = sectionId;
                UIManager.showSection(sectionId); // Visually switch the section.
                StorageManager.saveData(appData); // Save the new active section.
            }
        });
        
        // Toggle for depreciable expense fields.
        const depreciableCheckbox = document.getElementById('expense-is-depreciable');
        const depreciationFields = document.getElementById('depreciation-fields');
        depreciableCheckbox.addEventListener('change', (e) => {
            depreciationFields.classList.toggle('hidden', !e.target.checked);
        });

        // Data Management Buttons
        document.getElementById('exportDataBtn').addEventListener('click', () => StorageManager.exportData(appData, 'json'));
        document.getElementById('exportCsvDataBtn').addEventListener('click', () => StorageManager.exportData(appData, 'csv'));
        document.getElementById('clearAllDataBtn').addEventListener('click', handleClearAllData);

        // Data Import: Reloads the app state from a file without a page refresh.
        document.getElementById('importDataInput').addEventListener('change', (e) => {
            StorageManager.importData(e.target.files[0], (importedData) => {
                appData = importedData; // Overwrite current state with imported data.
                saveAndRefresh();       // Save the new state and refresh the entire UI.
                UIManager.showNotification("Data imported successfully!");
            });
            e.target.value = null; // Reset file input.
        });

        // Form Submissions
        document.getElementById('income-form').addEventListener('submit', handleAddPaygIncome);
        document.getElementById('other-income-form').addEventListener('submit', handleUpdateOtherIncome);
        document.getElementById('general-expense-form').addEventListener('submit', handleAddGeneralExpense);
        document.getElementById('wfh-hours-form').addEventListener('submit', handleAddWfhHour);
        // FIXED: Added event listener for the actual cost form
        document.getElementById('wfh-actual-cost-form').addEventListener('submit', handleUpdateWfhActualCosts);
        document.getElementById('wfh-asset-form').addEventListener('submit', handleSaveWfhAsset);

        // WFH Method Buttons
        document.getElementById('wfh-use-fixed-rate-btn').addEventListener('click', () => setWfhMethod('fixed_rate'));
        document.getElementById('wfh-use-actual-cost-btn').addEventListener('click', () => setWfhMethod('actual_cost'));

        // FIXED: Added event listener for the Add WFH Asset button
        document.getElementById('add-wfh-asset-btn').addEventListener('click', handleAddWfhAsset);
        document.getElementById('wfh-asset-cancel-btn').addEventListener('click', () => UIManager.hideWfhAssetModal());

        // Printable Summary
        document.getElementById('generate-summary-report-btn').addEventListener('click', generatePrintableSummary);
    };
    
    // --- Event Handlers ---

    function handleClearAllData() {
        UIManager.showConfirmation("Are you sure you want to delete ALL data? This action cannot be undone.", () => {
            StorageManager.clearAllData();
            appData = StorageManager.getDefaultData(); // Reset state to default.
            saveAndRefresh(); // Save the cleared state and refresh UI.
            UIManager.showNotification("All data has been cleared.");
        });
    }

    function handleAddPaygIncome(e) {
        e.preventDefault();
        const form = e.target;
        const newPayg = {
            id: generateId('payg'),
            sourceName: form['income-source-name'].value.trim(),
            grossSalary: parseFloat(form['gross-salary'].value) || 0,
            taxWithheld: parseFloat(form['tax-withheld'].value) || 0,
        };

        if (newPayg.grossSalary > 0 && newPayg.sourceName) {
            appData.income.payg.push(newPayg);
            saveAndRefresh();
            form.reset();
            UIManager.showNotification("PAYG income added.");
        } else {
            UIManager.showNotification("Please enter a valid source name and gross salary.");
        }
    }

    const removePaygIncome = (id) => {
        UIManager.showConfirmation("Are you sure you want to remove this income source?", () => {
             appData.income.payg = appData.income.payg.filter(item => item.id !== id);
             saveAndRefresh();
        });
    };

    function handleUpdateOtherIncome(e) {
        e.preventDefault();
        const form = e.target;
        appData.income.other = {
            bankInterest: parseFloat(form['bank-interest'].value) || 0,
            dividendsUnfranked: parseFloat(form['dividends-unfranked'].value) || 0,
            dividendsFranked: parseFloat(form['dividends-franked'].value) || 0,
            frankingCredits: parseFloat(form['franking-credits'].value) || 0,
        };
        saveAndRefresh();
        UIManager.showNotification("Other income updated.");
    }

    function handleAddGeneralExpense(e) {
        e.preventDefault();
        const form = e.target;
        const isDepreciable = form['expense-is-depreciable'].checked;
        
        if (isDepreciable && !form['expense-effective-life'].value) {
            UIManager.showNotification("Please enter an effective life for depreciable assets.");
            return;
        }

        const newExpense = {
            id: generateId('exp'),
            description: form['expense-description'].value.trim(),
            date: form['expense-date'].value,
            cost: parseFloat(form['expense-cost'].value) || 0,
            category: form['expense-category'].value,
            workPercentage: parseInt(form['expense-work-percentage'].value) || 100,
            isDepreciable: isDepreciable,
            effectiveLife: isDepreciable ? (parseInt(form['expense-effective-life'].value) || 0) : 0,
        };

        if (newExpense.description && newExpense.date && newExpense.cost > 0) {
            appData.generalExpenses.push(newExpense);
            saveAndRefresh();
            form.reset();
            document.getElementById('depreciation-fields').classList.add('hidden');
            document.getElementById('expense-is-depreciable').checked = false;
            UIManager.showNotification("Expense added successfully.");
        } else {
            UIManager.showNotification("Please fill in description, date, and cost.");
        }
    }

    const removeGeneralExpense = (id) => {
        UIManager.showConfirmation("Are you sure you want to remove this expense?", () => {
            appData.generalExpenses = appData.generalExpenses.filter(exp => exp.id !== id);
            saveAndRefresh();
        });
    };

    function handleAddWfhHour(e) {
        e.preventDefault();
        const form = e.target;
        const newLog = {
            id: generateId('wfh'),
            date: form['wfh-date'].value,
            hours: parseFloat(form['wfh-hours'].value) || 0,
        };

        if (newLog.date && newLog.hours > 0) {
            appData.wfh.hoursLog.push(newLog);
            appData.wfh.totalHours = appData.wfh.hoursLog.reduce((sum, log) => sum + log.hours, 0);
            saveAndRefresh();
            form.reset();
        } else {
            UIManager.showNotification("Please enter a valid date and hours.");
        }
    }

    const removeWfhHour = (id) => {
        appData.wfh.hoursLog = appData.wfh.hoursLog.filter(log => log.id !== id);
        appData.wfh.totalHours = appData.wfh.hoursLog.reduce((sum, log) => sum + log.hours, 0);
        saveAndRefresh();
    };

    const setWfhMethod = (method) => {
        appData.wfh.method = method;
        saveAndRefresh();
    };

    // --- NEW/FIXED WFH Actual Cost Handlers ---
    
    function handleUpdateWfhActualCosts(e) {
        e.preventDefault();
        const form = e.target;
        const details = appData.wfh.actualCostDetails;

        details.officeArea = parseFloat(form['wfh-office-area'].value) || 0;
        details.totalHomeArea = parseFloat(form['wfh-total-home-area'].value) || 0;
        details.electricityCost = parseFloat(form['wfh-electricity-cost'].value) || 0;
        details.gasCost = parseFloat(form['wfh-gas-cost'].value) || 0;
        details.internetCost = parseFloat(form['wfh-internet-cost'].value) || 0;
        details.internetWorkPercent = parseInt(form['wfh-internet-work-percent'].value) || 0;
        details.phoneCost = parseFloat(form['wfh-phone-cost'].value) || 0;
        details.stationeryCost = parseFloat(form['wfh-stationery-cost'].value) || 0;

        saveAndRefresh();
        UIManager.showNotification("Actual cost details saved.");
    }
    
    function handleAddWfhAsset() {
        UIManager.showWfhAssetModal();
    }

    function handleSaveWfhAsset(e) {
        e.preventDefault();
        const form = e.target;
        const newAsset = {
            id: generateId('wfh_asset'),
            description: form['wfh-asset-description'].value.trim(),
            date: form['wfh-asset-date'].value,
            cost: parseFloat(form['wfh-asset-cost'].value) || 0,
            effectiveLife: parseInt(form['wfh-asset-effective-life'].value) || 0,
        };

        if (newAsset.description && newAsset.date && newAsset.cost > 0 && newAsset.effectiveLife > 0) {
            appData.wfh.actualCostDetails.assets.push(newAsset);
            saveAndRefresh();
            UIManager.hideWfhAssetModal();
            form.reset();
        } else {
            UIManager.showNotification("Please fill in all asset details with valid values.");
        }
    }

    const removeWfhAsset = (id) => {
        const assets = appData.wfh.actualCostDetails.assets;
        appData.wfh.actualCostDetails.assets = assets.filter(asset => asset.id !== id);
        saveAndRefresh();
    }

    const generatePrintableSummary = () => {
        const summaryNode = document.getElementById('summary-section').cloneNode(true);
        // Remove the button from the cloned node before creating the HTML string
        const buttonToRemove = summaryNode.querySelector('#generate-summary-report-btn');
        if (buttonToRemove) {
            buttonToRemove.remove();
        }

        const summaryHTML = summaryNode.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Tax Summary ${FINANCIAL_YEAR}</title>
                    <script src="https://cdn.tailwindcss.com"><\/script>
                    <style> 
                        body { padding: 2rem; font-family: sans-serif; } 
                        .summary-item.final-outcome { border-width: 2px !important; }
                    </style>
                </head>
                <body>${summaryHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Public API for the App module.
    // Functions exposed on `window.App` can be called from inline HTML event handlers (e.g., onclick).
    return {
        init,
        removePaygIncome,
        removeGeneralExpense,
        removeWfhHour,
        removeWfhAsset
    };
})();

// Expose App functions to global scope and initialize the application.
window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
