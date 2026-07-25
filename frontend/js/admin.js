/* =====================================================
   FIN PULSE – Admin Management Module
   Admin Overview Stats, User Management, Loan Approval Workflow & Expense Audit
   ===================================================== */

const AdminModule = {
    currentTab: 'users',

    init() {
        // Tab click handlers initialized dynamically
    },

    render() {
        // Calculate real platform stats
        const users = JSON.parse(localStorage.getItem('fp_users_db')) || MockData.allUsers || [];
        const loans = App.state.loans && App.state.loans.length > 0 ? App.state.loans : (MockData.allLoans || []);
        
        const totalUsers = users.length;
        const pendingLoansCount = loans.filter(l => (l.status || 'PENDING') === 'PENDING').length;
        const totalDisbursedAmount = loans.filter(l => (l.status || 'APPROVED') === 'APPROVED')
                                         .reduce((sum, l) => sum + (parseFloat(l.loanAmount || l.amount) || 0), 0);

        const usersEl = document.getElementById('admin-total-users');
        const pendingEl = document.getElementById('admin-pending-loans');
        const disbursedEl = document.getElementById('admin-disbursed');

        if (usersEl) usersEl.textContent = totalUsers;
        if (pendingEl) pendingEl.textContent = pendingLoansCount;
        if (disbursedEl) disbursedEl.textContent = Utils.formatCurrency(totalDisbursedAmount);

        this.renderUsers(users);
        this.renderLoans(loans);
        this.renderExpenses();
    },

    switchTab(tabName) {
        // tabName: 'users', 'loans', 'expenses'
        const tabBtnMap = {
            'users': 'admin-users-tab',
            'loans': 'admin-loans-tab',
            'expenses': 'admin-expenses-tab'
        };

        const targetId = tabBtnMap[tabName] || 'admin-users-tab';

        // Toggle active tab buttons
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            const btnTabId = btn.getAttribute('data-tab');
            btn.classList.toggle('active', btnTabId === targetId);
        });

        // Toggle active tab content panels
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === targetId);
        });

        this.currentTab = tabName;
    },

    renderUsers(users) {
        const tbody = document.getElementById('admin-users-body');
        if (!tbody) return;

        const userList = users || (JSON.parse(localStorage.getItem('fp_users_db')) || MockData.allUsers || []);

        if (userList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:1.5rem;color:var(--text-muted);">No registered users found</td></tr>';
            return;
        }

        tbody.innerHTML = userList.map(u => {
            const name = u.fullName || u.name || 'User Account';
            const email = u.email || 'user@example.com';
            const phone = u.phone || u.phoneNumber || '9876543210';
            const role = (u.role || 'USER').toUpperCase();
            const isActive = u.isActive !== false;

            return `
                <tr>
                    <td><strong>${name}</strong></td>
                    <td>${email}</td>
                    <td>${phone}</td>
                    <td><span class="badge-status ${role === 'ADMIN' ? 'badge-pending' : 'badge-paid'}">${role}</span></td>
                    <td><span class="badge-status ${isActive ? 'badge-paid' : 'badge-overdue'}">${isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="AdminModule.toggleUserStatus('${email}')">
                            <span class="material-icons" style="font-size:1rem;">swap_horiz</span> ${isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderLoans(loans) {
        const tbody = document.getElementById('admin-loans-body');
        if (!tbody) return;

        const loanList = loans || App.state.loans || MockData.allLoans || [];

        if (loanList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:1.5rem;color:var(--text-muted);">No loan applications found</td></tr>';
            return;
        }

        tbody.innerHTML = loanList.map(loan => {
            const user = loan.userName || (App.currentUser ? App.currentUser.fullName : 'Rahul Kumar');
            const type = loan.loanType || loan.type || 'Personal Loan';
            const amount = parseFloat(loan.loanAmount || loan.amount) || 0;
            const rate = loan.interestRate || loan.rate || 10;
            const tenure = loan.loanTenure || loan.tenure || 3;
            const status = loan.status || 'APPROVED';
            const statusClass = status.toLowerCase();

            let actionHtml = '<span style="color:var(--text-muted);font-size:0.85rem;">Completed</span>';
            if (status === 'PENDING') {
                actionHtml = `
                    <div style="display:flex;gap:0.4rem;">
                        <button class="btn btn-sm btn-success" onclick="AdminModule.approveLoan('${loan.id}')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminModule.rejectLoan('${loan.id}')">Reject</button>
                    </div>
                `;
            }

            return `
                <tr>
                    <td><strong>${user}</strong></td>
                    <td>${type}</td>
                    <td style="font-weight:700;color:var(--primary);">${Utils.formatCurrency(amount)}</td>
                    <td>${rate}%</td>
                    <td>${tenure} yrs</td>
                    <td><span class="badge-status badge-${statusClass}">${status}</span></td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join('');
    },

    renderExpenses() {
        const tbody = document.getElementById('admin-expenses-body');
        if (!tbody) return;

        const expenses = App.state.expenses || [];

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:1.5rem;color:var(--text-muted);">No recorded expenses found</td></tr>';
            return;
        }

        const userName = App.currentUser ? App.currentUser.fullName : 'Rahul Kumar';

        tbody.innerHTML = expenses.map(e => {
            const name = e.expenseName || e.name || 'Expense';
            const category = e.category || 'OTHER';
            const amount = parseFloat(e.expenseAmount || e.amount) || 0;
            const dateStr = Utils.formatDate(e.expenseDate || e.date);

            return `
                <tr>
                    <td><strong>${userName}</strong></td>
                    <td>${name}</td>
                    <td><span class="badge-status badge-paid">${category}</span></td>
                    <td style="font-weight:700;color:var(--danger);">${Utils.formatCurrency(amount)}</td>
                    <td>${dateStr}</td>
                </tr>
            `;
        }).join('');
    },

    searchUsers(query) {
        query = (query || '').toLowerCase();
        const rows = document.querySelectorAll('#admin-users-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    filterLoans(status) {
        const rows = document.querySelectorAll('#admin-loans-body tr');
        rows.forEach(row => {
            const text = row.textContent.toUpperCase();
            if (!status || status === 'ALL' || text.includes(status)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    toggleUserStatus(email) {
        const users = JSON.parse(localStorage.getItem('fp_users_db')) || [];
        const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
        if (u) {
            u.isActive = !(u.isActive !== false);
            localStorage.setItem('fp_users_db', JSON.stringify(users));
            Utils.showToast(`User status updated to ${u.isActive ? 'Active' : 'Inactive'}`, 'success');
            this.render();
        } else {
            Utils.showToast('User updated', 'info');
            this.render();
        }
    },

    async approveLoan(id) {
        if (!confirm('Approve this loan application?')) return;
        try {
            await ApiService.approveLoan(id);
            Utils.showToast('Loan approved successfully!', 'success');
            this.render();
        } catch (error) {
            Utils.showToast(error.message || 'Operation failed', 'error');
        }
    },

    async rejectLoan(id) {
        if (!confirm('Reject this loan application?')) return;
        try {
            await ApiService.rejectLoan(id);
            Utils.showToast('Loan rejected', 'info');
            this.render();
        } catch (error) {
            Utils.showToast(error.message || 'Operation failed', 'error');
        }
    }
};

window.AdminModule = AdminModule;
