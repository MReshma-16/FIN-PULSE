const LoanModule = {
    init() {
        const loanForm = document.getElementById('loan-form');
        if (loanForm) {
            loanForm.addEventListener('submit', this.handleSubmit.bind(this));
        }
        
        const amountInput = document.getElementById('loan-amount');
        const rateInput = document.getElementById('loan-rate');
        const tenureInput = document.getElementById('loan-tenure');
        
        [amountInput, rateInput, tenureInput].forEach(input => {
            if (input) {
                input.addEventListener('input', this.autoCalculate.bind(this));
            }
        });
    },
    
    autoCalculate() {
        const amount = parseFloat(document.getElementById('loan-amount').value) || 0;
        const rate = parseFloat(document.getElementById('loan-rate').value) || 0;
        const tenure = parseFloat(document.getElementById('loan-tenure').value) || 0;
        
        const resultsDiv = document.getElementById('loan-results');
        
        if (amount > 0 && rate > 0 && tenure > 0) {
            const { emi, totalInterest, totalPayment } = Utils.calculateEmi(amount, rate, tenure);
            
            document.getElementById('res-amount').textContent = Utils.formatCurrency(amount);
            document.getElementById('res-emi').textContent = Utils.formatCurrency(emi);
            document.getElementById('res-interest').textContent = Utils.formatCurrency(totalInterest);
            document.getElementById('res-total').textContent = Utils.formatCurrency(totalPayment);
            
            if (resultsDiv) resultsDiv.style.display = 'block';
        } else {
            if (resultsDiv) resultsDiv.style.display = 'none';
        }
    },
    
    handleSubmit(e) {
        e.preventDefault();
        
        const type = document.getElementById('loan-type').value;
        const amount = parseFloat(document.getElementById('loan-amount').value) || 0;
        const rate = parseFloat(document.getElementById('loan-rate').value) || 0;
        const tenure = parseFloat(document.getElementById('loan-tenure').value) || 0;
        const purpose = document.getElementById('loan-purpose').value;
        
        if (!type || amount <= 0 || rate <= 0 || tenure <= 0 || !purpose) {
            Utils.showToast('Please fill all fields correctly', 'error');
            return;
        }
        
        const loanData = { type, amount, rate, tenure, purpose };
        
        try {
            ApiService.createLoan(loanData);
            Utils.showToast('Loan created successfully', 'success');
            App.navigateTo('expense');
            this.reset();
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
            existingLoansDiv.innerHTML = '<p>No existing loans found.</p>';
            return;
        }
        
        loans.forEach(loan => {
            const emi = Utils.calculateEmi(loan.amount, loan.rate, loan.tenure).emi;
            const card = document.createElement('div');
            card.className = 'loan-card';
            card.innerHTML = `
                <div class="loan-card-header">
                    <h4>${loan.type}</h4>
                    <span class="badge badge-${loan.status.toLowerCase()}">${loan.status}</span>
                </div>
                <div class="loan-card-body">
                    <p>Amount: <strong>${Utils.formatCurrency(loan.amount)}</strong></p>
                    <p>EMI: <strong>${Utils.formatCurrency(emi)}/mo</strong></p>
                    <p>Interest: <strong>${loan.rate}%</strong> | Tenure: <strong>${loan.tenure} yrs</strong></p>
                </div>
                <div class="loan-card-footer">
                    <button class="btn btn-sm" onclick="App.navigateTo('emi')">View EMI</button>
                </div>
            `;
            existingLoansDiv.appendChild(card);
        });
    },
    
    reset() {
        const loanForm = document.getElementById('loan-form');
        if (loanForm) loanForm.reset();
        const resultsDiv = document.getElementById('loan-results');
        if (resultsDiv) resultsDiv.style.display = 'none';
    }
};
window.LoanModule = LoanModule;
