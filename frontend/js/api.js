/* =====================================================
   FIN PULSE – API Service Layer
   Handles all backend communication with fallback mock data
   ===================================================== */

const ApiService = {
    BASE_URL: 'http://localhost:8080/api',
    token: localStorage.getItem('fp_token') || null,
    useMock: true, // Will be set to false if backend is reachable

    // ─── Token Management ────────────────────────────
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

    // ─── HTTP Request Helper ─────────────────────────
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
            // If backend is unreachable, fall back to mock
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                this.useMock = true;
                return null; // Caller will use mock data
            }
            throw err;
        }
    },

    // ─── Auth APIs ───────────────────────────────────
    async register(data) {
        const res = await this.request('/auth/register', 'POST', data);
        if (res && res.data && res.data.token) {
            this.setToken(res.data.token);
            return res.data;
        }
        // Mock registration
        const mockUser = {
            token: 'mock_jwt_token_' + Date.now(),
            email: data.email,
            fullName: data.fullName,
            role: 'USER'
        };
        this.setToken(mockUser.token);
        return mockUser;
    },

    async login(data) {
        const res = await this.request('/auth/login', 'POST', data);
        if (res && res.data && res.data.token) {
            this.setToken(res.data.token);
            return res.data;
        }
        // Mock login – accept demo credentials
        if (data.email === 'admin@finpulse.com') {
            const admin = { token: 'mock_admin_token', email: data.email, fullName: 'Admin User', role: 'ADMIN' };
            this.setToken(admin.token);
            return admin;
        }
        const mockUser = { token: 'mock_jwt_token_' + Date.now(), email: data.email, fullName: 'Demo User', role: 'USER' };
        this.setToken(mockUser.token);
        return mockUser;
    },

    // ─── Loan APIs ───────────────────────────────────
    async getLoans() {
        const res = await this.request('/loans');
        if (res && res.data) return res.data;
        return MockData.loans;
    },

    async createLoan(data) {
        const res = await this.request('/loans', 'POST', data);
        if (res && res.data) return res.data;
        // Mock: add to local state
        const calc = Utils.calculateEmi(data.loanAmount, data.interestRate, data.loanTenure);
        const newLoan = {
            id: Utils.generateId(), ...data,
            monthlyEmi: calc.emi, totalInterest: calc.totalInterest,
            totalRepayment: calc.totalRepayment, utilizedAmount: 0,
            remainingBalance: data.loanAmount, status: 'APPROVED',
            createdAt: new Date().toISOString()
        };
        App.state.loans.push(newLoan);
        MockData.generateEmis(newLoan);
        return newLoan;
    },

    async approveLoan(id) {
        const res = await this.request(`/loans/${id}/approve`, 'PUT');
        if (res) return res.data;
        const loan = App.state.loans.find(l => l.id === id);
        if (loan) { loan.status = 'APPROVED'; }
        return loan;
    },

    async rejectLoan(id) {
        const res = await this.request(`/loans/${id}/reject`, 'PUT');
        if (res) return res.data;
        const loan = App.state.loans.find(l => l.id === id);
        if (loan) { loan.status = 'REJECTED'; }
        return loan;
    },

    // ─── Expense APIs ────────────────────────────────
    async getExpenses() {
        const res = await this.request('/expenses');
        if (res && res.data) return res.data;
        return MockData.expenses;
    },

    async addExpense(data) {
        const res = await this.request('/expenses', 'POST', data);
        if (res && res.data) return res.data;
        const exp = { id: Utils.generateId(), ...data, createdAt: new Date().toISOString() };
        App.state.expenses.push(exp);
        // Update loan utilization
        const loan = App.state.loans.find(l => l.id === data.loanId);
        if (loan) {
            loan.utilizedAmount = (loan.utilizedAmount || 0) + parseFloat(data.expenseAmount || data.amount);
            loan.remainingBalance = loan.loanAmount - loan.utilizedAmount;
        }
        return exp;
    },

    async updateExpense(id, data) {
        const res = await this.request(`/expenses/${id}`, 'PUT', data);
        if (res && res.data) return res.data;
        const idx = App.state.expenses.findIndex(e => e.id === id);
        if (idx >= 0) { App.state.expenses[idx] = { ...App.state.expenses[idx], ...data }; }
        return App.state.expenses[idx];
    },

    async deleteExpense(id) {
        const res = await this.request(`/expenses/${id}`, 'DELETE');
        if (res) return res;
        const idx = App.state.expenses.findIndex(e => e.id === id);
        if (idx >= 0) {
            const removed = App.state.expenses.splice(idx, 1)[0];
            // Recalculate loan utilization
            const loan = App.state.loans.find(l => l.id === removed.loanId);
            if (loan) {
                const totalUsed = App.state.expenses
                    .filter(e => e.loanId === loan.id)
                    .reduce((s, e) => s + parseFloat(e.expenseAmount || e.amount || 0), 0);
                loan.utilizedAmount = totalUsed;
                loan.remainingBalance = loan.loanAmount - totalUsed;
            }
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
        }
        return emi;
    },

    // ─── Dashboard API ───────────────────────────────
    async getDashboard() {
        const res = await this.request('/dashboard');
        if (res && res.data) return res.data;
        return MockData.getDashboardData();
    },

    // ─── Notification APIs ───────────────────────────
    async getNotifications() {
        const res = await this.request('/notifications');
        if (res && res.data) return res.data;
        return MockData.notifications;
    },

    async markNotificationRead(id) {
        const res = await this.request(`/notifications/${id}/read`, 'PUT');
        if (res) return res;
        const n = App.state.notifications.find(x => x.id === id);
        if (n) n.isRead = true;
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
        return App.currentUser;
    },

    // ─── Admin APIs ──────────────────────────────────
    async adminGetUsers() {
        const res = await this.request('/admin/users');
        if (res && res.data) return res.data;
        return MockData.allUsers;
    },

    async adminGetLoans() {
        const res = await this.request('/admin/loans');
        if (res && res.data) return res.data;
        return MockData.allLoans;
    }
};

