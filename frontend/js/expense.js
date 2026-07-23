/* =====================================================
   FIN PULSE – Expense Tracking Module
   Tracks loan utilization, expense breakdown, and progress ring
   ===================================================== */

const ExpenseModule = {
    currentLoanId: null,
    editingId: null,

    init() {
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const searchInput = document.getElementById('expense-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                const filterVal = document.getElementById('expense-filter') ? document.getElementById('expense-filter').value : 'ALL';
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
        const approvedLoans = (App.state.loans || []).filter(l => (l.status || 'APPROVED') === 'APPROVED');
        if (approvedLoans.length > 0) {
            this.currentLoanId = approvedLoans[0].id;
        } else {
            this.currentLoanId = null;
        }

        let totalLoan = 0;
        if (approvedLoans.length > 0) {
            totalLoan = approvedLoans.reduce((sum, l) => sum + (parseFloat(l.loanAmount || l.amount) || 0), 0);
        }

        const expenses = App.state.expenses || [];
        const utilized = expenses.reduce((sum, exp) => sum + (parseFloat(exp.expenseAmount || exp.amount) || 0), 0);
        const remaining = Math.max(0, totalLoan - utilized);
        const percentage = totalLoan > 0 ? Math.min(100, (utilized / totalLoan) * 100) : 0;

        this.updateProgressRing(percentage);

        const utilPercentEl = document.getElementById('util-percent');
        if (utilPercentEl) utilPercentEl.textContent = `${percentage.toFixed(0)}%`;

        const utilTotalEl = document.getElementById('util-total');
        if (utilTotalEl) utilTotalEl.textContent = Utils.formatCurrency(totalLoan);

        const utilUsedEl = document.getElementById('util-used');
        if (utilUsedEl) utilUsedEl.textContent = Utils.formatCurrency(utilized);

        const utilBalEl = document.getElementById('util-bal');
        if (utilBalEl) utilBalEl.textContent = Utils.formatCurrency(remaining);

        const budgetAlertEl = document.getElementById('budget-alert');
        if (budgetAlertEl) {
            budgetAlertEl.classList.toggle('hidden', percentage <= 80);
        }

        const filterVal = document.getElementById('expense-filter') ? document.getElementById('expense-filter').value : 'ALL';
        const searchVal = document.getElementById('expense-search') ? document.getElementById('expense-search').value : '';

        this.renderList(filterVal, searchVal);
    },

    renderList(filter = 'ALL', search = '') {
        const listEl = document.getElementById('expense-list');
        if (!listEl) return;

        let expenses = App.state.expenses || [];

        if (filter !== 'ALL') {
            expenses = expenses.filter(exp => exp.category === filter);
        }

        if (search) {
            const lowerSearch = search.toLowerCase();
            expenses = expenses.filter(exp => {
                const name = (exp.expenseName || exp.name || '').toLowerCase();
                return name.includes(lowerSearch);
            });
        }

        listEl.innerHTML = '';

        if (expenses.length === 0) {
            listEl.innerHTML = '<div class="card glass-card text-center" style="color:var(--text-muted);">No expenses found. Add one above!</div>';
            return;
        }

        expenses.forEach(exp => {
            const name = exp.expenseName || exp.name || 'Expense';
            const amount = parseFloat(exp.expenseAmount || exp.amount) || 0;
            const date = exp.expenseDate || exp.date;
            const emoji = Utils.getCategoryEmoji(exp.category);
            const dateStr = Utils.formatDate(date);
            const amountStr = Utils.formatCurrency(amount);

            const item = document.createElement('div');
            item.className = 'expense-item';
            item.innerHTML = `
                <div class="expense-left">
                    <div class="expense-icon">${emoji}</div>
                    <div class="expense-info">
                        <h4>${name}</h4>
                        <p>${exp.category} • ${dateStr}</p>
                    </div>
                </div>
                <div class="expense-right">
                    <span class="expense-amount">${amountStr}</span>
                    <div class="expense-actions">
                        <button class="icon-btn" title="Edit" onclick="ExpenseModule.showModal('${exp.id}')">
                            <span class="material-icons" style="font-size:1.1rem;color:var(--primary);">edit</span>
                        </button>
                        <button class="icon-btn" title="Delete" onclick="ExpenseModule.deleteExpense('${exp.id}')">
                            <span class="material-icons" style="font-size:1.1rem;color:var(--danger);">delete</span>
                        </button>
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

        if (modal) modal.classList.add('active');

        if (editId) {
            if (title) title.innerHTML = '<span class="material-icons">edit</span> Edit Expense';
            const exp = (App.state.expenses || []).find(e => e.id === editId);
            if (exp) {
                document.getElementById('exp-edit-id').value = exp.id;
                document.getElementById('exp-name').value = exp.expenseName || exp.name || '';
                document.getElementById('exp-amount').value = exp.expenseAmount || exp.amount || '';
                document.getElementById('exp-category').value = exp.category || 'OTHER';
                document.getElementById('exp-date').value = exp.expenseDate || exp.date || Utils.todayStr();
                document.getElementById('exp-desc').value = exp.description || '';
            }
        } else {
            if (title) title.innerHTML = '<span class="material-icons">add_circle</span> Add Expense';
            const form = document.getElementById('expense-form');
            if (form) form.reset();
            const dateEl = document.getElementById('exp-date');
            if (dateEl) dateEl.value = Utils.todayStr();
        }
    },

    closeModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) modal.classList.remove('active');
        this.editingId = null;
        const form = document.getElementById('expense-form');
        if (form) form.reset();
    },

    async handleSubmit(e) {
        e.preventDefault();

        const expenseName = document.getElementById('exp-name').value.trim();
        const expenseAmount = parseFloat(document.getElementById('exp-amount').value);
        const category = document.getElementById('exp-category').value;
        const expenseDate = document.getElementById('exp-date').value;
        const description = document.getElementById('exp-desc').value.trim();

        if (!expenseName || isNaN(expenseAmount) || expenseAmount <= 0 || !category || !expenseDate) {
            Utils.showToast('Please fill all required expense fields correctly', 'error');
            return;
        }

        const expData = {
            expenseName,
            expenseAmount,
            category,
            expenseDate,
            description,
            loanId: this.currentLoanId || (App.state.loans[0] ? App.state.loans[0].id : 'loan_1')
        };

        try {
            if (this.editingId) {
                await ApiService.updateExpense(this.editingId, expData);
                Utils.showToast('Expense updated successfully', 'success');
            } else {
                await ApiService.addExpense(expData);
                Utils.showToast('Expense recorded successfully', 'success');
            }
            this.closeModal();
            this.render();
        } catch (err) {
            Utils.showToast(err.message || 'Operation failed', 'error');
        }
    },

    async deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense entry?')) {
            try {
                await ApiService.deleteExpense(id);
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
            const circumference = 327; // 2 * PI * 52
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = Math.max(0, Math.min(circumference, offset));
        }
    }
};

window.ExpenseModule = ExpenseModule;
