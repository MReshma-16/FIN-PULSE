/* =====================================================
   FIN PULSE – Dashboard Module
   Accurate real-time charts, stats, and zero-state handling
   ===================================================== */

const DashboardModule = {
    charts: {},

    render() {
        // Fetch real aggregated data for current user
        const data = (typeof UserStorage !== 'undefined') ? UserStorage.getDashboardData() : {
            totalLoanAmount: 0,
            totalUtilizedAmount: 0,
            remainingBalance: 0,
            monthlyEmi: 0,
            categoryExpenses: {},
            monthlyExpenses: {},
            recentExpenses: []
        };

        // Update stat cards accurately
        const el = (id) => document.getElementById(id);
        if (el('dash-total-loan')) el('dash-total-loan').textContent = Utils.formatCurrency(data.totalLoanAmount || 0);
        if (el('dash-utilized')) el('dash-utilized').textContent = Utils.formatCurrency(data.totalUtilizedAmount || 0);
        if (el('dash-balance')) el('dash-balance').textContent = Utils.formatCurrency(data.remainingBalance || 0);
        if (el('dash-emi')) el('dash-emi').textContent = Utils.formatCurrency(data.monthlyEmi || 0);

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

        const hasExpenses = data.categoryExpenses && Object.keys(data.categoryExpenses).length > 0 && Object.values(data.categoryExpenses).some(v => v > 0);

        // 1. Doughnut Chart - Category Breakdown
        const canvasCat = document.getElementById('categoryChart');
        if (canvasCat) {
            const ctx = canvasCat.getContext('2d');
            
            if (!hasExpenses) {
                // ACCURATE ZERO STATE: No hardcoded demo numbers when loan/expenses = 0
                this.charts.categoryChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['No Expenses Recorded'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['#E2E8F0'],
                            borderWidth: 1,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 } } },
                            tooltip: {
                                callbacks: {
                                    label: () => ' ₹0 - Add expenses under Loan Utilization'
                                }
                            }
                        }
                    }
                });
            } else {
                const labels = Object.keys(data.categoryExpenses);
                const values = Object.values(data.categoryExpenses);
                const colors = labels.map(l => categoryColors[l] || '#1565C0');

                this.charts.categoryChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: colors,
                            borderWidth: 2,
                            borderColor: '#ffffff',
                            hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true, font: { family: 'Inter', size: 11 } } },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => ` ${ctx.label}: ${Utils.formatCurrency(ctx.raw)}`
                                }
                            }
                        }
                    }
                });
            }
        }

        // 2. Bar Chart - Monthly Expenses
        const canvasTrend = document.getElementById('trendChart');
        if (canvasTrend) {
            const ctx = canvasTrend.getContext('2d');
            const monthlyObj = data.monthlyExpenses || {};
            const monthlyKeys = Object.keys(monthlyObj);
            
            const labels = monthlyKeys.length > 0 ? monthlyKeys : ['Current Month'];
            const values = monthlyKeys.length > 0 ? Object.values(monthlyObj) : [0];

            this.charts.trendChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Expenses (₹)',
                        data: values,
                        backgroundColor: 'rgba(21, 101, 192, 0.75)',
                        borderColor: '#1565C0',
                        borderWidth: 1.5,
                        borderRadius: 5,
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
            const ctx = canvasEmi.getContext('2d');
            const paidEmis = (App.state.emis || []).filter(e => e.status === 'PAID').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            
            const emiLabels = paidEmis.length > 0 ? paidEmis.map(e => Utils.formatDate(e.dueDate)) : ['Schedule'];
            const emiValues = paidEmis.length > 0 ? paidEmis.map(e => (e.emiAmount || e.amount || 0)) : [0];

            this.charts.emiChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: emiLabels,
                    datasets: [{
                        label: 'EMI Paid (₹)',
                        data: emiValues,
                        fill: true,
                        backgroundColor: 'rgba(46, 125, 50, 0.12)',
                        borderColor: '#2E7D32',
                        borderWidth: 2,
                        tension: 0.3,
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
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:0.75rem;font-size:0.88rem;">No recent expenses recorded</p>';
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
            container.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">Create a loan to get custom AI financial insights.</p>';
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
            if ((App.state.loans || []).length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No active loans or upcoming EMIs.</p>';
            } else {
                container.innerHTML = '<p style="color:var(--secondary);font-weight:600;">🎉 All EMIs paid for your active loan!</p>';
            }
            return;
        }

        const next = pendingEmis[0];
        const loan = (App.state.loans || []).find(l => l.id === next.loanId);
        const loanType = loan ? (loan.loanType || loan.type) : 'Loan';
        const amount = parseFloat(next.emiAmount || next.amount) || 0;

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h4 style="margin-bottom:0.2rem;font-size:0.95rem;">${loanType} – Installment #${next.emiNumber || 1}</h4>
                    <p style="color:var(--text-muted);font-size:0.82rem;">Due Date: ${Utils.formatDate(next.dueDate)}</p>
                </div>
                <div style="text-align:right;">
                    <span style="font-family:'Outfit';font-weight:800;font-size:1.2rem;color:var(--primary);">${Utils.formatCurrency(amount)}</span>
                    <button class="btn btn-sm btn-primary btn-glow mt-1" onclick="App.navigateTo('emi')" style="display:block;margin-left:auto;">
                        Pay Now
                    </button>
                </div>
            </div>
        `;
    }
};

window.DashboardModule = DashboardModule;
