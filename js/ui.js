// js/ui.js
const UIManager = (() => {
    // --- Modal Logic ---
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    let confirmCallback = null;
    const wfhAssetModal = document.getElementById('wfh-asset-modal');
    const editPaygModal = document.getElementById('edit-payg-modal');
    const editExpenseModal = document.getElementById('edit-expense-modal');
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
            confirmCallback = null;
        }
        hideModal();
    });
    cancelBtn.addEventListener('click', hideModal);
    const showNotification = (message, onConfirm = null) => showModal('Notification', message, false, onConfirm);
    const showConfirmation = (message, onConfirm) => showModal('Confirmation', message, true, onConfirm);
    
    const showWfhAssetModal = (asset = null) => {
        const form = document.getElementById('wfh-asset-form');
        const modalTitle = document.getElementById('wfh-asset-modal-title');
        form.reset();
        document.getElementById('wfh-asset-depreciation-fields').classList.add('hidden');
        
        if (asset) {
            modalTitle.textContent = 'Edit WFH Asset';
            form['wfh-asset-id'].value = asset.id;
            form['wfh-asset-description'].value = asset.description;
            form['wfh-asset-date'].value = asset.date;
            form['wfh-asset-cost'].value = asset.cost;
            form['wfh-asset-work-percentage'].value = asset.workPercentage || 100;
            form['wfh-asset-is-depreciable'].checked = asset.isDepreciable;
            
            if (asset.isDepreciable) {
                document.getElementById('wfh-asset-depreciation-fields').classList.remove('hidden');
                form['wfh-asset-effective-life'].value = asset.effectiveLife;
                form['wfh-asset-depreciation-method'].value = asset.depreciationMethod;
            }
        } else {
            modalTitle.textContent = 'Add WFH Asset';
            form['wfh-asset-id'].value = '';
        }

        wfhAssetModal.classList.add('visible');
    };
    const hideWfhAssetModal = () => wfhAssetModal.classList.remove('visible');
    
    const showEditPaygModal = (incomeItem) => {
        const form = document.getElementById('edit-payg-form');
        form['edit-payg-id'].value = incomeItem.id;
        form['edit-income-source-name'].value = incomeItem.sourceName;
        form['edit-gross-salary'].value = incomeItem.grossSalary;
        form['edit-tax-withheld'].value = incomeItem.taxWithheld;
        editPaygModal.classList.add('visible');
    };
    const hideEditPaygModal = () => editPaygModal.classList.remove('visible');

    const showEditExpenseModal = (expenseItem) => {
        const form = document.getElementById('edit-expense-form');
        form['edit-expense-id'].value = expenseItem.id;
        form['edit-expense-description'].value = expenseItem.description;
        form['edit-expense-date'].value = expenseItem.date;
        form['edit-expense-cost'].value = expenseItem.cost;
        form['edit-expense-category'].value = expenseItem.category;
        form['edit-expense-work-percentage'].value = expenseItem.workPercentage;
        form['edit-expense-is-depreciable'].checked = expenseItem.isDepreciable;
        document.getElementById('edit-depreciation-fields').classList.toggle('hidden', !expenseItem.isDepreciable);
        if (expenseItem.isDepreciable) {
            form['edit-expense-effective-life'].value = expenseItem.effectiveLife;
            form['edit-depreciation-method'].value = expenseItem.depreciationMethod;
        }
        editExpenseModal.classList.add('visible');
    };
    const hideEditExpenseModal = () => editExpenseModal.classList.remove('visible');

    const flashHighlight = (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('flash-highlight');
            setTimeout(() => {
                element.classList.remove('flash-highlight');
            }, 1200);
        }
    };

    const formatCurrency = (amount) => (amount || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

    const showSection = (sectionId) => {
        document.querySelectorAll('.app-section').forEach(section => section.classList.remove('active-section'));
        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) sectionToShow.classList.add('active-section');
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.toggle('active', button.dataset.section === sectionId);
        });
    };

    const toggleFamilyFields = (isFamily) => {
        document.getElementById('family-fields').classList.toggle('hidden', !isFamily);
    };

    const toggleMedicareDaysField = (isExempt) => {
        document.getElementById('medicare-exempt-days-container').classList.toggle('hidden', !isExempt);
    };

    const populateTaxpayerDetailsForm = (details) => {
        const form = document.getElementById('taxpayer-details-form');
        form['medicare-exempt'].checked = details.isMedicareExempt;
        form['medicare-exempt-days'].value = details.medicareExemptDays || 0;
        form['private-cover'].checked = details.hasPrivateHospitalCover;
        form['rfb-amount'].value = details.reportableFringeBenefits || '';
        form['personal-super-contribution'].value = details.personalSuperContribution || '';
        form['filing-status'].value = details.filingStatus || 'single';
        form['spouse-income'].value = details.spouseIncome || '';
        form['dependent-children'].value = details.dependentChildren || '';
        form['phi-age-bracket'].value = details.phiAgeBracket || 'under65';
        form['phi-premiums-paid-period1'].value = details.phiPremiumsPaid_period1 || '';
        form['phi-premiums-paid-period2'].value = details.phiPremiumsPaid_period2 || '';
        form['phi-rebate-received'].value = details.phiRebateReceived || '';
        toggleFamilyFields(details.filingStatus === 'family');
        toggleMedicareDaysField(details.isMedicareExempt);
    };

    const populateOtherIncomeForm = (otherIncome) => {
        const form = document.getElementById('other-income-form');
        form['bank-interest'].value = otherIncome.bankInterest || '';
        form['net-capital-gains'].value = otherIncome.netCapitalGains || '';
        form['dividends-unfranked'].value = otherIncome.dividendsUnfranked || '';
        form['dividends-franked'].value = otherIncome.dividendsFranked || '';
        form['franking-credits'].value = otherIncome.frankingCredits || '';
    };

    const updateFloorAreaPercentageDisplay = () => {
        const officeArea = document.getElementById('wfh-office-area').value;
        const totalHomeArea = document.getElementById('wfh-total-home-area').value;
        const percentageEl = document.getElementById('wfh-floor-area-percentage');
        
        const numOfficeArea = parseFloat(officeArea) || 0;
        const numTotalHomeArea = parseFloat(totalHomeArea) || 0;

        if (numOfficeArea > 0 && numTotalHomeArea > 0) {
            const percentage = (numOfficeArea / numTotalHomeArea) * 100;
            percentageEl.textContent = percentage.toFixed(2) + '%';
        } else {
            percentageEl.textContent = '0.00%';
        }
    };
    
    const updateRunningExpensesSubtotal = (details) => {
        const subtotal = TaxCalculations.calculateWfhRunningExpensesDeduction(details);
        document.getElementById('wfh-running-expenses-subtotal').textContent = formatCurrency(subtotal);
    };

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
        updateFloorAreaPercentageDisplay();
        updateRunningExpensesSubtotal(details);
    };

    const displayIncomeList = (paygItems, otherIncome) => {
        const listEl = document.getElementById('income-list');
        listEl.innerHTML = '';
        let hasIncome = false;
        paygItems.forEach(item => {
            hasIncome = true;
            const row = listEl.insertRow();
            row.innerHTML = `<td class="p-2 border-b border-gray-200">${item.sourceName}</td><td class="p-2 border-b border-gray-200">${formatCurrency(item.grossSalary)}</td><td class="p-2 border-b border-gray-200">${formatCurrency(item.taxWithheld)}</td><td class="p-2 border-b border-gray-200"><button class="text-blue-500 hover:text-blue-700 text-xs font-semibold mr-2" onclick="App.editPaygIncome('${item.id}')">Edit</button><button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removePaygIncome('${item.id}')">Remove</button></td>`;
        });
        const otherIncomeTotal = (otherIncome.bankInterest || 0) + (otherIncome.dividendsUnfranked || 0) + (otherIncome.dividendsFranked || 0) + (otherIncome.netCapitalGains || 0);
        if(otherIncomeTotal > 0 || (otherIncome.frankingCredits || 0) > 0){
            hasIncome = true;
            const row = listEl.insertRow();
            row.className = 'bg-gray-50';
            row.innerHTML = `<td class="p-2 border-b border-gray-200 italic">Other Income (Interest, Dividends, etc.)</td><td class="p-2 border-b border-gray-200 italic">${formatCurrency(otherIncomeTotal)}</td><td class="p-2 border-b border-gray-200 italic">${formatCurrency(otherIncome.frankingCredits)} (Credits)</td><td class="p-2 border-b border-gray-200"></td>`;
        }
        if (!hasIncome) listEl.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">No income added yet.</td></tr>';
    };

    const displayGeneralExpensesList = (expenses) => {
        const listEl = document.getElementById('general-expenses-list');
        listEl.innerHTML = '';
        if (expenses.length === 0) {
            listEl.innerHTML = '<tr><td colspan="8" class="text-center text-gray-500 py-4">No general expenses added yet.</td></tr>';
            return;
        }
        [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(exp => {
            const deduction = exp.isDepreciable
                ? TaxCalculations.calculateDepreciationForFinancialYear(exp.cost, exp.workPercentage, exp.effectiveLife, exp.date, exp.depreciationMethod)
                : (exp.cost * (exp.workPercentage / 100));
            
            let claimScheduleHtml = 'Immediate';
            if (exp.isDepreciable && exp.effectiveLife > 0) {
                let schedule = [];
                let openingValue = parseFloat(exp.cost);
                const workPercentFactor = parseFloat(exp.workPercentage) / 100;
                const effectiveLife = parseInt(exp.effectiveLife);

                for (let i = 0; i < effectiveLife; i++) {
                    const tempDate = new Date(exp.date);
                    const yearStartDate = new Date(tempDate.getFullYear() + i, 6, 1);
                    const tempPurchaseDateInLoop = i === 0 ? tempDate : yearStartDate;
                    
                    let annualDepreciation;
                    if (exp.depreciationMethod === 'diminishing_value') {
                        if (effectiveLife <= 1) {
                            annualDepreciation = openingValue;
                        } else {
                            annualDepreciation = openingValue * (2 / effectiveLife);
                        }
                    } else { 
                        annualDepreciation = exp.cost / effectiveLife;
                    }

                    const workRelatedPortion = annualDepreciation * workPercentFactor;
                    
                    const financialYearEnd = new Date(tempPurchaseDateInLoop.getFullYear() + (tempPurchaseDateInLoop.getMonth() >= 6 ? 1 : 0), 5, 30);
                    const daysOwned = Math.floor((financialYearEnd - tempPurchaseDateInLoop) / (1000 * 60 * 60 * 24)) + 1;
                    const proRataFactor = (i === 0 && daysOwned < 365) ? (daysOwned / 365) : 1;
                    const finalYearlyDeduction = workRelatedPortion * proRataFactor;

                    if (openingValue > 1) {
                         schedule.push(`Y${i+1}: ${formatCurrency(finalYearlyDeduction)}`);
                    } else {
                         schedule.push(`Y${i+1}: ${formatCurrency(0)}`);
                    }
                    
                    // The opening value for the next year is reduced by the cost portion of the deduction
                    const costReduction = finalYearlyDeduction / workPercentFactor;
                    openingValue -= costReduction;
                }
                claimScheduleHtml = schedule.join('<br>');
            }

            const methodDisplay = exp.isDepreciable ? (exp.depreciationMethod === 'prime_cost' ? 'Prime Cost' : 'Diminishing') : 'N/A';

            const row = listEl.insertRow();
            row.innerHTML = `
                <td class="p-2 border-b border-gray-200 text-sm">${exp.description}</td>
                <td class="p-2 border-b border-gray-200 text-sm">${exp.date}</td>
                <td class="p-2 border-b border-gray-200 text-sm">${formatCurrency(exp.cost)}</td>
                <td class="p-2 border-b border-gray-200 text-sm">${exp.workPercentage}%</td>
                <td class="p-2 border-b border-gray-200 text-sm">${methodDisplay}</td>
                <td class="p-2 border-b border-gray-200 text-sm font-semibold">${formatCurrency(deduction)}</td>
                <td class="p-2 border-b border-gray-200 text-xs">${claimScheduleHtml}</td>
                <td class="p-2 border-b border-gray-200 text-sm"><button class="text-blue-500 hover:text-blue-700 text-xs font-semibold mr-2" onclick="App.editGeneralExpense('${exp.id}')">Edit</button><button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removeGeneralExpense('${exp.id}')">Remove</button></td>
            `;
        });
    };

    const displayWfhHoursList = (wfhData) => {
        const totalMinutes = wfhData.totalMinutes || 0;
        const timeString = minutesToTimeString(totalMinutes);
        const decimalHours = (totalMinutes / 60).toFixed(2);
        
        const combinedDisplay = `${timeString} hours Decimal ${decimalHours} hours`;
        document.getElementById('wfh-total-hours').textContent = combinedDisplay;
        
        const listEl = document.getElementById('wfh-hours-list');
        listEl.innerHTML = '';
        const hoursLog = wfhData.hoursLog;
        if (hoursLog.length === 0) {
            listEl.innerHTML = '<li class="text-gray-400">No hours logged yet.</li>';
            return;
        }
        [...hoursLog].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center py-1";
            const logTimeString = minutesToTimeString(log.minutes);
            li.innerHTML = `<span>${log.date}: <strong>${logTimeString}</strong> hours</span><button class="text-red-500 hover:text-red-700 text-xs font-semibold" onclick="App.removeWfhHour('${log.id}')">Remove</button>`;
            listEl.appendChild(li);
        });
    };
    
    const displayWfhAssetsList = (assets) => {
        const listEl = document.getElementById('wfh-assets-list-body');
        listEl.innerHTML = '';
        if (!assets || assets.length === 0) {
            listEl.innerHTML = '<tr><td colspan="9" class="text-center text-gray-400 py-2">No assets added yet.</td></tr>';
            return;
        }

        [...assets].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((asset, index) => {
            const row = listEl.insertRow();
            
            const createCell = (content, classes = []) => {
                const cell = document.createElement('td');
                cell.className = 'p-2 border-b border-gray-200 text-sm';
                classes.forEach(c => cell.classList.add(c));
                cell.innerHTML = content;
                return cell;
            };

            const workPercentage = asset.workPercentage || 100;
            const deduction = TaxCalculations.calculateDepreciationForFinancialYear(asset.cost, workPercentage, asset.effectiveLife, asset.date, asset.depreciationMethod);
            
            let claimScheduleHtml = 'Immediate';
            if (asset.isDepreciable && asset.effectiveLife > 0) {
                let schedule = [];
                let openingValue = parseFloat(asset.cost);
                const workPercentFactor = parseFloat(workPercentage) / 100;
                const effectiveLife = parseInt(asset.effectiveLife);

                for (let i = 0; i < effectiveLife; i++) {
                    const tempDate = new Date(asset.date);
                    const yearStartDate = new Date(tempDate.getFullYear() + i, 6, 1);
                    const tempPurchaseDateInLoop = i === 0 ? tempDate : yearStartDate;

                    let annualDepreciation;
                    if (asset.depreciationMethod === 'diminishing_value') {
                        if (effectiveLife <= 1) {
                            annualDepreciation = openingValue;
                        } else {
                            annualDepreciation = openingValue * (2 / effectiveLife);
                        }
                    } else { 
                        annualDepreciation = asset.cost / effectiveLife;
                    }
                    
                    const workRelatedPortion = annualDepreciation * workPercentFactor;

                    const financialYearEnd = new Date(tempPurchaseDateInLoop.getFullYear() + (tempPurchaseDateInLoop.getMonth() >= 6 ? 1 : 0), 5, 30);
                    const daysOwned = Math.floor((financialYearEnd - tempPurchaseDateInLoop) / (1000 * 60 * 60 * 24)) + 1;
                    const proRataFactor = (i === 0 && daysOwned < 365) ? (daysOwned / 365) : 1;
                    const finalYearlyDeduction = workRelatedPortion * proRataFactor;

                    if (openingValue > 1) {
                         schedule.push(`Y${i+1}: ${formatCurrency(finalYearlyDeduction)}`);
                    } else {
                         schedule.push(`Y${i+1}: ${formatCurrency(0)}`);
                    }
                    
                    const costReduction = finalYearlyDeduction / workPercentFactor;
                    openingValue -= costReduction;
                }
                claimScheduleHtml = schedule.join('<br>');
            }
            
            let methodDisplay = 'Immediate';
            if (asset.isDepreciable) {
                methodDisplay = asset.depreciationMethod === 'prime_cost' ? 'Prime Cost' : 'Diminishing';
            }

            row.appendChild(createCell(index + 1, ['font-semibold']));
            row.appendChild(createCell(asset.description));
            row.appendChild(createCell(asset.date));
            row.appendChild(createCell(formatCurrency(asset.cost)));
            row.appendChild(createCell(`${workPercentage}%`));
            row.appendChild(createCell(methodDisplay));
            row.appendChild(createCell(formatCurrency(deduction), ['font-semibold']));
            row.appendChild(createCell(claimScheduleHtml, ['text-xs']));
            
            const actionsCell = document.createElement('td');
            actionsCell.className = 'p-2 border-b border-gray-200 text-sm';

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'text-blue-500 hover:text-blue-700 text-xs font-semibold mr-2';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => App.editWfhAsset(asset.id));
            
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'text-red-500 hover:text-red-700 text-xs font-semibold';
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => App.removeWfhAsset(asset.id));

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(removeButton);
            row.appendChild(actionsCell);
        });
    };

    const updateWfhMethodDisplay = (method) => {
        document.getElementById('wfh-current-method-display').textContent = method === 'fixed_rate' ? 'ATO Fixed Rate' : 'Actual Cost';
        document.getElementById('wfh-fixed-rate-details').classList.toggle('hidden', method !== 'fixed_rate');
        document.getElementById('wfh-actual-cost-details').classList.toggle('hidden', method !== 'actual_cost');
        const fixedRateBtn = document.getElementById('wfh-use-fixed-rate-btn');
        const actualCostBtn = document.getElementById('wfh-use-actual-cost-btn');
        fixedRateBtn.classList.toggle('bg-indigo-700', method === 'fixed_rate');
        fixedRateBtn.classList.toggle('bg-indigo-500', method !== 'fixed_rate');
        actualCostBtn.classList.toggle('bg-purple-700', method === 'actual_cost');
        actualCostBtn.classList.toggle('bg-purple-500', method !== 'actual_cost');
    };

    const updateAllSummaries = (appData) => {

        document.getElementById('wfh-fixed-rate-value').textContent = formatCurrency(window.WFH_FIXED_RATE_PER_HOUR);
        
        const totalAssessableIncome = TaxCalculations.calculateTotalAssessableIncome(appData.income);
        const totalTaxWithheld = appData.income.payg.reduce((sum, item) => sum + item.taxWithheld, 0);
        
        const totalGeneralDeductions = TaxCalculations.calculateTotalGeneralDeductions(appData.generalExpenses);
        const totalWfhDeductions = TaxCalculations.calculateTotalWfhDeductions(appData.wfh);
        const totalSuperDeductions = parseFloat(appData.taxpayerDetails.personalSuperContribution) || 0;
        
        const overallTotalDeductions = totalGeneralDeductions + totalWfhDeductions + totalSuperDeductions;
        const taxableIncome = TaxCalculations.calculateTaxableIncome(appData);
        
        const grossTax = TaxCalculations.calculateGrossTax(taxableIncome);
        const medicareLevy = TaxCalculations.calculateMedicareLevy(taxableIncome, appData.taxpayerDetails);
        const mls = TaxCalculations.calculateMLS(taxableIncome, appData.taxpayerDetails);
        
        const offsets = TaxCalculations.calculateTotalOffsets(taxableIncome, appData);
        
        const netTaxPayable = TaxCalculations.calculateNetTaxPayable(grossTax, medicareLevy, mls, offsets.total);
        const finalOutcome = TaxCalculations.calculateFinalOutcome(totalTaxWithheld, netTaxPayable);
        
        const outcomeText = finalOutcome >= 0 ? `${formatCurrency(finalOutcome)} Refund` : `${formatCurrency(Math.abs(finalOutcome))} Payable`;
        
        // --- Update UI Elements ---
        document.getElementById('dashboard-taxable-income').textContent = formatCurrency(taxableIncome);
        document.getElementById('dashboard-total-deductions').textContent = formatCurrency(overallTotalDeductions);
        document.getElementById('dashboard-tax-outcome').textContent = outcomeText;
        document.getElementById('total-assessable-income').textContent = formatCurrency(totalAssessableIncome);
        document.getElementById('total-tax-withheld-summary').textContent = formatCurrency(totalTaxWithheld);
        document.getElementById('total-general-deductions').textContent = formatCurrency(totalGeneralDeductions);
        document.getElementById('total-wfh-deduction').textContent = formatCurrency(totalWfhDeductions);
        
        // Update WFH Method-Specific Details
        const fixedRateDeductionValue = (appData.wfh.method === 'fixed_rate') ? totalWfhDeductions : 0;
        document.getElementById('wfh-fixed-rate-deduction').textContent = formatCurrency(fixedRateDeductionValue);
        document.getElementById('wfh-running-expenses-subtotal').textContent = formatCurrency(TaxCalculations.calculateWfhRunningExpensesDeduction(appData.wfh.actualCostDetails));
        document.getElementById('wfh-assets-subtotal').textContent = formatCurrency(TaxCalculations.calculateWfhAssetsDeduction(appData.wfh.actualCostDetails.assets));
        document.getElementById('wfh-actual-cost-deduction').textContent = formatCurrency(TaxCalculations.calculateWfhActualCostDeduction(appData.wfh.actualCostDetails));

        // --- Summary Page ---
        document.getElementById('summary-assessable-income').textContent = formatCurrency(totalAssessableIncome);
        document.getElementById('summary-total-deductions').textContent = formatCurrency(overallTotalDeductions);
        document.getElementById('summary-general-deductions').textContent = formatCurrency(totalGeneralDeductions);
        document.getElementById('summary-wfh-deductions').textContent = formatCurrency(totalWfhDeductions);
        document.getElementById('summary-super-deductions').textContent = formatCurrency(totalSuperDeductions);
        document.getElementById('summary-taxable-income').textContent = formatCurrency(taxableIncome);
        document.getElementById('summary-gross-tax').textContent = formatCurrency(grossTax);
        document.getElementById('summary-medicare-levy').textContent = formatCurrency(medicareLevy);
        document.getElementById('summary-mls').textContent = formatCurrency(mls);
        document.getElementById('summary-tax-offsets').textContent = formatCurrency(offsets.total);
        document.getElementById('summary-lito-offset').textContent = formatCurrency(offsets.lito);
        document.getElementById('summary-lito-offset-row').style.display = offsets.lito > 0 ? 'flex' : 'none';
        document.getElementById('summary-franking-credits-offset').textContent = formatCurrency(offsets.frankingCredits);
        document.getElementById('summary-phi-offset').textContent = formatCurrency(offsets.phiOffset);
        document.getElementById('summary-net-tax').textContent = formatCurrency(netTaxPayable < 0 ? 0 : netTaxPayable);
        document.getElementById('summary-tax-withheld').textContent = formatCurrency(totalTaxWithheld);
        document.getElementById('summary-final-outcome').textContent = outcomeText;
    };

    return {
        showNotification, showConfirmation, showSection, populateOtherIncomeForm,
        displayIncomeList, displayGeneralExpensesList, displayWfhHoursList, 
        updateWfhMethodDisplay, updateAllSummaries, populateWfhActualCostForm,
        showWfhAssetModal, hideWfhAssetModal, displayWfhAssetsList,
        showEditPaygModal, hideEditPaygModal,
        showEditExpenseModal, hideEditExpenseModal,
        updateFloorAreaPercentageDisplay,
        updateRunningExpensesSubtotal,
        flashHighlight,
        toggleFamilyFields,
        toggleMedicareDaysField,
        populateTaxpayerDetailsForm,
        formatCurrency
    };
})();
