const ExpenseModule = {
    currentLoanId: null,
    editingId: null,
    
    init() {
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', this.handleSubmit.bind(this));
        }
        
        const searchInput = document.getElementById('expense-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                const filterVal = document.getElementById('expense-filter') ? document.getElementById('expense-filter').value : 'all';
                this.renderList(filterVal, searchInput.value);
            }, 300));
        }
        
        const filterSelect = document.getElementById('expense-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                const searchVal = document.getElementById('expense-search') ? document.getElementById('expense-search').value : '';
                this.renderList(e.target.value, searchVal);
            });
        }
    },
    
    render() {
        const approvedLoans = (App.state.loans || []).filter(l => l.status === 'APPROVED');
        if (approvedLoans.length > 0) {
            this.currentLoanId = approvedLoans[0].id;
        } else {
            this.currentLoanId = null;
        }
        
        let totalLoan = 0;
        if (this.currentLoanId) {
            const loan = approvedLoans.find(l => l.id === this.currentLoanId);
            totalLoan = loan ? loan.amount : 0;
        }
        
        const expenses = App.state.expenses || [];
        const utilized = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = totalLoan - utilized;
        const percentage = totalLoan > 0 ? (utilized / totalLoan) * 100 : 0;
        
        this.updateProgressRing(percentage);
        
        const utilPercentEl = document.getElementById('util-percent');
        if (utilPercentEl) utilPercentEl.textContent = `${percentage.toFixed(1)}%`;
        
        const utilTotalEl = document.getElementById('util-total');
        if (utilTotalEl) utilTotalEl.textContent = Utils.formatCurrency(totalLoan);
        
        const utilUsedEl = document.getElementById('util-used');
        if (utilUsedEl) utilUsedEl.textContent = Utils.formatCurrency(utilized);
        
        const utilBalEl = document.getElementById('util-bal');
        if (utilBalEl) utilBalEl.textContent = Utils.formatCurrency(remaining);
        
        const budgetAlertEl = document.getElementById('budget-alert');
        if (budgetAlertEl) {
            budgetAlertEl.style.display = percentage > 80 ? 'block' : 'none';
        }
        
        const filterVal = document.getElementById('expense-filter') ? document.getElementById('expense-filter').value : 'all';
        const searchVal = document.getElementById('expense-search') ? document.getElementById('expense-search').value : '';
        
        this.renderList(filterVal, searchVal);
    },
    
    renderList(filter = 'all', search = '') {
        const listEl = document.getElementById('expense-list');
        if (!listEl) return;
        
        let expenses = App.state.expenses || [];
        
        if (filter !== 'all') {
            expenses = expenses.filter(exp => exp.category === filter);
        }
        
        if (search) {
            const lowerSearch = search.toLowerCase();
            expenses = expenses.filter(exp => exp.name.toLowerCase().includes(lowerSearch));
        }
        
        listEl.innerHTML = '';
        
        if (expenses.length === 0) {
            listEl.innerHTML = '<p class="text-center">No expenses found</p>';
            return;
        }
        
        expenses.forEach(exp => {
            const emoji = Utils.getCategoryEmoji(exp.category);
            const dateStr = Utils.formatDate(exp.date);
            const amountStr = Utils.formatCurrency(exp.amount);
            
            const item = document.createElement('div');
            item.className = 'expense-item';
            item.innerHTML = `
                <div class="expense-left">
                    <div class="expense-icon">${emoji}</div>
                    <div class="expense-info">
                        <h4>${exp.name}</h4>
                        <p>${exp.category} • ${dateStr}</p>
                    </div>
                </div>
                <div class="expense-right">
                    <span class="expense-amount">${amountStr}</span>
                    <div class="expense-actions">
                        <button class="icon-btn" onclick="ExpenseModule.showModal('${exp.id}')">✏️</button>
                        <button class="icon-btn" onclick="ExpenseModule.deleteExpense('${exp.id}')">🗑️</button>
                    </div>
                </div>
            `;
            listEl.appendChild(item);
        });
    },
    
    showModal(editId = null) {
        this.editingId = editId;
        const modal = document.getElementById('expense-modal');
        const title = document.getElementById('expense-modal-title');
        
        if (modal) modal.style.display = 'block';
        
        if (editId) {
            if (title) title.textContent = 'Edit Expense';
            const exp = (App.state.expenses || []).find(e => e.id === editId);
            if (exp) {
                document.getElementById('exp-name').value = exp.name;
                document.getElementById('exp-amount').value = exp.amount;
                document.getElementById('exp-category').value = exp.category;
                document.getElementById('exp-date').value = exp.date;
            }
        } else {
            if (title) title.textContent = 'Add Expense';
            const form = document.getElementById('expense-form');
            if (form) form.reset();
            const dateEl = document.getElementById('exp-date');
            if (dateEl) dateEl.value = Utils.todayStr();
        }
    },
    
    closeModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) modal.style.display = 'none';
        this.editingId = null;
        const form = document.getElementById('expense-form');
        if (form) form.reset();
    },
    
    handleSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('exp-name').value.trim();
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const category = document.getElementById('exp-category').value;
        const date = document.getElementById('exp-date').value;
        
        if (!name || isNaN(amount) || amount <= 0 || !category || !date) {
            Utils.showToast('Please fill all required fields correctly', 'error');
            return;
        }
        
        const expData = { name, amount, category, date, loanId: this.currentLoanId };
        
        try {
            if (this.editingId) {
                ApiService.updateExpense(this.editingId, expData);
                Utils.showToast('Expense updated', 'success');
            } else {
                ApiService.addExpense(expData);
                Utils.showToast('Expense added', 'success');
            }
            this.closeModal();
            this.render();
        } catch (err) {
            Utils.showToast(err.message || 'Operation failed', 'error');
        }
    },
    
    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                ApiService.deleteExpense(id);
                Utils.showToast('Expense deleted', 'success');
                this.render();
            } catch (err) {
                Utils.showToast(err.message || 'Failed to delete expense', 'error');
            }
        }
    },
    
    updateProgressRing(percent) {
        const circle = document.getElementById('util-ring');
        if (circle) {
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = Math.max(0, offset);
        }
    }
};
window.ExpenseModule = ExpenseModule;
