/* =====================================================
   FIN PULSE – Loan Management Module
   Auto-calculates EMI, creates loans, lists user loans, and supports loan deletion
   ===================================================== */

const LoanModule = {
    init() {
        const loanForm = document.getElementById('loan-form');
        if (loanForm) {
            loanForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const amountInput = document.getElementById('loan-amount');
        const rateInput = document.getElementById('loan-rate');
        const tenureInput = document.getElementById('loan-tenure');

        [amountInput, rateInput, tenureInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.autoCalculate());
            }
        });
    },

    autoCalculate() {
        const amount = parseFloat(document.getElementById('loan-amount').value) || 0;
        const rate = parseFloat(document.getElementById('loan-rate').value) || 0;
        const tenure = parseFloat(document.getElementById('loan-tenure').value) || 0;

        const resultsDiv = document.getElementById('loan-results');

        if (amount > 0 && rate > 0 && tenure > 0) {
            const { emi, totalInterest, totalRepayment } = Utils.calculateEmi(amount, rate, tenure);

            document.getElementById('res-amount').textContent = Utils.formatCurrency(amount);
            document.getElementById('res-emi').textContent = Utils.formatCurrency(emi);
            document.getElementById('res-interest').textContent = Utils.formatCurrency(totalInterest);
            document.getElementById('res-total').textContent = Utils.formatCurrency(totalRepayment);

            if (resultsDiv) resultsDiv.classList.remove('hidden');
        } else {
            if (resultsDiv) resultsDiv.classList.add('hidden');
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        const loanType = document.getElementById('loan-type').value;
        const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
        const interestRate = parseFloat(document.getElementById('loan-rate').value) || 0;
        const loanTenure = parseFloat(document.getElementById('loan-tenure').value) || 0;
        const purposeOfLoan = document.getElementById('loan-purpose').value.trim();
        const monthlyIncome = parseFloat(document.getElementById('loan-income').value) || 0;

        if (!loanType || loanAmount <= 0 || interestRate <= 0 || loanTenure <= 0 || !purposeOfLoan) {
            Utils.showToast('Please fill out all loan details correctly', 'error');
            return;
        }

        const loanData = { loanType, loanAmount, interestRate, loanTenure, purposeOfLoan, monthlyIncome };

        try {
            await ApiService.createLoan(loanData);
            Utils.showToast('Loan approved and added to your portfolio!', 'success');
            this.reset();
            App.navigateTo('expense');
        } catch (err) {
            Utils.showToast(err.message || 'Failed to create loan', 'error');
        }
    },

    renderExistingLoans() {
        const existingLoansDiv = document.getElementById('existing-loans');
        if (!existingLoansDiv) return;

        const loans = App.state.loans || [];
        existingLoansDiv.innerHTML = '';

        if (loans.length === 0) {
            existingLoansDiv.innerHTML = '<div class="card glass-card text-center" style="color:var(--text-muted);">No active loans found. Create one above to get started!</div>';
            return;
        }

        existingLoansDiv.innerHTML = '<h3 style="margin-bottom:1rem;">Your Active Loans</h3>' + loans.map(loan => {
            const amount = loan.loanAmount || loan.amount || 0;
            const rate = loan.interestRate || loan.rate || 0;
            const tenure = loan.loanTenure || loan.tenure || 0;
            const type = loan.loanType || loan.type || 'Personal Loan';
            const status = loan.status || 'APPROVED';
            const emi = loan.monthlyEmi || Utils.calculateEmi(amount, rate, tenure).emi;

            return `
                <div class="card glass-card mt-3">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                        <h4 style="font-size:1.1rem;display:flex;align-items:center;gap:0.4rem;">
                            <span class="material-icons" style="color:var(--primary)">account_balance</span> ${type}
                        </h4>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <span class="badge-status badge-${status.toLowerCase()}">${status}</span>
                            <button class="icon-btn" title="Delete Loan" onclick="LoanModule.deleteLoan('${loan.id}')">
                                <span class="material-icons" style="color:var(--danger);font-size:1.2rem;">delete</span>
                            </button>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:0.75rem;font-size:0.9rem;">
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Sanctioned Amount</span><strong>${Utils.formatCurrency(amount)}</strong></div>
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Monthly EMI</span><strong style="color:var(--primary);">${Utils.formatCurrency(emi)}</strong></div>
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Interest & Tenure</span><strong>${rate}% / ${tenure} yrs</strong></div>
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Utilized Amount</span><strong style="color:var(--accent);">${Utils.formatCurrency(loan.utilizedAmount || 0)}</strong></div>
                    </div>
                    <div style="margin-top:1rem;display:flex;justify-content:flex-end;gap:0.75rem;">
                        <button class="btn btn-sm btn-outline" onclick="App.navigateTo('expense')">
                            <span class="material-icons">receipt_long</span> Track Expenses
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="App.navigateTo('emi')">
                            <span class="material-icons">payment</span> EMI Schedule
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    deleteLoan(loanId) {
        const loan = (App.state.loans || []).find(l => l.id === loanId);
        const type = loan ? (loan.loanType || loan.type || 'Loan') : 'Loan';
        const amount = loan ? (loan.loanAmount || loan.amount || 0) : 0;

        if (confirm(`Are you sure you want to delete this ${type} (${Utils.formatCurrency(amount)})?\nAll associated expenses and EMI records will be permanently removed.`)) {
            // Remove loan
            App.state.loans = (App.state.loans || []).filter(l => l.id !== loanId);
            // Remove associated expenses
            App.state.expenses = (App.state.expenses || []).filter(e => e.loanId !== loanId);
            // Remove associated EMIs
            App.state.emis = (App.state.emis || []).filter(e => e.loanId !== loanId);

            if (typeof UserStorage !== 'undefined') UserStorage.saveData();

            Utils.showToast(`${type} deleted successfully`, 'info');
            this.renderExistingLoans();
        }
    },

    reset() {
        const loanForm = document.getElementById('loan-form');
        if (loanForm) loanForm.reset();
        const resultsDiv = document.getElementById('loan-results');
        if (resultsDiv) resultsDiv.classList.add('hidden');
    }
};

window.LoanModule = LoanModule;
