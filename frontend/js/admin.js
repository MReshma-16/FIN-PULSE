const AdminModule = {
    currentTab: 'users',

    init() {
        // Initialization if needed
    },

    render() {
        // Simple mock stats
        const usersCount = MockData.allUsers ? MockData.allUsers.length : 0;
        const pendingLoans = MockData.allLoans ? MockData.allLoans.filter(l => l.status === 'PENDING').length : 0;
        const disbursedLoans = MockData.allLoans ? MockData.allLoans.filter(l => l.status === 'APPROVED').length : 0;

        const usersEl = document.getElementById('admin-total-users');
        const pendingEl = document.getElementById('admin-pending-loans');
        const disbursedEl = document.getElementById('admin-disbursed');

        if (usersEl) usersEl.textContent = usersCount;
        if (pendingEl) pendingEl.textContent = pendingLoans;
        if (disbursedEl) disbursedEl.textContent = disbursedLoans;

        this.renderUsers();
        this.renderLoans();
        this.renderExpenses();
    },

    switchTab(tab) {
        const btns = document.querySelectorAll('.admin-tabs .tab-btn');
        const contents = document.querySelectorAll('.admin-tab-content');

        btns.forEach(btn => btn.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        const targetBtn = Array.from(btns).find(b => b.textContent.toLowerCase().includes(tab));
        if (targetBtn) targetBtn.classList.add('active');

        const targetContent = document.getElementById(`admin-${tab}-content`);
        if (targetContent) targetContent.classList.add('active');

        this.currentTab = tab;
    },

    async renderUsers() {
        const tbody = document.getElementById('admin-users-body');
        if (!tbody) return;

        try {
            const users = await ApiService.adminGetUsers();
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td><span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${user.role.toUpperCase()}</span></td>
                    <td><span class="badge ${user.isActive !== false ? 'badge-success' : 'badge-danger'}">${user.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="Utils.showToast('Toggle user status', 'info')">Toggle Status</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        }
    },

    async renderLoans() {
        const tbody = document.getElementById('admin-loans-body');
        if (!tbody) return;

        try {
            const loans = await ApiService.adminGetLoans();
            if (loans.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No loans found</td></tr>';
                return;
            }

            tbody.innerHTML = loans.map(loan => {
                let actionHtml = '-';
                if (loan.status === 'PENDING') {
                    actionHtml = `
                        <button class="btn btn-sm btn-success" onclick="AdminModule.approveLoan('${loan.id}')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminModule.rejectLoan('${loan.id}')">Reject</button>
                    `;
                }

                let statusClass = 'badge-warning';
                if (loan.status === 'APPROVED') statusClass = 'badge-success';
                if (loan.status === 'REJECTED') statusClass = 'badge-danger';

                return `
                    <tr>
                        <td>${loan.userId}</td>
                        <td>${loan.type}</td>
                        <td>${Utils.formatCurrency(loan.amount)}</td>
                        <td>${loan.interestRate}%</td>
                        <td>${loan.tenure} months</td>
                        <td><span class="badge ${statusClass}">${loan.status}</span></td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        }
    },

    renderExpenses() {
        const tbody = document.getElementById('admin-expenses-body');
        if (!tbody) return;

        // Mock getting all expenses for admin
        let allExpenses = [];
        if (MockData.allUsers) {
            MockData.allUsers.forEach(u => {
                const storageKey = `finpulse_expenses_${u.id}`;
                const exp = JSON.parse(localStorage.getItem(storageKey) || '[]');
                allExpenses = allExpenses.concat(exp.map(e => ({...e, userId: u.id})));
            });
        }

        if (allExpenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No expenses found</td></tr>';
            return;
        }

        tbody.innerHTML = allExpenses.map(e => `
            <tr>
                <td>${e.userId}</td>
                <td>${e.name}</td>
                <td>${e.category}</td>
                <td>${Utils.formatCurrency(e.amount)}</td>
                <td>${Utils.formatDate(e.date)}</td>
            </tr>
        `).join('');
    },

    searchUsers(query) {
        query = query.toLowerCase();
        const rows = document.querySelectorAll('#admin-users-body tr');
        rows.forEach(row => {
            const name = row.children[0].textContent.toLowerCase();
            const email = row.children[1].textContent.toLowerCase();
            if (name.includes(query) || email.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    filterLoans(status) {
        const rows = document.querySelectorAll('#admin-loans-body tr');
        rows.forEach(row => {
            const rowStatus = row.children[5].textContent;
            if (!status || rowStatus === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    async approveLoan(id) {
        if (!confirm('Are you sure you want to approve this loan?')) return;
        try {
            await ApiService.approveLoan(id);
            Utils.showToast('Loan approved successfully', 'success');
            this.renderLoans();
            this.render();
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    },

    async rejectLoan(id) {
        if (!confirm('Are you sure you want to reject this loan?')) return;
        try {
            await ApiService.rejectLoan(id);
            Utils.showToast('Loan rejected successfully', 'success');
            this.renderLoans();
            this.render();
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    }
};
window.AdminModule = AdminModule;
