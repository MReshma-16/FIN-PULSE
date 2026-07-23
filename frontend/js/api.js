/* =====================================================
   FIN PULSE – API Service Layer with User-Specific Persistence
   Handles all backend communication with local storage persistence per user
   ===================================================== */

const ApiService = {
    BASE_URL: 'http://localhost:8080/api',
    token: localStorage.getItem('fp_token') || null,
    useMock: true,

    setToken(token) {
        this.token = token;
        localStorage.setItem('fp_token', token);
    },

    getToken() {
        return this.token || localStorage.getItem('fp_token');
    },

    clearToken() {
        this.token = null;
        localStorage.removeItem('fp_token');
    },

    async request(endpoint, method = 'GET', body = null) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

            const config = { method, headers };
            if (body && method !== 'GET') config.body = JSON.stringify(body);

            const res = await fetch(`${this.BASE_URL}${endpoint}`, config);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Request failed');
            this.useMock = false;
            return data;
        } catch (err) {
            this.useMock = true;
            return null; // Fall back to user-persisted mock data
        }
    },

    // ─── Auth APIs ───────────────────────────────────
    async register(data) {
        const res = await this.request('/auth/register', 'POST', data);
        if (res && res.data && res.data.token) {
            this.setToken(res.data.token);
            return res.data;
        }

        // Local Storage User Registry
        const usersDb = JSON.parse(localStorage.getItem('fp_users_db')) || [];
        const existing = usersDb.find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (existing) {
            throw new Error('User with this email already exists!');
        }

        const newUser = {
            id: 'user_' + Date.now(),
            email: data.email.toLowerCase(),
            password: data.password, // In real app hashed on backend
            fullName: data.fullName,
            phone: data.phoneNumber || data.phone || '9876543210',
            role: 'USER',
            createdAt: new Date().toISOString()
        };
        usersDb.push(newUser);
        localStorage.setItem('fp_users_db', JSON.stringify(usersDb));

        const token = 'jwt_token_' + Date.now();
        this.setToken(token);
        return { token, email: newUser.email, fullName: newUser.fullName, role: newUser.role, phone: newUser.phone };
    },

    async login(data) {
        const res = await this.request('/auth/login', 'POST', data);
        if (res && res.data && res.data.token) {
            this.setToken(res.data.token);
            return res.data;
        }

        const emailLower = data.email.toLowerCase();

        // Check if admin
        if (emailLower === 'admin@finpulse.com') {
            const admin = { token: 'mock_admin_token', email: 'admin@finpulse.com', fullName: 'Admin User', role: 'ADMIN', phone: '9876543210' };
            this.setToken(admin.token);
            return admin;
        }

        // Check registered users in local storage
        const usersDb = JSON.parse(localStorage.getItem('fp_users_db')) || [];
        const found = usersDb.find(u => u.email.toLowerCase() === emailLower);

        if (found) {
            if (data.password && found.password && data.password !== found.password) {
                throw new Error('Invalid email or password');
            }
            const token = 'jwt_token_' + Date.now();
            this.setToken(token);
            return { token, email: found.email, fullName: found.fullName, role: found.role, phone: found.phone };
        }

        // If demo user or new login without registration
        const mockUser = {
            token: 'jwt_token_' + Date.now(),
            email: data.email,
            fullName: data.email.split('@')[0].replace('.', ' ').toUpperCase(),
            role: 'USER',
            phone: '9876543210'
        };

        // Save demo user into registry
        usersDb.push({ ...mockUser, password: data.password || 'password123' });
        localStorage.setItem('fp_users_db', JSON.stringify(usersDb));

        this.setToken(mockUser.token);
        return mockUser;
    },

    // ─── Loan APIs ───────────────────────────────────
    async getLoans() {
        const res = await this.request('/loans');
        if (res && res.data) return res.data;
        return UserStorage.loadData().loans;
    },

    async createLoan(data) {
        const res = await this.request('/loans', 'POST', data);
        if (res && res.data) return res.data;

        const calc = Utils.calculateEmi(data.loanAmount, data.interestRate, data.loanTenure);
        const newLoan = {
            id: Utils.generateId(), ...data,
            monthlyEmi: calc.emi, totalInterest: calc.totalInterest,
            totalRepayment: calc.totalRepayment, utilizedAmount: 0,
            remainingBalance: parseFloat(data.loanAmount), status: 'APPROVED',
            createdAt: new Date().toISOString()
        };

        App.state.loans.push(newLoan);
        UserStorage.generateEmisForLoan(newLoan);
        UserStorage.saveData();

        return newLoan;
    },

    async approveLoan(id) {
        const res = await this.request(`/loans/${id}/approve`, 'PUT');
        if (res) return res.data;
        const loan = App.state.loans.find(l => l.id === id);
        if (loan) {
            loan.status = 'APPROVED';
            UserStorage.saveData();
        }
        return loan;
    },

    async rejectLoan(id) {
        const res = await this.request(`/loans/${id}/reject`, 'PUT');
        if (res) return res.data;
        const loan = App.state.loans.find(l => l.id === id);
        if (loan) {
            loan.status = 'REJECTED';
            UserStorage.saveData();
        }
        return loan;
    },

    // ─── Expense APIs ────────────────────────────────
    async getExpenses() {
        const res = await this.request('/expenses');
        if (res && res.data) return res.data;
        return UserStorage.loadData().expenses;
    },

    async addExpense(data) {
        const res = await this.request('/expenses', 'POST', data);
        if (res && res.data) return res.data;

        const exp = { id: Utils.generateId(), ...data, createdAt: new Date().toISOString() };
        App.state.expenses.push(exp);

        const loan = App.state.loans.find(l => l.id === data.loanId);
        if (loan) {
            loan.utilizedAmount = (loan.utilizedAmount || 0) + parseFloat(data.expenseAmount || data.amount);
            loan.remainingBalance = loan.loanAmount - loan.utilizedAmount;
        }

        UserStorage.saveData();
        return exp;
    },

    async updateExpense(id, data) {
        const res = await this.request(`/expenses/${id}`, 'PUT', data);
        if (res && res.data) return res.data;

        const idx = App.state.expenses.findIndex(e => e.id === id);
        if (idx >= 0) {
            App.state.expenses[idx] = { ...App.state.expenses[idx], ...data };
            UserStorage.saveData();
        }
        return App.state.expenses[idx];
    },

    async deleteExpense(id) {
        const res = await this.request(`/expenses/${id}`, 'DELETE');
        if (res) return res;

        const idx = App.state.expenses.findIndex(e => e.id === id);
        if (idx >= 0) {
            const removed = App.state.expenses.splice(idx, 1)[0];
            const loan = App.state.loans.find(l => l.id === removed.loanId);
            if (loan) {
                const totalUsed = App.state.expenses
                    .filter(e => e.loanId === loan.id)
                    .reduce((s, e) => s + parseFloat(e.expenseAmount || e.amount || 0), 0);
                loan.utilizedAmount = totalUsed;
                loan.remainingBalance = loan.loanAmount - totalUsed;
            }
            UserStorage.saveData();
        }
        return { success: true };
    },

    // ─── EMI APIs ────────────────────────────────────
    async getEmis(loanId) {
        const res = await this.request(`/emi/loan/${loanId}`);
        if (res && res.data) return res.data;
        return App.state.emis.filter(e => e.loanId === loanId);
    },

    async payEmi(id) {
        const res = await this.request(`/emi/${id}/pay`, 'PUT');
        if (res && res.data) return res.data;

        const emi = App.state.emis.find(e => e.id === id);
        if (emi) {
            emi.status = 'PAID';
            emi.paidDate = new Date().toISOString();

            // Add notification
            App.state.notifications.unshift({
                id: Utils.generateId(),
                title: 'EMI Paid',
                message: `EMI #${emi.emiNumber} of ${Utils.formatCurrency(emi.emiAmount)} marked as paid.`,
                type: 'EMI_PAID',
                isRead: false,
                createdAt: new Date().toISOString()
            });

            UserStorage.saveData();
        }
        return emi;
    },

    // ─── Dashboard API ───────────────────────────────
    async getDashboard() {
        const res = await this.request('/dashboard');
        if (res && res.data) return res.data;
        return UserStorage.getDashboardData();
    },

    // ─── Notification APIs ───────────────────────────
    async getNotifications() {
        const res = await this.request('/notifications');
        if (res && res.data) return res.data;
        return UserStorage.loadData().notifications;
    },

    async markNotificationRead(id) {
        const res = await this.request(`/notifications/${id}/read`, 'PUT');
        if (res) return res;

        const n = App.state.notifications.find(x => x.id === id);
        if (n) {
            n.isRead = true;
            UserStorage.saveData();
        }
        return { success: true };
    },

    // ─── Profile APIs ────────────────────────────────
    async getProfile() {
        const res = await this.request('/users/profile');
        if (res && res.data) return res.data;
        return App.currentUser;
    },

    async updateProfile(data) {
        const res = await this.request('/users/profile', 'PUT', data);
        if (res && res.data) return res.data;

        Object.assign(App.currentUser, data);
        localStorage.setItem('fp_user', JSON.stringify(App.currentUser));
        UserStorage.saveData();
        return App.currentUser;
    },

    // ─── Admin APIs ──────────────────────────────────
    async adminGetUsers() {
        const res = await this.request('/admin/users');
        if (res && res.data) return res.data;
        return JSON.parse(localStorage.getItem('fp_users_db')) || MockData.allUsers;
    },

    async adminGetLoans() {
        const res = await this.request('/admin/loans');
        if (res && res.data) return res.data;
        return App.state.loans;
    }
};

