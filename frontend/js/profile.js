const ProfileModule = {
    init() {
        const editForm = document.getElementById('edit-profile-form');
        if (editForm) {
            editForm.addEventListener('submit', this.handleEditSubmit.bind(this));
        }

        const passForm = document.getElementById('password-form');
        if (passForm) {
            passForm.addEventListener('submit', this.handlePasswordSubmit.bind(this));
        }
    },

    render() {
        const user = App.currentUser;
        if (!user) return;

        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const phoneEl = document.getElementById('profile-phone');
        const roleEl = document.getElementById('profile-role');
        const sinceEl = document.getElementById('profile-since');

        if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (phoneEl) phoneEl.textContent = user.phone;
        if (roleEl) roleEl.textContent = user.role.toUpperCase();
        if (sinceEl) sinceEl.textContent = `Member since ${Utils.formatDate(user.createdAt)}`;

        this.renderCreditScore();
        this.renderEligibility();
    },

    renderCreditScore() {
        const score = Utils.getCreditScore(App.currentUser, App.state.loans, App.state.emis);
        
        const scoreEl = document.getElementById('credit-score');
        const labelEl = document.getElementById('credit-label');
        const ringEl = document.getElementById('credit-ring');

        if (scoreEl) scoreEl.textContent = score;
        
        let label = 'Poor';
        let color = '#e74c3c';
        if (score >= 750) {
            label = 'Excellent';
            color = '#2ecc71';
        } else if (score >= 650) {
            label = 'Good';
            color = '#f1c40f';
        } else if (score >= 550) {
            label = 'Average';
            color = '#e67e22';
        }

        if (labelEl) {
            labelEl.textContent = label;
            labelEl.style.color = color;
        }

        if (ringEl) {
            // Circumference of circle with r=40 is ~251.2
            const maxScore = 900;
            const minScore = 300;
            const percentage = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
            const dashoffset = 251.2 - (percentage * 251.2);
            ringEl.style.strokeDashoffset = dashoffset;
            ringEl.style.stroke = color;
        }
    },

    renderEligibility() {
        const container = document.getElementById('eligibility-results');
        if (!container) return;

        const score = Utils.getCreditScore(App.currentUser, App.state.loans, App.state.emis);
        const income = App.currentUser.income || 50000; // Default if not set

        let html = '';
        if (score < 550) {
            html = '<p class="text-danger">Your credit score is too low for loan eligibility. Improve your score by paying EMIs on time.</p>';
        } else {
            const maxPersonal = income * 5;
            const maxHome = income * 50;
            const maxCar = income * 10;

            html = `
                <ul>
                    <li>Personal Loan: Up to ${Utils.formatCurrency(maxPersonal)}</li>
                    <li>Home Loan: Up to ${Utils.formatCurrency(maxHome)}</li>
                    <li>Car Loan: Up to ${Utils.formatCurrency(maxCar)}</li>
                </ul>
            `;
        }

        container.innerHTML = html;
    },

    showEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (!modal) return;
        
        document.getElementById('edit-name').value = App.currentUser.name;
        document.getElementById('edit-email').value = App.currentUser.email;
        document.getElementById('edit-phone').value = App.currentUser.phone;
        
        modal.style.display = 'flex';
    },

    closeEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) modal.style.display = 'none';
    },

    async handleEditSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const phone = document.getElementById('edit-phone').value;

        if (!Utils.validateEmail(email)) {
            Utils.showToast('Invalid email format', 'error');
            return;
        }

        if (!Utils.validatePhone(phone)) {
            Utils.showToast('Invalid phone format', 'error');
            return;
        }

        try {
            const updated = await ApiService.updateProfile({ name, email, phone });
            App.currentUser = updated;
            this.closeEditModal();
            this.render();
            Utils.showToast('Profile updated successfully', 'success');
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    },

    showPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) {
            document.getElementById('password-form').reset();
            modal.style.display = 'flex';
        }
    },

    closePasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.style.display = 'none';
    },

    handlePasswordSubmit(e) {
        e.preventDefault();
        
        const oldPass = document.getElementById('old-password').value;
        const newPass = document.getElementById('new-password').value;
        const confPass = document.getElementById('confirm-password').value;

        if (newPass !== confPass) {
            Utils.showToast('New passwords do not match', 'error');
            return;
        }

        if (newPass.length < 6) {
            Utils.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Mock API call for password change
        setTimeout(() => {
            Utils.showToast('Password changed successfully', 'success');
            this.closePasswordModal();
        }, 500);
    },

    logout() {
        if (confirm('Are you sure you want to log out?')) {
            ApiService.clearToken();
            App.currentUser = null;
            App.state = { loans: [], expenses: [], emis: [], notifications: [] };
            App.navigateTo('splash');
        }
    }
};
window.ProfileModule = ProfileModule;
