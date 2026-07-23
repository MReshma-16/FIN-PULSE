/* =====================================================
   FIN PULSE – Loan Management Module
   Auto-calculates EMI, creates loans, and lists user loans
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

        existingLoansDiv.innerHTML = '<h3>Existing Loans</h3>' + loans.map(loan => {
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
                        <span class="badge-status badge-${status.toLowerCase()}">${status}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:0.75rem;font-size:0.9rem;">
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Amount</span><strong>${Utils.formatCurrency(amount)}</strong></div>
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Monthly EMI</span><strong style="color:var(--primary);">${Utils.formatCurrency(emi)}</strong></div>
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Interest & Tenure</span><strong>${rate}% / ${tenure} yrs</strong></div>
                        <div><span style="color:var(--text-muted);display:block;font-size:0.78rem;">Utilized</span><strong style="color:var(--accent);">${Utils.formatCurrency(loan.utilizedAmount || 0)}</strong></div>
                    </div>
                    <div style="margin-top:1rem;display:flex;justify-content:flex-end;">
                        <button class="btn btn-sm btn-outline" onclick="App.navigateTo('expense')">
                            <span class="material-icons">receipt_long</span> Track Expenses
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    reset() {
        const loanForm = document.getElementById('loan-form');
        if (loanForm) loanForm.reset();
        const resultsDiv = document.getElementById('loan-results');
        if (resultsDiv) resultsDiv.classList.add('hidden');
    }
};

window.LoanModule = LoanModule;
