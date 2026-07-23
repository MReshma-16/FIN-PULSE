const ReportsModule = {
    exportPDF(type) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            Utils.showToast('PDF export library not loaded', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let title = '';
        if (type === 'loan') title = 'Loan Summary Report';
        else if (type === 'expense') title = 'Expense Report';
        else if (type === 'emi') title = 'EMI Payment Report';
        else if (type === 'monthly') title = 'Monthly Spending Breakdown';
        else if (type === 'utilization') title = 'Utilization Summary';
        else title = 'Report';

        doc.setFontSize(18);
        doc.text(`FIN PULSE - ${title}`, 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated on: ${Utils.formatDate(Utils.todayStr())}`, 14, 30);

        const data = this.getReportData(type);
        if (!data || data.length === 0) {
            Utils.showToast('No data available for report', 'error');
            return;
        }

        const headers = Object.keys(data[0]);
        const rows = data.map(obj => Object.values(obj));

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`finpulse_${type}_report.pdf`);
        Utils.showToast('PDF exported successfully', 'success');
    },

    exportExcel(type) {
        if (!window.XLSX) {
            Utils.showToast('Excel export library not loaded', 'error');
            return;
        }

        const data = this.getReportData(type);
        if (!data || data.length === 0) {
            Utils.showToast('No data available for report', 'error');
            return;
        }

        const ws = window.XLSX.utils.json_to_sheet(data);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'Report');
        window.XLSX.writeFile(wb, `finpulse_${type}_report.xlsx`);
        Utils.showToast('Excel exported successfully', 'success');
    },

    getReportData(type) {
        if (type === 'loan') {
            return App.state.loans.map(l => ({
                'Loan ID': l.id,
                'Type': l.type,
                'Amount': l.amount,
                'Interest Rate (%)': l.interestRate,
                'Tenure (Months)': l.tenure,
                'Status': l.status,
                'Applied On': Utils.formatDate(l.createdAt)
            }));
        } else if (type === 'expense') {
            return App.state.expenses.map(e => ({
                'Expense Name': e.name,
                'Category': e.category,
                'Amount': e.amount,
                'Date': Utils.formatDate(e.date)
            }));
        } else if (type === 'emi') {
            return App.state.emis.map(e => ({
                'EMI No': e.emiNumber,
                'Loan ID': e.loanId,
                'Amount': e.amount,
                'Due Date': Utils.formatDate(e.dueDate),
                'Status': e.status
            }));
        } else if (type === 'monthly' || type === 'utilization') {
            return App.state.expenses.map(e => ({
                'Category': e.category,
                'Amount': e.amount,
                'Date': Utils.formatDate(e.date)
            }));
        }
        return [];
    }
};
window.ReportsModule = ReportsModule;
