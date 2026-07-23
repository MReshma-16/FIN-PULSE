const AuthModule = {
    init() {
        const regForm = document.getElementById('register-form');
        const loginForm = document.getElementById('login-form');
        const forgotLink = document.getElementById('forgot-password-link');
        
        if (regForm) {
            regForm.addEventListener('submit', this.handleRegister.bind(this));
        }
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                Utils.showToast('Password reset link sent to your email', 'success');
            });
        }
    },
    
    handleRegister(e) {
        e.preventDefault();
        this.clearErrors();
        
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        
        let isValid = true;
        
        if (!name) {
            this.showError('reg-name', 'Name is required');
            isValid = false;
        }
        if (!Utils.validateEmail(email)) {
            this.showError('reg-email', 'Invalid email format');
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
                const user = ApiService.register({ name, email, phone, password });
                App.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                Utils.showToast('Registration successful', 'success');
                App.navigateTo('loan');
            } catch (err) {
                 Utils.showToast(err.message || 'Registration failed', 'error');
            }
        }
    },
    
    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            Utils.showToast('Please enter email and password', 'error');
            return;
        }
        
        try {
            const user = ApiService.login(email, password);
            App.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            Utils.showToast('Login successful', 'success');
            App.navigateTo('dashboard');
        } catch (err) {
            Utils.showToast(err.message || 'Login failed', 'error');
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
