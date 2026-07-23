const EmiModule = {
    currentLoanId: null,
    
    init() {
        // Nothing needed initially
    },
    
    render() {
        const approvedLoans = (App.state.loans || []).filter(l => l.status === 'APPROVED');
        if (approvedLoans.length > 0) {
            this.currentLoanId = approvedLoans[0].id;
        } else {
            this.currentLoanId = null;
        }
        
        let emis = [];
        if (this.currentLoanId) {
            emis = (App.state.emis || []).filter(e => e.loanId === this.currentLoanId);
        }
        
        const totalCount = emis.length;
        const paidCount = emis.filter(e => e.status === 'PAID').length;
        const pendingCount = totalCount - paidCount;
        
        const pendingEmis = emis.filter(e => e.status === 'PENDING').sort((a, b) => new Date(a.date) - new Date(b.date));
        const nextDue = pendingEmis.length > 0 ? pendingEmis[0] : null;
        
        const outstandingAmount = pendingEmis.reduce((sum, e) => sum + e.amount, 0);
        const monthlyAmount = emis.length > 0 ? emis[0].amount : 0;
        
        const monthlyEl = document.getElementById('emi-monthly');
        if (monthlyEl) monthlyEl.textContent = Utils.formatCurrency(monthlyAmount);
        
        const nextDueEl = document.getElementById('emi-next-due');
        if (nextDueEl) nextDueEl.textContent = nextDue ? Utils.formatDate(nextDue.date) : 'N/A';
        
        const paidCountEl = document.getElementById('emi-paid-count');
        if (paidCountEl) paidCountEl.textContent = `${paidCount}/${totalCount}`;
        
        const outstandingEl = document.getElementById('emi-outstanding');
        if (outstandingEl) outstandingEl.textContent = Utils.formatCurrency(outstandingAmount);
        
        this.renderList(emis);
    },
    
    renderList(emis) {
        const listEl = document.getElementById('emi-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        
        if (emis.length === 0) {
            listEl.innerHTML = '<p class="text-center">No EMIs found</p>';
            return;
        }
        
        emis.forEach((emi, index) => {
            const dateStr = Utils.formatDate(emi.date);
            const amountStr = Utils.formatCurrency(emi.amount);
            const statusClass = emi.status.toLowerCase();
            
            let btnHtml = '';
            if (emi.status === 'PENDING') {
                btnHtml = `<button class="btn btn-sm btn-success" onclick="EmiModule.payEmi('${emi.id}')">Pay</button>`;
            }
            
            const item = document.createElement('div');
            item.className = 'emi-item';
            item.innerHTML = `
                <div class="emi-left">
                    <div class="emi-info">
                        <h4>EMI #${index + 1}</h4>
                        <p>Due: ${dateStr}</p>
                    </div>
                </div>
                <div class="emi-right">
                    <span class="badge badge-${statusClass}">${emi.status}</span>
                    <span>${amountStr}</span>
                    ${btnHtml}
                </div>
            `;
            listEl.appendChild(item);
        });
    },
    
    payEmi(id) {
        try {
            ApiService.payEmi(id);
            Utils.showToast('EMI paid successfully', 'success');
            
            this.render();
        } catch (err) {
            Utils.showToast(err.message || 'Failed to pay EMI', 'error');
        }
    },
    
    showHistory() {
        const emis = (App.state.emis || []).filter(e => e.loanId === this.currentLoanId && e.status === 'PAID');
        Utils.showToast(`Showing ${emis.length} paid EMIs in history.`, 'info');
        this.renderList(emis);
    }
};
window.EmiModule = EmiModule;