/* =====================================================
   MOCK DATA – Used when backend is unavailable
   ===================================================== */
const MockData = {
    loans: [
        {
            id: 'loan_1', loanType: 'EDUCATION', loanAmount: 500000,
            interestRate: 8.5, loanTenure: 5, purposeOfLoan: 'MBA Program',
            monthlyIncome: 35000, monthlyEmi: 10247, totalInterest: 114820,
            totalRepayment: 614820, utilizedAmount: 185000,
            remainingBalance: 315000, status: 'APPROVED',
            createdAt: '2026-01-15'
        },
        {
            id: 'loan_2', loanType: 'PERSONAL', loanAmount: 200000,
            interestRate: 12, loanTenure: 3, purposeOfLoan: 'Home Renovation',
            monthlyIncome: 35000, monthlyEmi: 6643, totalInterest: 39148,
            totalRepayment: 239148, utilizedAmount: 50000,
            remainingBalance: 150000, status: 'APPROVED',
            createdAt: '2026-03-01'
        }
    ],

    expenses: [
        { id: 'exp_1', loanId: 'loan_1', expenseName: 'Semester 1 Tuition', expenseAmount: 75000, category: 'EDUCATION', expenseDate: '2026-02-10', description: 'Tuition fee' },
        { id: 'exp_2', loanId: 'loan_1', expenseName: 'Books & Materials', expenseAmount: 15000, category: 'EDUCATION', expenseDate: '2026-02-15', description: 'Textbooks' },
        { id: 'exp_3', loanId: 'loan_1', expenseName: 'Laptop', expenseAmount: 65000, category: 'PERSONAL', expenseDate: '2026-02-20', description: 'For coursework' },
        { id: 'exp_4', loanId: 'loan_1', expenseName: 'Hostel Deposit', expenseAmount: 25000, category: 'PERSONAL', expenseDate: '2026-03-01', description: 'Security deposit' },
        { id: 'exp_5', loanId: 'loan_1', expenseName: 'Medical Exam', expenseAmount: 5000, category: 'MEDICAL', expenseDate: '2026-03-15', description: 'Required checkup' },
        { id: 'exp_6', loanId: 'loan_2', expenseName: 'Kitchen Reno', expenseAmount: 30000, category: 'HOME', expenseDate: '2026-04-10', description: 'Kitchen cabinets' },
        { id: 'exp_7', loanId: 'loan_2', expenseName: 'Bathroom Fittings', expenseAmount: 20000, category: 'HOME', expenseDate: '2026-04-20', description: 'New fixtures' }
    ],

    emis: [],

    notifications: [
        { id: 'n1', title: 'EMI Due Reminder', message: 'Your EMI of ₹10,247 for Education Loan is due on Aug 1, 2026.', type: 'EMI_REMINDER', isRead: false, createdAt: '2026-07-20T10:00:00' },
        { id: 'n2', title: 'Loan Approved', message: 'Your Personal Loan of ₹2,00,000 has been approved.', type: 'LOAN_APPROVED', isRead: true, createdAt: '2026-03-01T09:00:00' },
        { id: 'n3', title: 'EMI Paid', message: 'Your EMI #5 for Education Loan has been recorded successfully.', type: 'EMI_PAID', isRead: true, createdAt: '2026-06-01T11:00:00' },
        { id: 'n4', title: 'Monthly Summary', message: 'Your June 2026 financial summary is ready. Total spending: ₹35,000.', type: 'MONTHLY_SUMMARY', isRead: false, createdAt: '2026-07-01T08:00:00' },
        { id: 'n5', title: 'Budget Alert', message: 'Your Education Loan utilization has crossed 35%. Monitor your spending.', type: 'BUDGET_ALERT', isRead: false, createdAt: '2026-07-15T14:00:00' }
    ],

    allUsers: [
        { id: 1, fullName: 'Admin User', email: 'admin@finpulse.com', phoneNumber: '9876543210', role: 'ADMIN', isActive: true },
        { id: 2, fullName: 'Rahul Kumar', email: 'rahul@example.com', phoneNumber: '9876543211', role: 'USER', isActive: true },
        { id: 3, fullName: 'Priya Sharma', email: 'priya@example.com', phoneNumber: '9876543212', role: 'USER', isActive: true },
        { id: 4, fullName: 'Amit Patel', email: 'amit@example.com', phoneNumber: '9876543213', role: 'USER', isActive: true },
        { id: 5, fullName: 'Deepa Nair', email: 'deepa@example.com', phoneNumber: '9876543214', role: 'USER', isActive: false }
    ],

    allLoans: [
        { id: 'loan_1', userName: 'Rahul Kumar', loanType: 'EDUCATION', loanAmount: 500000, interestRate: 8.5, loanTenure: 5, status: 'APPROVED' },
        { id: 'loan_2', userName: 'Rahul Kumar', loanType: 'PERSONAL', loanAmount: 200000, interestRate: 12, loanTenure: 3, status: 'APPROVED' },
        { id: 'loan_3', userName: 'Priya Sharma', loanType: 'HOME', loanAmount: 2500000, interestRate: 7.5, loanTenure: 20, status: 'APPROVED' },
        { id: 'loan_4', userName: 'Amit Patel', loanType: 'VEHICLE', loanAmount: 800000, interestRate: 9, loanTenure: 7, status: 'PENDING' },
        { id: 'loan_5', userName: 'Deepa Nair', loanType: 'BUSINESS', loanAmount: 1000000, interestRate: 11, loanTenure: 5, status: 'PENDING' }
    ],

    /** Generate EMI schedule for a loan */
    generateEmis(loan) {
        const n = loan.loanTenure * 12;
        const startDate = new Date(loan.createdAt || Date.now());
        startDate.setMonth(startDate.getMonth() + 1); // First EMI next month
        let balance = loan.totalRepayment || loan.loanAmount;

        for (let i = 1; i <= Math.min(n, 24); i++) { // Generate up to 24 for demo
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + (i - 1));
            const isPaid = i <= 5; // First 5 paid for demo
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

    /** Generate mock dashboard data */
    getDashboardData() {
        const loans = App.state.loans;
        const expenses = App.state.expenses;
        const totalLoan = loans.reduce((s, l) => s + l.loanAmount, 0);
        const totalUtilized = loans.reduce((s, l) => s + (l.utilizedAmount || 0), 0);
        const totalEmi = loans.reduce((s, l) => s + (l.monthlyEmi || 0), 0);

        // Category breakdown
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + (e.expenseAmount || 0);
        });

        // Monthly trend
        const monthly = {};
        expenses.forEach(e => {
            const m = new Date(e.expenseDate).toLocaleString('en', { month: 'short', year: '2-digit' });
            monthly[m] = (monthly[m] || 0) + (e.expenseAmount || 0);
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
    },

    /** Initialize mock EMIs */
    init() {
        App.state.emis = [];
        this.loans.forEach(loan => this.generateEmis(loan));
    }
};

window.ApiService = ApiService;
window.MockData = MockData;
