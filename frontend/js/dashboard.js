/* =====================================================
   FIN PULSE – Dashboard Module
   Charts, stats, recent activity, and AI tips
   ===================================================== */
const DashboardModule = {
    charts: {},

    render() {
        const data = MockData.getDashboardData();

        // Update stat cards using the correct property names from getDashboardData()
        const el = (id) => document.getElementById(id);
        if (el('dash-total-loan')) el('dash-total-loan').textContent = Utils.formatCurrency(data.totalLoanAmount);
        if (el('dash-utilized')) el('dash-utilized').textContent = Utils.formatCurrency(data.totalUtilizedAmount);
        if (el('dash-balance')) el('dash-balance').textContent = Utils.formatCurrency(data.remainingBalance);
        if (el('dash-emi')) el('dash-emi').textContent = Utils.formatCurrency(data.monthlyEmi);

        this.renderCharts(data);
        this.renderRecentExpenses(data.recentExpenses);
        this.renderAiTips();
        this.renderUpcomingEmi();
    },

    renderCharts(data) {
        // Destroy existing charts to avoid canvas reuse errors
        Object.values(this.charts).forEach(c => { if (c) c.destroy(); });
        this.charts = {};

        // Color palette for categories
        const categoryColors = {
            'EDUCATION': '#1E88E5', 'MEDICAL': '#E53935', 'BUSINESS': '#FB8C00',
            'PERSONAL': '#8E24AA', 'HOME': '#43A047', 'AGRICULTURE': '#00897B', 'OTHER': '#757575'
        };

        // 1. Doughnut chart – spending by category
        const ctxCat = document.getElementById('categoryChart');
        if (ctxCat && data.categoryExpenses) {
            const labels = Object.keys(data.categoryExpenses);
            const values = Object.values(data.categoryExpenses);
            const colors = labels.map(l => categoryColors[l] || '#9E9E9E');

            this.charts.categoryChart = new Chart(ctxCat, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#fff',
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { family: 'Inter', size: 12 } } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${Utils.formatCurrency(ctx.raw)}`
                            }
                        }
                    }
                }
            });
        }

        // 2. Bar chart – monthly expenses
        const ctxTrend = document.getElementById('trendChart');
        if (ctxTrend && data.monthlyExpenses) {
            const labels = Object.keys(data.monthlyExpenses);
            const values = Object.values(data.monthlyExpenses);

            this.charts.trendChart = new Chart(ctxTrend, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Monthly Expenses',
                        data: values,
                        backgroundColor: 'rgba(21, 101, 192, 0.7)',
                        borderColor: '#1565C0',
                        borderWidth: 1,
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

        // 3. Line chart – EMI payments over time
        const ctxEmi = document.getElementById('emiChart');
        if (ctxEmi) {
            const paidEmis = App.state.emis.filter(e => e.status === 'PAID').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            const emiLabels = paidEmis.map(e => Utils.formatDate(e.dueDate));
            const emiValues = paidEmis.map(e => e.emiAmount);

            // If no paid EMIs, show demo data
            const finalLabels = emiLabels.length ? emiLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
            const finalValues = emiValues.length ? emiValues : [10247, 10247, 10247, 10247, 10247];

            this.charts.emiChart = new Chart(ctxEmi, {
                type: 'line',
                data: {
                    labels: finalLabels,
                    datasets: [{
                        label: 'EMI Paid',
                        data: finalValues,
                        fill: true,
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        borderColor: '#2E7D32',
                        borderWidth: 2,
                        tension: 0.4,
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

        if (!expenses || expenses.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem;">No recent expenses</p>';
            return;
        }

        container.innerHTML = expenses.slice(0, 5).map(exp => {
            const emoji = Utils.getCategoryEmoji(exp.category);
            const amount = exp.expenseAmount || exp.amount || 0;
            const name = exp.expenseName || exp.name || 'Expense';
            return `<div class="recent-item"><span>${emoji} ${name}</span><span style="font-weight:600;color:var(--danger)">${Utils.formatCurrency(amount)}</span></div>`;
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

        const pendingEmis = App.state.emis.filter(e => e.status === 'PENDING').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        if (pendingEmis.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);">No upcoming EMIs</p>';
            return;
        }

        const next = pendingEmis[0];
        const loan = App.state.loans.find(l => l.id === next.loanId);
        const loanType = loan ? loan.loanType : 'Loan';

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h4 style="margin-bottom:0.25rem;">${loanType} – EMI #${next.emiNumber}</h4>
                    <p style="color:var(--text-muted);font-size:0.85rem;">Due: ${Utils.formatDate(next.dueDate)}</p>
                </div>
                <div style="text-align:right;">
                    <span style="font-family:'Outfit';font-weight:700;font-size:1.2rem;color:var(--primary);">${Utils.formatCurrency(next.emiAmount)}</span>
                </div>
            </div>
        `;
    }
};
window.DashboardModule = DashboardModule;
