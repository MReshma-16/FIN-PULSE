/* =====================================================
   FIN PULSE – User Profile Module
   Manages profile updates, credit score estimation & password changes
   ===================================================== */

const ProfileModule = {
    init() {
        const editForm = document.getElementById('edit-profile-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        const passForm = document.getElementById('password-form');
        if (passForm) {
            passForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }
    },

    render() {
        const user = App.currentUser;
        if (!user) return;

        const fullName = user.fullName || user.name || 'User';
        const email = user.email || 'user@example.com';
        const phone = user.phone || user.phoneNumber || '9876543210';
        const role = user.role || 'USER';
        const createdAt = user.createdAt || new Date().toISOString();

        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const phoneEl = document.getElementById('profile-phone');
        const roleEl = document.getElementById('profile-role');
        const sinceEl = document.getElementById('profile-since');

        if (avatarEl) avatarEl.textContent = fullName.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = fullName;
        if (emailEl) emailEl.textContent = email;
        if (phoneEl) phoneEl.textContent = phone;
        if (roleEl) roleEl.textContent = role.toUpperCase();
        if (sinceEl) sinceEl.textContent = `Member since ${Utils.formatDate(createdAt)}`;

        this.renderCreditScore();
        this.renderEligibility();
    },

    renderCreditScore() {
        const scoreObj = Utils.getCreditScore({
            income: App.currentUser ? App.currentUser.income || 50000 : 50000,
            totalLoan: (App.state.loans || []).reduce((s, l) => s + (l.loanAmount || 0), 0),
            paidEmis: (App.state.emis || []).filter(e => e.status === 'PAID').length,
            totalEmis: (App.state.emis || []).length,
            utilization: 30
        });

        const scoreEl = document.getElementById('credit-score');
        const labelEl = document.getElementById('credit-label');
        const ringEl = document.getElementById('credit-ring');

        if (scoreEl) scoreEl.textContent = scoreObj.score;
        if (labelEl) {
            labelEl.textContent = scoreObj.label;
            labelEl.style.color = scoreObj.color;
        }

        if (ringEl) {
            const circumference = 327; // 2 * PI * 52
            const percentage = Math.max(0, Math.min(1, (scoreObj.score - 300) / 600));
            const dashoffset = circumference - (percentage * circumference);
            ringEl.style.strokeDasharray = `${circumference} ${circumference}`;
            ringEl.style.strokeDashoffset = dashoffset;
            ringEl.style.stroke = scoreObj.color;
        }
    },

    renderEligibility() {
        const container = document.getElementById('eligibility-results');
        if (!container) return;

        const income = 50000; // Base estimate
        const maxPersonal = income * 6;
        const maxHome = income * 50;
        const maxVehicle = income * 10;

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:0.75rem;margin-top:0.75rem;font-size:0.88rem;">
                <div style="background:var(--bg-primary);padding:0.75rem;border-radius:var(--radius);text-align:center;">
                    <span style="display:block;color:var(--text-muted);font-size:0.75rem;">Personal Loan</span>
                    <strong style="color:var(--primary);">${Utils.formatCurrency(maxPersonal)}</strong>
                </div>
                <div style="background:var(--bg-primary);padding:0.75rem;border-radius:var(--radius);text-align:center;">
                    <span style="display:block;color:var(--text-muted);font-size:0.75rem;">Home Loan</span>
                    <strong style="color:var(--secondary);">${Utils.formatCurrency(maxHome)}</strong>
                </div>
                <div style="background:var(--bg-primary);padding:0.75rem;border-radius:var(--radius);text-align:center;">
                    <span style="display:block;color:var(--text-muted);font-size:0.75rem;">Vehicle Loan</span>
                    <strong style="color:var(--accent);">${Utils.formatCurrency(maxVehicle)}</strong>
                </div>
            </div>
        `;
    },

    showEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (!modal) return;

        const user = App.currentUser || {};
        const nameInput = document.getElementById('edit-name');
        const phoneInput = document.getElementById('edit-phone');

        if (nameInput) nameInput.value = user.fullName || user.name || '';
        if (phoneInput) phoneInput.value = user.phone || user.phoneNumber || '';

        modal.classList.add('active');
    },

    closeEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) modal.classList.remove('active');
    },

    async handleEditSubmit(e) {
        e.preventDefault();

        const fullName = document.getElementById('edit-name').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();

        if (!fullName) {
            Utils.showToast('Full name is required', 'error');
            return;
        }

        if (!Utils.validatePhone(phone)) {
            Utils.showToast('Phone number must be exactly 10 digits', 'error');
            return;
        }

        try {
            const updatedData = { fullName, phone };
            await ApiService.updateProfile(updatedData);

            App.currentUser.fullName = fullName;
            App.currentUser.phone = phone;
            localStorage.setItem('fp_user', JSON.stringify(App.currentUser));

            if (typeof UserStorage !== 'undefined') UserStorage.saveData();

            this.closeEditModal();
            this.render();
            Utils.showToast('Profile updated successfully!', 'success');
        } catch (error) {
            Utils.showToast(error.message || 'Failed to update profile', 'error');
        }
    },

    showPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) {
            const passForm = document.getElementById('password-form');
            if (passForm) passForm.reset();
            modal.classList.add('active');
        }
    },

    closePasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.classList.remove('active');
    },

    handlePasswordSubmit(e) {
        e.preventDefault();

        const oldPass = document.getElementById('old-password').value;
        const newPass = document.getElementById('new-password').value;
        const confPass = document.getElementById('confirm-new-password').value;

        if (!oldPass) {
            Utils.showToast('Please enter your current password', 'error');
            return;
        }

        if (newPass.length < 8) {
            Utils.showToast('New password must be at least 8 characters', 'error');
            return;
        }

        if (newPass !== confPass) {
            Utils.showToast('New passwords do not match', 'error');
            return;
        }

        Utils.showToast('Password changed successfully!', 'success');
        this.closePasswordModal();
    },

    logout() {
        if (confirm('Are you sure you want to log out from FIN PULSE?')) {
            App.clearUser();
            Utils.showToast('Logged out successfully', 'info');
            App.navigateTo('splash');
        }
    }
};

window.ProfileModule = ProfileModule;
