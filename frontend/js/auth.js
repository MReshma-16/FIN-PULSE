/* =====================================================
   FIN PULSE – Auth Module
   Handles User Registration and Login with Persistence Sync
   ===================================================== */

const AuthModule = {
    init() {
        const regForm = document.getElementById('register-form');
        const loginForm = document.getElementById('login-form');
        const forgotLink = document.getElementById('forgot-password-link');

        if (regForm) {
            regForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                Utils.showToast('Password reset instructions sent to your email', 'info');
            });
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        this.clearErrors();

        const fullName = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        let isValid = true;

        if (!fullName) {
            this.showError('reg-name', 'Full Name is required');
            isValid = false;
        }
        if (!Utils.validateEmail(email)) {
            this.showError('reg-email', 'Please enter a valid email');
            isValid = false;
        }
        if (!Utils.validatePhone(phone)) {
            this.showError('reg-phone', 'Phone must be exactly 10 digits');
            isValid = false;
        }
        if (password.length < 8) {
            this.showError('reg-password', 'Password must be at least 8 characters');
            isValid = false;
        }
        if (password !== confirm) {
            this.showError('reg-confirm', 'Passwords do not match');
            isValid = false;
        }

        if (isValid) {
            try {
                const userData = await ApiService.register({ fullName, email, phoneNumber: phone, password });
                App.setUser(userData);
                Utils.showToast('Account registered successfully! Welcome to FIN PULSE', 'success');
                App.navigateTo('dashboard');
            } catch (err) {
                Utils.showToast(err.message || 'Registration failed', 'error');
            }
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        this.clearErrors();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        let isValid = true;

        if (!Utils.validateEmail(email)) {
            this.showError('login-email', 'Please enter a valid email');
            isValid = false;
        }
        if (!password) {
            this.showError('login-password', 'Password is required');
            isValid = false;
        }

        if (isValid) {
            try {
                const userData = await ApiService.login({ email, password });
                App.setUser(userData);
                Utils.showToast(`Welcome back, ${userData.fullName}!`, 'success');
                App.navigateTo('dashboard');
            } catch (err) {
                Utils.showToast(err.message || 'Login failed. Check your credentials.', 'error');
            }
        }
    },

    showError(inputId, message) {
        const errorEl = document.getElementById(`${inputId}-error`);
        if (errorEl) {
            errorEl.textContent = message;
        }
        const inputEl = document.getElementById(inputId);
        if (inputEl && inputEl.parentElement) {
            inputEl.parentElement.classList.add('error');
        }
    },

    clearErrors() {
        const errorEls = document.querySelectorAll('[id$="-error"]');
        errorEls.forEach(el => el.textContent = '');
        const inputGroups = document.querySelectorAll('.input-group');
        inputGroups.forEach(el => el.classList.remove('error'));
    }
};

window.AuthModule = AuthModule;
