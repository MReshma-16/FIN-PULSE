/* =====================================================
   FIN PULSE – Utility Functions
   Common helpers used across the application
   ===================================================== */

const Utils = {

    /**
     * Format a number as Indian Rupee currency
     * @param {number} amount - The amount to format
     * @returns {string} Formatted currency string (e.g., "₹1,50,000")
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
        const num = parseFloat(amount);
        // Indian number formatting
        const formatted = num.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        });
        return `₹${formatted}`;
    },

    /**
     * Format a date string to DD/MM/YYYY
     * @param {string|Date} dateStr - Date to format
     * @returns {string} Formatted date
     */
    formatDate(dateStr) {
        if (!dateStr) return '--';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '--';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Format a date as relative time (e.g., "2 days ago")
     */
    timeAgo(dateStr) {
        const now = new Date();
        const past = new Date(dateStr);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return Utils.formatDate(dateStr);
    },

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'error', 'warning', or 'info'
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="material-icons">${icons[type] || 'info'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Generate a unique ID
     * @returns {string} UUID-like string
     */
    generateId() {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    },

    /**
     * Validate email address
     * @param {string} email
     * @returns {boolean}
     */
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Validate phone number (exactly 10 digits)
     * @param {string} phone
     * @returns {boolean}
     */
    validatePhone(phone) {
        const regex = /^\d{10}$/;
        return regex.test(phone);
    },

    /**
     * Calculate EMI using standard formula
     * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
     * @param {number} principal - Loan amount
     * @param {number} annualRate - Annual interest rate (%)
     * @param {number} tenureYears - Loan tenure in years
     * @returns {object} { emi, totalInterest, totalRepayment }
     */
    calculateEmi(principal, annualRate, tenureYears) {
        const P = parseFloat(principal);
        const r = parseFloat(annualRate) / 12 / 100; // Monthly interest rate
        const n = parseInt(tenureYears) * 12; // Total months

        if (P <= 0 || r <= 0 || n <= 0) {
            return { emi: 0, totalInterest: 0, totalRepayment: 0 };
        }

        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalRepayment = emi * n;
        const totalInterest = totalRepayment - P;

        return {
            emi: Math.round(emi),
            totalInterest: Math.round(totalInterest),
            totalRepayment: Math.round(totalRepayment)
        };
    },

    /**
     * Estimate credit score based on financial data (simplified rule-based)
     * @param {object} data - { income, totalLoan, paidEmis, totalEmis, utilization }
     * @returns {object} { score, label, color }
     */
    getCreditScore(data) {
        let score = 650; // Base score

        // Positive factors
        if (data.paidEmis > 0 && data.totalEmis > 0) {
            const paymentRatio = data.paidEmis / data.totalEmis;
            score += Math.round(paymentRatio * 100); // Up to +100 for timely payments
        }
        if (data.income > 50000) score += 30;
        if (data.utilization < 50) score += 40;
        else if (data.utilization < 80) score += 15;
        else score -= 20; // Over-utilization penalty

        // Cap between 300 and 900
        score = Math.max(300, Math.min(900, score));

        let label, color;
        if (score >= 750) { label = 'Excellent'; color = '#2E7D32'; }
        else if (score >= 700) { label = 'Good'; color = '#43A047'; }
        else if (score >= 650) { label = 'Fair'; color = '#FFA726'; }
        else if (score >= 550) { label = 'Poor'; color = '#F57C00'; }
        else { label = 'Very Poor'; color = '#D32F2F'; }

        return { score, label, color };
    },

    /**
     * Get AI financial tips based on spending patterns
     * @param {Array} expenses - User's expenses
     * @param {Array} loans - User's loans
     * @returns {Array<string>} List of tips
     */
    getFinancialTips(expenses, loans) {
        const tips = [];
        if (!loans.length) {
            tips.push('Apply for a loan that matches your needs to get started.');
            return tips;
        }

        const totalLoan = loans.reduce((s, l) => s + (l.loanAmount || 0), 0);
        const totalUtilized = loans.reduce((s, l) => s + (l.utilizedAmount || 0), 0);
        const utilPct = totalLoan > 0 ? (totalUtilized / totalLoan) * 100 : 0;

        if (utilPct > 90) {
            tips.push('⚠️ Your loan utilization is above 90%. Avoid further borrowing.');
        } else if (utilPct > 70) {
            tips.push('Consider slowing down your spending as utilization is above 70%.');
        } else if (utilPct < 30) {
            tips.push('You have significant loan balance available. Plan utilization wisely.');
        }

        // Category analysis
        if (expenses.length > 0) {
            const categoryMap = {};
            expenses.forEach(e => {
                categoryMap[e.category] = (categoryMap[e.category] || 0) + (e.expenseAmount || e.amount || 0);
            });
            const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
            if (topCategory) {
                tips.push(`Your highest spending category is "${topCategory[0]}". Review if costs can be optimized.`);
            }
        }

        tips.push('Pay EMIs on time to maintain a healthy credit score.');
        tips.push('Keep 3-6 months of EMI amount as an emergency fund.');
        tips.push('Review your expenses weekly to stay within budget.');

        if (loans.some(l => l.interestRate > 12)) {
            tips.push('Consider refinancing high-interest loans for better rates.');
        }

        return tips.slice(0, 5); // Return max 5 tips
    },

    /**
     * Debounce function to limit rapid calls
     */
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * Get category emoji/icon
     */
    getCategoryEmoji(category) {
        const map = {
            'EDUCATION': '🎓', 'MEDICAL': '🏥', 'BUSINESS': '💼',
            'PERSONAL': '🧑', 'HOME': '🏠', 'AGRICULTURE': '🌾', 'OTHER': '📦'
        };
        return map[category] || '📦';
    },

    /**
     * Get notification icon class and material icon name
     */
    getNotifStyle(type) {
        const styles = {
            'EMI_REMINDER': { icon: 'schedule', cls: 'emi-reminder' },
            'EMI_PAID': { icon: 'check_circle', cls: 'emi-paid' },
            'LOAN_APPROVED': { icon: 'thumb_up', cls: 'loan-approved' },
            'LOAN_REJECTED': { icon: 'thumb_down', cls: 'loan-rejected' },
            'MONTHLY_SUMMARY': { icon: 'analytics', cls: 'monthly-summary' },
            'BUDGET_ALERT': { icon: 'warning', cls: 'emi-reminder' },
            'GENERAL': { icon: 'notifications', cls: 'general' }
        };
        return styles[type] || styles['GENERAL'];
    },

    /**
     * Get today's date in YYYY-MM-DD format for input fields
     */
    todayStr() {
        return new Date().toISOString().split('T')[0];
    }
};

// Make Utils globally available
window.Utils = Utils;
