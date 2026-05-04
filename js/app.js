// js/app.js
const trackEvent = (eventName, eventParams = {}) => {
    // Check if gtag is available
    if (typeof gtag === 'function') {
        gtag('event', eventName, eventParams);
        console.log(`Event tracked: ${eventName}`, eventParams); // Optional: for debugging
    }
};

// window.onerror = function(message, source, lineno, colno, error) {
//   // Log errors to the console for debugging
//   console.error('An error occurred:', { message, source, lineno, colno, error });
//   if (typeof gtag === 'function') {
//     gtag('event', 'exception', {
//       'description': `${message} at ${source}:${lineno}`,
//       'fatal': false // set to true if the error is critical
//     });
//   }
//   return true; // Prevents the error from showing in the user's browser console
// };

const App = (() => {
    // The single source of truth for the application's state.
    // Changed to null - data loading now happens in init()
    let appData = null;

    const init = () => {
        // 1. Detect which year to load (saved preference, most recent with data, or latest)
        const activeYear = StorageManager.detectDefaultYear();

        // 2. Load constants for that year
        window.loadConstantsForYear(activeYear);

        // 3. Load data for that year
        appData = StorageManager.loadData(activeYear);

        // 4. Populate year selector dropdown
        UIManager.populateYearSelector(activeYear);

        // 5. Set up event listeners
        setupEventListeners();

        // 6. Show the current section
        UIManager.showSection(appData.userSettings.currentSection || 'dashboard-section');

        // 7. Refresh the UI with loaded data
        refreshUI();
    };

    const refreshUI = () => {
        UIManager.updateAllSummaries(appData);
        UIManager.displayIncomeList(appData.income.payg, appData.income.other);
        UIManager.populateTaxpayerDetailsForm(appData.taxpayerDetails);
        UIManager.displayGeneralExpensesList(appData.generalExpenses);
        UIManager.displayWfhHoursList(appData.wfh);
        UIManager.displayWfhAssetsList(appData.wfh.actualCostDetails.assets);
        UIManager.updateWfhMethodDisplay(appData.wfh.method);
        UIManager.populateOtherIncomeForm(appData.income.other);
        UIManager.displayWfhPropertiesList(appData.wfh.actualCostDetails.properties);
        UIManager.showSection(appData.userSettings.currentSection || 'dashboard-section');
    };

    // Sanitise numeric form inputs at the boundary — prevent negatives bypassing browser validation.
    const clampNum = (value, min = 0, max = Infinity) => Math.min(max, Math.max(min, parseFloat(value) || 0));
    const clampPct = (value) => clampNum(value, 0, 100);

    const saveAndRefresh = () => {
        StorageManager.saveData(appData);
        refreshUI();
    };

    const generateId = (prefix) => `${prefix}_${new Date().getTime()}_${Math.random().toString(36).substring(2, 11)}`;

    const setupEventListeners = () => {
        document.getElementById('main-nav').addEventListener('click', (e) => {
            if (e.target.matches('.nav-button')) {
                const sectionId = e.target.dataset.section;
                appData.userSettings.currentSection = sectionId;
                UIManager.showSection(sectionId);
                StorageManager.saveData(appData);

                trackEvent('navigation_click', { section: sectionId });
            }
        });

        // Year selector listener
        document.getElementById('financial-year-selector').addEventListener('change', (e) => {
            const newYear = e.target.value;
            window.loadConstantsForYear(newYear);
            StorageManager.saveActiveYearPreference(newYear);
            appData = StorageManager.loadData(newYear);
            UIManager.populateYearSelector(newYear);
            refreshUI();
        });

        document.getElementById('expense-is-depreciable').addEventListener('change', (e) => {
            document.getElementById('depreciation-fields').classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('edit-expense-is-depreciable').addEventListener('change', (e) => {
            document.getElementById('edit-depreciation-fields').classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('wfh-asset-is-depreciable').addEventListener('change', (e) => {
            document.getElementById('wfh-asset-depreciation-fields').classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            StorageManager.exportData(appData, 'json');

            trackEvent('data_management', { action: 'export_json' });
        });
        document.getElementById('exportCsvDataBtn').addEventListener('click', () => StorageManager.exportData(appData, 'csv'));
        document.getElementById('clearAllDataBtn').addEventListener('click', handleClearAllData);

        document.getElementById('importDataInput').addEventListener('change', (e) => {
            StorageManager.importData(e.target.files[0], (importedData) => {
                appData = importedData;
                saveAndRefresh();
                UIManager.populateYearSelector(window.FINANCIAL_YEAR); // Update selector in case import switched years
                UIManager.showNotification("Data imported successfully!");
            });
            e.target.value = null;
        });

        document.getElementById('wfh-hours-csv-import').addEventListener('change', handleImportWfhHours);

        document.getElementById('taxpayer-details-form').addEventListener('submit', handleUpdateTaxpayerDetails);
        const filingStatusDropdown = document.getElementById('filing-status');
        filingStatusDropdown.addEventListener('change', () => {
            UIManager.toggleFamilyFields(filingStatusDropdown.value === 'family');
        });
        // ADDED EVENT LISTENER
        document.getElementById('medicare-exempt').addEventListener('change', (e) => {
            UIManager.toggleMedicareDaysField(e.target.checked)
        });


        document.getElementById('income-form').addEventListener('submit', handleAddPaygIncome);
        document.getElementById('edit-payg-form').addEventListener('submit', handleSavePaygIncome);
        document.getElementById('edit-payg-cancel-btn').addEventListener('click', UIManager.hideEditPaygModal);

        document.getElementById('other-income-form').addEventListener('submit', handleUpdateOtherIncome);
        document.getElementById('general-expense-form').addEventListener('submit', handleAddGeneralExpense);
        document.getElementById('edit-expense-form').addEventListener('submit', handleSaveGeneralExpense);
        document.getElementById('edit-expense-cancel-btn').addEventListener('click', UIManager.hideEditExpenseModal);

        document.getElementById('wfh-hours-form').addEventListener('submit', handleAddWfhHour);

        document.getElementById('wfh-property-form').addEventListener('submit', handleSaveWfhProperty);
        document.getElementById('add-wfh-property-btn').addEventListener('click', () => UIManager.showWfhPropertyModal());
        document.getElementById('wfh-property-cancel-btn').addEventListener('click', UIManager.hideWfhPropertyModal);

        // Live floor % update in property modal
        ['wfh-property-office-area', 'wfh-property-total-home-area'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                const o = parseFloat(document.getElementById('wfh-property-office-area').value) || 0;
                const t = parseFloat(document.getElementById('wfh-property-total-home-area').value) || 0;
                document.getElementById('wfh-property-floor-pct').textContent =
                    (o > 0 && t > 0) ? ((o/t)*100).toFixed(2)+'%' : '0.00%';
            });
        });

        document.getElementById('wfh-asset-form').addEventListener('submit', handleSaveWfhAsset);
        document.getElementById('wfh-use-fixed-rate-btn').addEventListener('click', () => setWfhMethod('fixed_rate'));
        document.getElementById('wfh-use-actual-cost-btn').addEventListener('click', () => setWfhMethod('actual_cost'));
        document.getElementById('add-wfh-asset-btn').addEventListener('click', () => UIManager.showWfhAssetModal());
        document.getElementById('wfh-asset-cancel-btn').addEventListener('click', UIManager.hideWfhAssetModal);
        document.getElementById('generate-summary-report-btn').addEventListener('click', generatePrintableSummary);
    };

    // --- Event Handlers ---
    function handleUpdateTaxpayerDetails(e) {
        e.preventDefault();
        const form = e.target;
        appData.taxpayerDetails = {
            isMedicareExempt: form['medicare-exempt'].checked,
            medicareExemptDays: parseInt(form['medicare-exempt-days'].value) || 0,
            hasPrivateHospitalCover: form['private-cover'].checked,
            reportableFringeBenefits: parseFloat(form['rfb-amount'].value) || 0,
            personalSuperContribution: parseFloat(form['personal-super-contribution'].value) || 0,
            filingStatus: form['filing-status'].value,
            spouseIncome: parseFloat(form['spouse-income'].value) || 0,
            dependentChildren: parseInt(form['dependent-children'].value) || 0,
            phiAgeBracket: form['phi-age-bracket'].value,
            phiPremiumsPaid_period1: parseFloat(form['phi-premiums-paid-period1'].value) || 0,
            phiPremiumsPaid_period2: parseFloat(form['phi-premiums-paid-period2'].value) || 0,
            phiRebateReceived: parseFloat(form['phi-rebate-received'].value) || 0,
        };
        saveAndRefresh();
        UIManager.showNotification("Taxpayer details updated.");
    }

    function handleClearAllData() {
        UIManager.showConfirmation(`Are you sure you want to delete ALL data for FY ${window.FINANCIAL_YEAR}? This action cannot be undone.`, () => {
            StorageManager.clearAllData();
            appData = StorageManager.getDefaultData();
            saveAndRefresh();
            UIManager.showNotification("All data has been cleared.");

            trackEvent('data_management', { action: 'clear_all_data' });
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
        if (newPayg.grossSalary >= 0 && newPayg.sourceName) {
            appData.income.payg.push(newPayg);
            saveAndRefresh();
            form.reset();
            UIManager.showNotification("PAYG income added.");
        } else { UIManager.showNotification("Please enter a valid source name and gross salary."); }
    }

    const editPaygIncome = (id) => {
        const incomeItem = appData.income.payg.find(item => item.id === id);
        if (incomeItem) {
            UIManager.showEditPaygModal(incomeItem);
        }
    };

    function handleSavePaygIncome(e) {
        e.preventDefault();
        const form = e.target;
        const id = form['edit-payg-id'].value;
        const incomeIndex = appData.income.payg.findIndex(item => item.id === id);
        if (incomeIndex !== -1) {
            appData.income.payg[incomeIndex] = {
                id: id,
                sourceName: form['edit-income-source-name'].value.trim(),
                grossSalary: parseFloat(form['edit-gross-salary'].value) || 0,
                taxWithheld: parseFloat(form['edit-tax-withheld'].value) || 0,
            };
            saveAndRefresh();
            UIManager.hideEditPaygModal();
            UIManager.showNotification("PAYG income updated.");
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
            netCapitalGains: parseFloat(form['net-capital-gains'].value) || 0,
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
            cost: clampNum(form['expense-cost'].value),
            category: form['expense-category'].value,
            workPercentage: clampPct(form['expense-work-percentage'].value) || 100,
            isDepreciable: isDepreciable,
            effectiveLife: isDepreciable ? clampNum(form['expense-effective-life'].value) : 0,
            depreciationMethod: isDepreciable ? form['depreciation-method'].value : 'prime_cost',
        };
        if (newExpense.description && newExpense.date && newExpense.cost >= 0) {
            appData.generalExpenses.push(newExpense);
            saveAndRefresh();
            form.reset();
            document.getElementById('depreciation-fields').classList.add('hidden');
            document.getElementById('expense-is-depreciable').checked = false;
            UIManager.showNotification("Expense added successfully.");

            trackEvent('add_general_expense', { category: newExpense.category, is_depreciable: newExpense.isDepreciable });
        } else { UIManager.showNotification("Please fill in description, date, and cost."); }
    }

    const editGeneralExpense = (id) => {
        const expenseItem = appData.generalExpenses.find(exp => exp.id === id);
        if (expenseItem) {
            UIManager.showEditExpenseModal(expenseItem);
        }
    };

    function handleSaveGeneralExpense(e) {
        e.preventDefault();
        const form = e.target;
        const id = form['edit-expense-id'].value;
        const expenseIndex = appData.generalExpenses.findIndex(exp => exp.id === id);
        if (expenseIndex !== -1) {
            const isDepreciable = form['edit-expense-is-depreciable'].checked;
            appData.generalExpenses[expenseIndex] = {
                id: id,
                description: form['edit-expense-description'].value.trim(),
                date: form['edit-expense-date'].value,
                cost: clampNum(form['edit-expense-cost'].value),
                category: form['edit-expense-category'].value,
                workPercentage: clampPct(form['edit-expense-work-percentage'].value) || 100,
                isDepreciable: isDepreciable,
                effectiveLife: isDepreciable ? clampNum(form['edit-expense-effective-life'].value) : 0,
                depreciationMethod: isDepreciable ? form['edit-depreciation-method'].value : 'prime_cost',
            };
            saveAndRefresh();
            UIManager.hideEditExpenseModal();
            UIManager.showNotification("Expense updated successfully.");
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
        const decimalHours = parseFloat(form['wfh-hours'].value) || 0;
        const newLog = {
            id: generateId('wfh'),
            date: form['wfh-date'].value,
            minutes: Math.round(decimalHours * 60),
        };
        if (newLog.date && newLog.minutes > 0) {
            const existing = appData.wfh.hoursLog.find(log => log.date === newLog.date);
            if (existing) {
                existing.minutes += newLog.minutes;
            } else {
                appData.wfh.hoursLog.push(newLog);
            }
            appData.wfh.totalMinutes = appData.wfh.hoursLog.reduce((sum, log) => sum + log.minutes, 0);
            saveAndRefresh();
            form.reset();
        } else { UIManager.showNotification("Please enter a valid date and hours."); }
    }

    function handleImportWfhHours(e) {
        StorageManager.importWfhHoursFromCSV(e.target.files[0], (importedLogs) => {
            const newLogsWithIds = importedLogs.map(log => ({
                ...log,
                id: generateId('wfh_csv')
            }));

            const existingDates = new Set(appData.wfh.hoursLog.map(log => log.date));
            const uniqueNewLogs = newLogsWithIds.filter(log => !existingDates.has(log.date));

            appData.wfh.hoursLog.push(...uniqueNewLogs);
            appData.wfh.totalMinutes = appData.wfh.hoursLog.reduce((sum, log) => sum + log.minutes, 0);
            saveAndRefresh();
            UIManager.showNotification(`${uniqueNewLogs.length} new daily hour entries imported successfully.`);
        });
        e.target.value = null; // Reset file input
    }

    const removeWfhHour = (id) => {
        UIManager.showConfirmation("Are you sure you want to remove this hour entry?", () => {
            appData.wfh.hoursLog = appData.wfh.hoursLog.filter(log => log.id !== id);
            appData.wfh.totalMinutes = appData.wfh.hoursLog.reduce((sum, log) => sum + log.minutes, 0);
            saveAndRefresh();
        });
    };

    const setWfhMethod = (method) => {
        appData.wfh.method = method;
        saveAndRefresh();
    };

    function handleSaveWfhProperty(e) {
        e.preventDefault();
        const propertyId = document.getElementById('wfh-property-id').value;
        const propertyData = {
            id: propertyId || generateId('wfh_prop'),
            description: document.getElementById('wfh-property-description').value.trim(),
            fromDate: document.getElementById('wfh-property-from-date').value,
            toDate: document.getElementById('wfh-property-to-date').value,
            officeArea: parseFloat(document.getElementById('wfh-property-office-area').value) || 0,
            totalHomeArea: parseFloat(document.getElementById('wfh-property-total-home-area').value) || 0,
            electricityCost: parseFloat(document.getElementById('wfh-property-electricity').value) || 0,
            gasCost: parseFloat(document.getElementById('wfh-property-gas').value) || 0,
            internetCost: parseFloat(document.getElementById('wfh-property-internet').value) || 0,
            internetWorkPercent: parseInt(document.getElementById('wfh-property-internet-work-pct').value) || 0,
            phoneCost: parseFloat(document.getElementById('wfh-property-phone').value) || 0,
            stationeryCost: parseFloat(document.getElementById('wfh-property-stationery').value) || 0,
        };
        const props = appData.wfh.actualCostDetails.properties;
        const idx = props.findIndex(p => p.id === propertyId);
        if (idx !== -1) {
            props[idx] = propertyData;
        } else {
            props.push(propertyData);
        }
        saveAndRefresh();
        UIManager.hideWfhPropertyModal();
    }

    function handleSaveWfhAsset(e) {
        e.preventDefault();
        const form = e.target;
        const assetId = form['wfh-asset-id'].value;
        const isDepreciable = form['wfh-asset-is-depreciable'].checked;

        const assetData = {
            id: assetId || generateId('wfh_asset'),
            description: form['wfh-asset-description'].value.trim(),
            date: form['wfh-asset-date'].value,
            cost: clampNum(form['wfh-asset-cost'].value),
            workPercentage: clampPct(form['wfh-asset-work-percentage'].value) || 100,
            isDepreciable: isDepreciable,
            effectiveLife: isDepreciable ? clampNum(form['wfh-asset-effective-life'].value) : 0,
            depreciationMethod: isDepreciable ? form['wfh-asset-depreciation-method'].value : 'prime_cost',
        };

        if (!assetData.description || !assetData.date || assetData.cost <= 0) {
            UIManager.showNotification("Please fill in description, date, and cost.");
            return;
        }
        if (isDepreciable && assetData.effectiveLife <= 0) {
            UIManager.showNotification("Please enter an effective life for depreciable assets.");
            return;
        }

        const assetIndex = appData.wfh.actualCostDetails.assets.findIndex(a => a.id === assetId);
        if (assetIndex !== -1) {
            appData.wfh.actualCostDetails.assets[assetIndex] = assetData;
        } else {
            appData.wfh.actualCostDetails.assets.push(assetData);
        }

        saveAndRefresh();
        UIManager.hideWfhAssetModal();
        form.reset();
    }

    const editWfhProperty = (id) => {
        const prop = appData.wfh.actualCostDetails.properties.find(p => p.id === id);
        if (prop) UIManager.showWfhPropertyModal(prop);
    };

    const removeWfhProperty = (id) => {
        UIManager.showConfirmation("Remove this property period?", () => {
            appData.wfh.actualCostDetails.properties =
                appData.wfh.actualCostDetails.properties.filter(p => p.id !== id);
            saveAndRefresh();
        });
    };

    const moveExpenseToWfh = (id) => {
        const idx = appData.generalExpenses.findIndex(e => e.id === id);
        if (idx === -1) return;
        const exp = appData.generalExpenses[idx];
        appData.wfh.actualCostDetails.assets.push({
            id: generateId('wfh_asset'),
            description: exp.description,
            date: exp.date,
            cost: exp.cost,
            workPercentage: exp.workPercentage,
            isDepreciable: exp.isDepreciable,
            effectiveLife: exp.effectiveLife || 0,
            depreciationMethod: exp.depreciationMethod || 'prime_cost',
        });
        appData.generalExpenses.splice(idx, 1);
        saveAndRefresh();
        UIManager.showNotification(`"${exp.description}" moved to WFH Assets.`);
    };

    const moveWfhAssetToGeneral = (id) => {
        const idx = appData.wfh.actualCostDetails.assets.findIndex(a => a.id === id);
        if (idx === -1) return;
        const asset = appData.wfh.actualCostDetails.assets[idx];
        appData.generalExpenses.push({
            id: generateId('expense'),
            description: asset.description,
            date: asset.date,
            cost: asset.cost,
            workPercentage: asset.workPercentage,
            isDepreciable: asset.isDepreciable,
            effectiveLife: asset.effectiveLife || 0,
            depreciationMethod: asset.depreciationMethod || 'prime_cost',
            category: '',
        });
        appData.wfh.actualCostDetails.assets.splice(idx, 1);
        saveAndRefresh();
        UIManager.showNotification(`"${asset.description}" moved to General Expenses.`);
    };

    const editWfhAsset = (id) => {
        const asset = appData.wfh.actualCostDetails.assets.find(a => a.id === id);
        if (asset) {
            UIManager.showWfhAssetModal(asset);
        }
    };

    const removeWfhAsset = (id) => {
        UIManager.showConfirmation("Are you sure you want to remove this WFH asset?", () => {
            appData.wfh.actualCostDetails.assets = appData.wfh.actualCostDetails.assets.filter(asset => asset.id !== id);
            saveAndRefresh();
        });
    }

    const generatePrintableSummary = () => {
        const summaryNode = document.getElementById('summary-section').cloneNode(true);
        const buttonToRemove = summaryNode.querySelector('#generate-summary-report-btn');
        if (buttonToRemove) buttonToRemove.remove();
        const summaryHTML = summaryNode.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Tax Summary ${window.FINANCIAL_YEAR}</title><script src="https://cdn.tailwindcss.com"><\/script><style>body{padding:2rem;font-family:sans-serif;}.summary-item.final-outcome{border-width:2px!important;}</style></head><body>${summaryHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    return {
        init,
        removePaygIncome, editPaygIncome,
        removeGeneralExpense, editGeneralExpense,
        removeWfhHour, removeWfhAsset, editWfhAsset,
        editWfhProperty, removeWfhProperty,
        moveExpenseToWfh, moveWfhAssetToGeneral
    };
})();

window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
