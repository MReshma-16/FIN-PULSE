/* =====================================================
   FIN PULSE – Dashboard Module
   Charts, stats, recent activity, and AI tips
   ===================================================== */

const DashboardModule = {
    charts: {},

    render() {
        const data = (typeof UserStorage !== 'undefined') ? UserStorage.getDashboardData() : MockData.getDashboardData();

        // Update stat cards
        const el = (id) => document.getElementById(id);
        if (el('dash-total-loan')) el('dash-total-loan').textContent = Utils.formatCurrency(data.totalLoanAmount);
        if (el('dash-utilized')) el('dash-utilized').textContent = Utils.formatCurrency(data.totalUtilizedAmount);
        if (el('dash-balance')) el('dash-balance').textContent = Utils.formatCurrency(data.remainingBalance);
        if (el('dash-emi')) el('dash-emi').textContent = Utils.formatCurrency(data.monthlyEmi);

        // Ensure Chart.js is ready, then render
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderCharts(data), 300);
        } else {
            this.renderCharts(data);
        }

        this.renderRecentExpenses(data.recentExpenses);
        this.renderAiTips();
        this.renderUpcomingEmi();
    },

    renderCharts(data) {
        if (typeof Chart === 'undefined') return;

        // Safely destroy existing chart instances
        if (this.charts.categoryChart) { this.charts.categoryChart.destroy(); this.charts.categoryChart = null; }
        if (this.charts.trendChart) { this.charts.trendChart.destroy(); this.charts.trendChart = null; }
        if (this.charts.emiChart) { this.charts.emiChart.destroy(); this.charts.emiChart = null; }

        const categoryColors = {
            'EDUCATION': '#1E88E5', 'MEDICAL': '#E53935', 'BUSINESS': '#FB8C00',
            'PERSONAL': '#8E24AA', 'HOME': '#43A047', 'AGRICULTURE': '#00897B', 'OTHER': '#757575'
        };

        // 1. Doughnut Chart - Spending by Category
        const canvasCat = document.getElementById('categoryChart');
        if (canvasCat) {
            let catObj = data.categoryExpenses || {};
            if (Object.keys(catObj).length === 0) {
                // Fallback demo data if user has no expenses yet
                catObj = { 'EDUCATION': 100000, 'PERSONAL': 50000, 'HOME': 35000 };
            }

            const labels = Object.keys(catObj);
            const values = Object.values(catObj);
            const colors = labels.map(l => categoryColors[l] || '#1976D2');

            const ctx = canvasCat.getContext('2d');
            this.charts.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { family: 'Inter', size: 11 } } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${Utils.formatCurrency(ctx.raw)}`
                            }
                        }
                    }
                }
            });
        }

        // 2. Bar Chart - Monthly Expenses
        const canvasTrend = document.getElementById('trendChart');
        if (canvasTrend) {
            let monthlyObj = data.monthlyExpenses || {};
            if (Object.keys(monthlyObj).length === 0) {
                monthlyObj = { 'Jan 26': 45000, 'Feb 26': 65000, 'Mar 26': 30000, 'Apr 26': 40000 };
            }

            const labels = Object.keys(monthlyObj);
            const values = Object.values(monthlyObj);

            const ctx = canvasTrend.getContext('2d');
            this.charts.trendChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Expenses',
                        data: values,
                        backgroundColor: 'rgba(21, 101, 192, 0.75)',
                        borderColor: '#1565C0',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        hoverBackgroundColor: '#1E88E5'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: (v) => Utils.formatCurrency(v) } },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx) => Utils.formatCurrency(ctx.raw) } }
                    }
                }
            });
        }

        // 3. Line Chart - EMI Payments Over Time
        const canvasEmi = document.getElementById('emiChart');
        if (canvasEmi) {
            const paidEmis = (App.state.emis || []).filter(e => e.status === 'PAID').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            let emiLabels = paidEmis.map(e => Utils.formatDate(e.dueDate));
            let emiValues = paidEmis.map(e => (e.emiAmount || e.amount || 0));

            if (emiLabels.length === 0) {
                emiLabels = ['Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];
                emiValues = [10247, 10247, 10247, 10247, 10247];
            }

            const ctx = canvasEmi.getContext('2d');
            this.charts.emiChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: emiLabels,
                    datasets: [{
                        label: 'EMI Paid',
                        data: emiValues,
                        fill: true,
                        backgroundColor: 'rgba(46, 125, 50, 0.12)',
                        borderColor: '#2E7D32',
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointBackgroundColor: '#2E7D32',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: (v) => Utils.formatCurrency(v) } },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx) => Utils.formatCurrency(ctx.raw) } }
                    }
                }
            });
        }
    },

    renderRecentExpenses(expenses) {
        const container = document.getElementById('recent-expenses-list');
        if (!container) return;

        const expList = (expenses && expenses.length > 0) ? expenses : App.state.expenses;

        if (!expList || expList.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem;">No recent expenses</p>';
            return;
        }

        container.innerHTML = expList.slice(0, 5).map(exp => {
            const emoji = Utils.getCategoryEmoji(exp.category);
            const amount = parseFloat(exp.expenseAmount || exp.amount) || 0;
            const name = exp.expenseName || exp.name || 'Expense';
            return `<div class="recent-item"><span>${emoji} ${name}</span><span style="font-weight:700;color:var(--danger)">${Utils.formatCurrency(amount)}</span></div>`;
        }).join('');
    },

    renderAiTips() {
        const container = document.getElementById('ai-tips-list');
        if (!container) return;

        const tips = Utils.getFinancialTips(App.state.expenses, App.state.loans);
        if (!tips || tips.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);">No tips available.</p>';
            return;
        }

        container.innerHTML = tips.map(tip => `
            <div class="tip-item">
                <span class="material-icons">tips_and_updates</span>
                <span>${tip}</span>
            </div>
        `).join('');
    },

    renderUpcomingEmi() {
        const container = document.getElementById('upcoming-emi-info');
        if (!container) return;

        const pendingEmis = (App.state.emis || []).filter(e => e.status !== 'PAID').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        if (pendingEmis.length === 0) {
            container.innerHTML = '<p style="color:var(--secondary);font-weight:600;">🎉 All EMIs paid for this loan!</p>';
            return;
        }

        const next = pendingEmis[0];
        const loan = (App.state.loans || []).find(l => l.id === next.loanId);
        const loanType = loan ? (loan.loanType || loan.type) : 'Loan';
        const amount = parseFloat(next.emiAmount || next.amount) || 0;

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h4 style="margin-bottom:0.25rem;">${loanType} – Installment #${next.emiNumber || 1}</h4>
                    <p style="color:var(--text-muted);font-size:0.85rem;">Due Date: ${Utils.formatDate(next.dueDate)}</p>
                </div>
                <div style="text-align:right;">
                    <span style="font-family:'Outfit';font-weight:800;font-size:1.3rem;color:var(--primary);">${Utils.formatCurrency(amount)}</span>
                    <button class="btn btn-sm btn-primary btn-glow mt-2" onclick="App.navigateTo('emi')" style="display:block;margin-left:auto;">
                        Pay Now
                    </button>
                </div>
            </div>
        `;
    }
};

window.DashboardModule = DashboardModule;
