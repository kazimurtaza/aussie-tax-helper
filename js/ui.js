// js/ui.js

const UIManager = (() => {
    // --- Modal Logic ---
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    let confirmCallback = null;

    // --- NEW: WFH Asset Modal ---
    const wfhAssetModal = document.getElementById('wfh-asset-modal');

    const showModal = (title, message, showCancel = false, onConfirm = null) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        confirmCallback = onConfirm;
        cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
        modal.classList.add('visible');
    };

    const hideModal = () => modal.classList.remove('visible');
    
    confirmBtn.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null; // Prevent multiple executions
        }
        hideModal();
    });
    cancelBtn.addEventListener('click', hideModal);

    const showNotification = (message, onConfirm = null) => {
        showModal('Notification', message, false, onConfirm);
    };
    const showConfirmation = (message, onConfirm) => {
        showModal('Confirmation', message, true, onConfirm);
    };

    // --- NEW WFH Asset Modal functions ---
    const showWfhAssetModal = () => wfhAssetModal.classList.add('visible');
    const hideWfhAssetModal = () => wfhAssetModal.classList.remove('visible');


    // --- UI Update Logic ---
    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
    };
    
    /**
     * Shows the specified section and hides all others. Updates nav button states.
     * This is the core function for tab navigation.
     * @param {string} sectionId - The ID of the section to make active.
     */
    const showSection = (sectionId) => {
        // Hide all sections first
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.remove('active-section');
        });

        // Show the target section
        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) {
            sectionToShow.classList.add('active-section');
        }

        // Update the active state of navigation buttons
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.toggle('active', button.dataset.section === sectionId);
        });
    };

    const populateOtherIncomeForm = (otherIncome) => {
        const otherIncomeForm = document.getElementById('other-income-form');
        otherIncomeForm['bank-interest'].value = otherIncome.bankInterest || '';
        otherIncomeForm['dividends-unfranked'].value = otherIncome.dividendsUnfranked || '';
        otherIncomeForm['dividends-franked'].value = otherIncome.dividendsFranked || '';
        otherIncomeForm['franking-credits'].value = otherIncome.frankingCredits || '';
    };

    // NEW: Populates the WFH Actual Cost form from saved data
    const populateWfhActualCostForm = (details) => {
        const form = document.getElementById('wfh-actual-cost-form');
        form['wfh-office-area'].value = details.officeArea || '';
        form['wfh-total-home-area'].value = details.totalHomeArea || '';
        form['wfh-electricity-cost'].value = details.electricityCost || '';
        form['wfh-gas-cost'].value = details.gasCost || '';
        form['wfh-internet-cost'].value = details.internetCost || '';
        form['wfh-internet-work-percent'].value = details.internetWorkPercent || '';
        form['wfh-phone-cost'].value = details.phoneCost || '';
        form['wfh-stationery-cost'].value = details.stationeryCost || '';
    };

    const displayIncomeList = (paygItems, otherIncome) => {
        const listEl = document.getElementById('income-list');
        listEl.innerHTML = '';
        let hasIncome = false;

        paygItems.forEach(item => {
            hasIncome = true;
            const row = listEl.insertRow();
            row.innerHTML = `
                <td class="p-2 border-b border-gray-200">${item.sourceName}</td>
                <td class="p-2 border-b border-gray-200">${formatCurrency(item.grossSalary)}</td>
                <td class="p-2 border-b border-gray-200">${formatCurrency(item.taxWithheld)}</td>
                <td class="p-2 border-b border-gray-200"><button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removePaygIncome('${item.id}')">Remove</button></td>
            `;
        });

        const otherIncomeTotal = (otherIncome.bankInterest || 0) + (otherIncome.dividendsUnfranked || 0) + (otherIncome.dividendsFranked || 0);
        if(otherIncomeTotal > 0){
            hasIncome = true;
            const row = listEl.insertRow();
            row.className = 'bg-gray-50';
            row.innerHTML = `
                <td class="p-2 border-b border-gray-200 italic">Other Income (Interest, Dividends)</td>
                <td class="p-2 border-b border-gray-200 italic">${formatCurrency(otherIncomeTotal)}</td>
                <td class="p-2 border-b border-gray-200 italic">${formatCurrency(otherIncome.frankingCredits)} (Credits)</td>
                <td class="p-2 border-b border-gray-200"></td>
            `;
        }

        if (!hasIncome) {
            listEl.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">No income added yet.</td></tr>';
        }
    };

    const displayGeneralExpensesList = (expenses) => {
        const listEl = document.getElementById('general-expenses-list');
        listEl.innerHTML = '';
        if (expenses.length === 0) {
            listEl.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-4">No expenses added yet.</td></tr>';
            return;
        }
        expenses.forEach(exp => {
            const deduction = exp.isDepreciable
                ? TaxCalculations.calculateDepreciation(exp.cost, exp.effectiveLife, exp.workPercentage, exp.date)
                : (exp.cost * (exp.workPercentage / 100));
            
            const row = listEl.insertRow();
            row.innerHTML = `
                <td class="p-2 border-b border-gray-200">${exp.description}</td>
                <td class="p-2 border-b border-gray-200">${exp.date}</td>
                <td class="p-2 border-b border-gray-200">${formatCurrency(exp.cost)}</td>
                <td class="p-2 border-b border-gray-200">${exp.workPercentage}%</td>
                <td class="p-2 border-b border-gray-200 font-semibold">${formatCurrency(deduction)}</td>
                <td class="p-2 border-b border-gray-200"><button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removeGeneralExpense('${exp.id}')">Remove</button></td>
            `;
        });
    };

    const displayWfhHoursList = (hoursLog) => {
        const listEl = document.getElementById('wfh-hours-list');
        listEl.innerHTML = '';
        if (hoursLog.length === 0) {
            listEl.innerHTML = '<li class="text-gray-400">No hours logged yet.</li>';
            return;
        }
        // Display in reverse chronological order
        [...hoursLog].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center py-1";
            li.innerHTML = `
                <span>${log.date}: <strong>${log.hours.toFixed(2)}</strong> hours</span>
                <button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removeWfhHour('${log.id}')">Remove</button>
            `;
            listEl.appendChild(li);
        });
    };
    
    // NEW: Renders the list of WFH assets
    const displayWfhAssetsList = (assets) => {
        const container = document.getElementById('wfh-assets-list');
        container.innerHTML = '';
        if (!assets || assets.length === 0) {
            container.innerHTML = '<p class="text-gray-400">No assets added yet.</p>';
            return;
        }
        
        assets.forEach(asset => {
            const assetDiv = document.createElement('div');
            assetDiv.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
            assetDiv.innerHTML = `
                <span>${asset.description} (${formatCurrency(asset.cost)})</span>
                <button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removeWfhAsset('${asset.id}')">Remove</button>
            `;
            container.appendChild(assetDiv);
        });
    };

    const updateWfhMethodDisplay = (method) => {
        document.getElementById('wfh-current-method-display').textContent = method === 'fixed_rate' ? 'ATO Fixed Rate' : 'Actual Cost';
        document.getElementById('wfh-fixed-rate-details').classList.toggle('hidden', method !== 'fixed_rate');
        document.getElementById('wfh-actual-cost-details').classList.toggle('hidden', method !== 'actual_cost');
        
        // Update button styles to show active selection
        const fixedRateBtn = document.getElementById('wfh-use-fixed-rate-btn');
        const actualCostBtn = document.getElementById('wfh-use-actual-cost-btn');
        fixedRateBtn.classList.toggle('bg-indigo-700', method === 'fixed_rate');
        fixedRateBtn.classList.toggle('bg-indigo-500', method !== 'fixed_rate');
        actualCostBtn.classList.toggle('bg-purple-700', method === 'actual_cost');
        actualCostBtn.classList.toggle('bg-purple-500', method !== 'actual_cost');
    };

    const updateAllSummaries = (appData) => {
        const totalAssessableIncome = TaxCalculations.calculateTotalAssessableIncome(appData.income);
        const totalTaxWithheld = appData.income.payg.reduce((sum, item) => sum + item.taxWithheld, 0);
        const totalGeneralDeductions = TaxCalculations.calculateTotalGeneralDeductions(appData.generalExpenses);
        const totalWfhDeductions = TaxCalculations.calculateTotalWfhDeductions(appData.wfh);
        const overallTotalDeductions = totalGeneralDeductions + totalWfhDeductions;
        const taxableIncome = TaxCalculations.calculateTaxableIncome(appData);
        const grossTax = TaxCalculations.calculateGrossTax(taxableIncome);
        const lito = TaxCalculations.calculateLITO(taxableIncome);
        const medicareLevy = TaxCalculations.calculateMedicareLevy(taxableIncome);
        const totalOffsets = TaxCalculations.calculateTotalOffsets(appData.income.other, lito);
        const netTaxPayable = TaxCalculations.calculateNetTaxPayable(grossTax, medicareLevy, totalOffsets);
        const finalOutcome = TaxCalculations.calculateFinalOutcome(totalTaxWithheld, netTaxPayable);
        
        const outcomeText = finalOutcome >= 0 ? `${formatCurrency(finalOutcome)} Refund` : `${formatCurrency(Math.abs(finalOutcome))} Payable`;
        
        // Dashboard
        document.getElementById('dashboard-taxable-income').textContent = formatCurrency(taxableIncome);
        document.getElementById('dashboard-total-deductions').textContent = formatCurrency(overallTotalDeductions);
        document.getElementById('dashboard-tax-outcome').textContent = outcomeText;

        // Income section
        document.getElementById('total-assessable-income').textContent = formatCurrency(totalAssessableIncome);
        document.getElementById('total-tax-withheld-summary').textContent = formatCurrency(totalTaxWithheld);

        // Expense section
        document.getElementById('total-general-deductions').textContent = formatCurrency(totalGeneralDeductions);

        // WFH section
        document.getElementById('wfh-total-hours').textContent = `${(appData.wfh.totalHours || 0).toFixed(2)}`;
        document.getElementById('wfh-fixed-rate-deduction').textContent = formatCurrency((appData.wfh.totalHours || 0) * WFH_FIXED_RATE_PER_HOUR);
        document.getElementById('wfh-actual-cost-deduction').textContent = formatCurrency(TaxCalculations.calculateWfhActualCostDeduction(appData.wfh.actualCostDetails));
        document.getElementById('wfh-floor-area-percentage').textContent = TaxCalculations.calculateFloorAreaPercentage(appData.wfh.actualCostDetails);
        document.getElementById('total-wfh-deduction').textContent = formatCurrency(totalWfhDeductions);
        
        // Summary page
        document.getElementById('summary-assessable-income').textContent = formatCurrency(totalAssessableIncome);
        document.getElementById('summary-total-deductions').textContent = formatCurrency(overallTotalDeductions);
        document.getElementById('summary-general-deductions').textContent = formatCurrency(totalGeneralDeductions);
        document.getElementById('summary-wfh-deductions').textContent = formatCurrency(totalWfhDeductions);
        document.getElementById('summary-taxable-income').textContent = formatCurrency(taxableIncome);
        document.getElementById('summary-gross-tax').textContent = formatCurrency(grossTax);
        document.getElementById('summary-medicare-levy').textContent = formatCurrency(medicareLevy);
        document.getElementById('summary-tax-offsets').textContent = formatCurrency(totalOffsets);
        document.getElementById('summary-net-tax').textContent = formatCurrency(netTaxPayable);
        document.getElementById('summary-tax-withheld').textContent = formatCurrency(totalTaxWithheld);
        document.getElementById('summary-final-outcome').textContent = outcomeText;
    };

    return {
        showNotification, showConfirmation, showSection, populateOtherIncomeForm,
        displayIncomeList, displayGeneralExpensesList, displayWfhHoursList, 
        updateWfhMethodDisplay, updateAllSummaries, populateWfhActualCostForm,
        showWfhAssetModal, hideWfhAssetModal, displayWfhAssetsList
    };
})();