/* =====================================================
   USER STORAGE MANAGER – Keyed per logged-in user
   ===================================================== */
const UserStorage = {
    getUserKey() {
        const user = App.currentUser;
        if (!user || !user.email) return 'fp_user_data_default';
        return `fp_user_data_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    },

    loadData() {
        const key = this.getUserKey();
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                App.state.loans = parsed.loans || [];
                App.state.expenses = parsed.expenses || [];
                App.state.emis = parsed.emis || [];
                App.state.notifications = parsed.notifications || [];
                return App.state;
            } catch (e) {
                console.error('Failed to parse user storage:', e);
            }
        }

        // First time user login – seed initial data
        const initialLoans = [
            {
                id: 'loan_1', loanType: 'EDUCATION', loanAmount: 500000,
                interestRate: 8.5, loanTenure: 5, purposeOfLoan: 'Higher Studies',
                monthlyIncome: 45000, monthlyEmi: 10247, totalInterest: 114820,
                totalRepayment: 614820, utilizedAmount: 150000,
                remainingBalance: 350000, status: 'APPROVED',
                createdAt: '2026-01-15'
            }
        ];

        const initialExpenses = [
            { id: 'exp_1', loanId: 'loan_1', expenseName: 'Tuition Fee', expenseAmount: 100000, category: 'EDUCATION', expenseDate: '2026-02-10', description: 'Semester fee' },
            { id: 'exp_2', loanId: 'loan_1', expenseName: 'Study Laptop', expenseAmount: 50000, category: 'PERSONAL', expenseDate: '2026-02-15', description: 'Laptop purchase' }
        ];

        const initialNotifications = [
            { id: 'n1', title: 'Welcome to FIN PULSE', message: 'Your account is ready! Manage your loans & expenses here.', type: 'GENERAL', isRead: false, createdAt: new Date().toISOString() }
        ];

        App.state.loans = initialLoans;
        App.state.expenses = initialExpenses;
        App.state.notifications = initialNotifications;
        App.state.emis = [];

        initialLoans.forEach(l => this.generateEmisForLoan(l));
        this.saveData();

        return App.state;
    },

    saveData() {
        const key = this.getUserKey();
        localStorage.setItem(key, JSON.stringify({
            loans: App.state.loans,
            expenses: App.state.expenses,
            emis: App.state.emis,
            notifications: App.state.notifications
        }));
    },

    generateEmisForLoan(loan) {
        const n = loan.loanTenure * 12;
        const startDate = new Date(loan.createdAt || Date.now());
        startDate.setMonth(startDate.getMonth() + 1);
        let balance = loan.totalRepayment || loan.loanAmount;

        for (let i = 1; i <= Math.min(n, 24); i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + (i - 1));
            const isPaid = i <= 2;
            const emi = {
                id: `emi_${loan.id}_${i}`,
                loanId: loan.id,
                emiNumber: i,
                emiAmount: loan.monthlyEmi,
                dueDate: dueDate.toISOString().split('T')[0],
                status: isPaid ? 'PAID' : (dueDate < new Date() ? 'OVERDUE' : 'PENDING'),
                paidDate: isPaid ? dueDate.toISOString().split('T')[0] : null,
                remainingBalance: Math.max(0, balance - (loan.monthlyEmi * i))
            };
            App.state.emis.push(emi);
        }
    },

    getDashboardData() {
        const loans = App.state.loans;
        const expenses = App.state.expenses;
        const totalLoan = loans.reduce((s, l) => s + (parseFloat(l.loanAmount) || 0), 0);
        const totalUtilized = loans.reduce((s, l) => s + (parseFloat(l.utilizedAmount) || 0), 0);
        const totalEmi = loans.reduce((s, l) => s + (parseFloat(l.monthlyEmi) || 0), 0);

        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + parseFloat(e.expenseAmount || e.amount || 0);
        });

        const monthly = {};
        expenses.forEach(e => {
            const m = new Date(e.expenseDate).toLocaleString('en', { month: 'short', year: '2-digit' });
            monthly[m] = (monthly[m] || 0) + parseFloat(e.expenseAmount || e.amount || 0);
        });

        return {
            totalLoanAmount: totalLoan,
            totalUtilizedAmount: totalUtilized,
            remainingBalance: totalLoan - totalUtilized,
            monthlyEmi: totalEmi,
            categoryExpenses: categories,
            monthlyExpenses: monthly,
            recentExpenses: expenses.slice(-5).reverse()
        };
    }
};

const MockData = {
    allUsers: [
        { id: 1, fullName: 'Admin User', email: 'admin@finpulse.com', phoneNumber: '9876543210', role: 'ADMIN', isActive: true },
        { id: 2, fullName: 'Rahul Kumar', email: 'rahul@example.com', phoneNumber: '9876543211', role: 'USER', isActive: true }
    ],
    getDashboardData() {
        return UserStorage.getDashboardData();
    }
};

window.ApiService = ApiService;
window.UserStorage = UserStorage;
window.MockData = MockData;
