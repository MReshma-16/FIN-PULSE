/* =====================================================
   FIN PULSE – EMI Management Module
   Clear EMI schedule, payment history, and interactive payment gateway simulation
   ===================================================== */

const EmiModule = {
    currentLoanId: null,
    selectedEmiId: null,

    init() {
        // Modal & payment listeners
    },

    render() {
        const approvedLoans = (App.state.loans || []).filter(l => (l.status || 'APPROVED') === 'APPROVED');
        
        if (!this.currentLoanId && approvedLoans.length > 0) {
            this.currentLoanId = approvedLoans[0].id;
        }

        const loanSelectHeader = document.getElementById('emi-loan-selector');
        if (!loanSelectHeader && approvedLoans.length > 1) {
            const container = document.querySelector('#emi-screen .screen-header');
            if (container) {
                const selectHtml = `
                    <select id="emi-loan-selector" class="filter-select" onchange="EmiModule.changeLoan(this.value)">
                        ${approvedLoans.map(l => `<option value="${l.id}" ${l.id === this.currentLoanId ? 'selected' : ''}>${l.loanType || l.type || 'Loan'} (${Utils.formatCurrency(l.loanAmount || l.amount)})</option>`).join('')}
                    </select>
                `;
                container.insertAdjacentHTML('beforeend', selectHtml);
            }
        }

        let emis = [];
        if (this.currentLoanId) {
            emis = (App.state.emis || []).filter(e => e.loanId === this.currentLoanId);
        } else if (App.state.emis && App.state.emis.length > 0) {
            emis = App.state.emis;
        }

        const totalCount = emis.length;
        const paidCount = emis.filter(e => e.status === 'PAID').length;
        const pendingEmis = emis.filter(e => e.status !== 'PAID').sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date));
        const nextDue = pendingEmis.length > 0 ? pendingEmis[0] : null;

        const outstandingAmount = pendingEmis.reduce((sum, e) => sum + (parseFloat(e.emiAmount || e.amount) || 0), 0);
        const monthlyAmount = emis.length > 0 ? (emis[0].emiAmount || emis[0].amount || 0) : 0;

        const monthlyEl = document.getElementById('emi-monthly');
        if (monthlyEl) monthlyEl.textContent = Utils.formatCurrency(monthlyAmount);

        const nextDueEl = document.getElementById('emi-next-due');
        if (nextDueEl) nextDueEl.textContent = nextDue ? Utils.formatDate(nextDue.dueDate || nextDue.date) : 'All Clear!';

        const paidCountEl = document.getElementById('emi-paid-count');
        if (paidCountEl) paidCountEl.textContent = `${paidCount} of ${totalCount} Paid`;

        const outstandingEl = document.getElementById('emi-outstanding');
        if (outstandingEl) outstandingEl.textContent = Utils.formatCurrency(outstandingAmount);

        this.renderList(emis);
    },

    changeLoan(loanId) {
        this.currentLoanId = loanId;
        this.render();
    },

    renderList(emis) {
        const listEl = document.getElementById('emi-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        if (!emis || emis.length === 0) {
            listEl.innerHTML = '<div class="card glass-card text-center" style="color:var(--text-muted);">No EMI schedule records found. Create an approved loan to generate your EMI schedule.</div>';
            return;
        }

        emis.forEach((emi) => {
            const num = emi.emiNumber || 1;
            const dateStr = Utils.formatDate(emi.dueDate || emi.date);
            const amount = parseFloat(emi.emiAmount || emi.amount) || 0;
            const amountStr = Utils.formatCurrency(amount);
            const status = emi.status || 'PENDING';
            const statusClass = status.toLowerCase();

            let actionBtn = '';
            if (status === 'PENDING' || status === 'OVERDUE') {
                actionBtn = `
                    <button class="btn btn-sm btn-primary btn-glow" onclick="EmiModule.openPayModal('${emi.id}')">
                        <span class="material-icons">payment</span> Pay ${amountStr}
                    </button>
                `;
            } else {
                actionBtn = `
                    <span style="color:var(--secondary);font-weight:600;font-size:0.85rem;display:inline-flex;align-items:center;gap:0.25rem;">
                        <span class="material-icons" style="font-size:1.1rem;">check_circle</span> Paid on ${Utils.formatDate(emi.paidDate)}
                    </span>
                `;
            }

            const item = document.createElement('div');
            item.className = 'emi-item';
            item.innerHTML = `
                <div class="emi-left">
                    <div class="expense-icon" style="background:${status === 'PAID' ? 'var(--secondary-50)' : 'var(--primary-50)'}">
                        <span class="material-icons" style="color:${status === 'PAID' ? 'var(--secondary)' : 'var(--primary)'}">
                            ${status === 'PAID' ? 'task_alt' : 'event_repeat'}
                        </span>
                    </div>
                    <div class="emi-info">
                        <h4>EMI Installment #${num}</h4>
                        <p style="color:var(--text-muted);font-size:0.82rem;">Due Date: ${dateStr}</p>
                    </div>
                </div>
                <div class="emi-right">
                    <span class="badge-status badge-${statusClass}">${status}</span>
                    <span style="font-weight:800;font-size:1.05rem;font-family:'Outfit';">${amountStr}</span>
                    ${actionBtn}
                </div>
            `;
            listEl.appendChild(item);
        });
    },

    openPayModal(emiId) {
        this.selectedEmiId = emiId;
        const emi = (App.state.emis || []).find(e => e.id === emiId);
        if (!emi) return;

        const amount = emi.emiAmount || emi.amount || 0;
        const loan = (App.state.loans || []).find(l => l.id === emi.loanId);
        const loanType = loan ? (loan.loanType || loan.type) : 'Loan';

        const modal = document.getElementById('pay-emi-modal');
        const amountEl = document.getElementById('pay-modal-amount');
        const infoEl = document.getElementById('pay-modal-info');
        const emiIdInput = document.getElementById('pay-emi-id');

        if (amountEl) amountEl.textContent = Utils.formatCurrency(amount);
        if (infoEl) infoEl.textContent = `${loanType} – Installment #${emi.emiNumber || 1} (Due: ${Utils.formatDate(emi.dueDate)})`;
        if (emiIdInput) emiIdInput.value = emiId;

        if (modal) modal.classList.add('active');
    },

    closePayModal() {
        const modal = document.getElementById('pay-emi-modal');
        if (modal) modal.classList.remove('active');
        this.selectedEmiId = null;
    },

    async confirmPayment(e) {
        e.preventDefault();
        if (!this.selectedEmiId) return;

        const emiId = this.selectedEmiId;

        try {
            await ApiService.payEmi(emiId);
            this.closePayModal();
            Utils.showToast('🎉 EMI Payment successful! Notification recorded.', 'success');
            this.render();
        } catch (err) {
            Utils.showToast(err.message || 'Payment processing failed', 'error');
        }
    },

    showHistory() {
        const emis = (App.state.emis || []).filter(e => e.status === 'PAID');
        if (emis.length === 0) {
            Utils.showToast('No paid EMIs in history yet.', 'info');
        } else {
            Utils.showToast(`Displaying ${emis.length} paid EMI transactions`, 'info');
        }
        this.renderList(emis);
    }
};

window.EmiModule = EmiModule;
