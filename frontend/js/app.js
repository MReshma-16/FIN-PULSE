/* =====================================================
   FIN PULSE – Main Application Controller
   Strict SPA Router, Auth Guards & Session Management
   ===================================================== */

const App = {
    // ─── Current User State ──────────────────────────
    currentUser: JSON.parse(localStorage.getItem('fp_user')) || null,

    // ─── Application State ───────────────────────────
    state: {
        loans: [],
        expenses: [],
        emis: [],
        notifications: []
    },

    // ─── Screen Registry ─────────────────────────────
    screens: ['splash', 'register', 'login', 'loan', 'expense', 'emi', 'dashboard', 'reports', 'profile', 'admin', 'notifications'],
    publicScreens: ['splash', 'register', 'login'],

    /* =====================================================
       INITIALIZATION
       ===================================================== */
    init() {
        console.log('🚀 FIN PULSE Initializing...');

        this.loadTheme();

        // Router listener
        window.addEventListener('hashchange', () => this.handleRoute());

        // Theme toggle listener
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize auth & management modules
        if (typeof AuthModule !== 'undefined') AuthModule.init();
        if (typeof LoanModule !== 'undefined') LoanModule.init();
        if (typeof ExpenseModule !== 'undefined') ExpenseModule.init();
        if (typeof ProfileModule !== 'undefined') ProfileModule.init();

        // Load user app data if logged in
        if (this.currentUser) {
            this.loadAppData();
        }

        // Handle initial route (if not logged in, go to splash)
        const hash = location.hash.replace('#', '');
        if (!hash) {
            location.hash = this.currentUser ? '#dashboard' : '#splash';
        } else {
            this.handleRoute();
        }

        // Global Modal click handler
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('active');
            }
        });

        console.log('✅ FIN PULSE Ready!');
    },

    /* =====================================================
       ROUTING & UI RENDER (STRICT AUTH GUARDS)
       ===================================================== */
    handleRoute() {
        const hash = location.hash.replace('#', '') || 'splash';
        const screen = this.screens.includes(hash) ? hash : 'splash';

        // STRICT AUTH GUARD: Require login/registration before accessing dashboard, loans, expenses, emi, etc.
        if (!this.publicScreens.includes(screen) && !this.currentUser) {
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Please register or login to access FIN PULSE', 'warning');
            }
            location.hash = '#login';
            return;
        }

        // STRICT ADMIN GUARD: Require ADMIN role for admin panel
        if (screen === 'admin' && this.currentUser && (this.currentUser.role || '').toUpperCase() !== 'ADMIN') {
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Admin access required', 'warning');
            }
            location.hash = '#dashboard';
            return;
        }

        this.showScreen(screen);
    },

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
        });

        // Activate requested screen
        const target = document.getElementById(`${screenId}-screen`);
        if (target) {
            target.classList.add('active');
        }

        // HIDE Header and Navigation completely on Splash, Login, and Register screens
        const header = document.getElementById('main-header');
        const nav = document.getElementById('bottom-nav');
        const isPublic = this.publicScreens.includes(screenId);

        if (header) header.classList.toggle('hidden', isPublic || !this.currentUser);
        if (nav) nav.classList.toggle('hidden', isPublic || !this.currentUser);

        // Highlight Desktop & Mobile Navigation Links
        document.querySelectorAll('.header-nav-link, .nav-item').forEach(item => {
            const itemScreen = item.getAttribute('data-screen') || item.getAttribute('href')?.replace('#', '');
            item.classList.toggle('active', itemScreen === screenId);
        });

        // Trigger Screen Renderers
        this.renderScreen(screenId);
    },

    navigateTo(screen) {
        location.hash = `#${screen}`;
    },

    renderScreen(screenId) {
        switch (screenId) {
            case 'dashboard':
                if (typeof DashboardModule !== 'undefined') DashboardModule.render();
                break;
            case 'loan':
                if (typeof LoanModule !== 'undefined') LoanModule.renderExistingLoans();
                break;
            case 'expense':
                if (typeof ExpenseModule !== 'undefined') ExpenseModule.render();
                break;
            case 'emi':
                if (typeof EmiModule !== 'undefined') EmiModule.render();
                break;
            case 'reports':
                // Static template
                break;
            case 'profile':
                if (typeof ProfileModule !== 'undefined') ProfileModule.render();
                break;
            case 'admin':
                if (typeof AdminModule !== 'undefined') AdminModule.render();
                break;
            case 'notifications':
                if (typeof NotifModule !== 'undefined') NotifModule.render();
                break;
        }
    },

    /* =====================================================
       THEME MANAGEMENT
       ===================================================== */
    loadTheme() {
        const savedTheme = localStorage.getItem('fp_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('fp_theme', next);
        this.updateThemeIcon(next);
    },

    updateThemeIcon(theme) {
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
    },

    /* =====================================================
       USER & DATA MANAGEMENT
       ===================================================== */
    loadAppData() {
        if (typeof UserStorage !== 'undefined') {
            UserStorage.loadData();
        }
        if (typeof NotifModule !== 'undefined') {
            NotifModule.updateBadge();
        }
    },

    setUser(userData) {
        this.currentUser = {
            fullName: userData.fullName || userData.name || 'User Account',
            email: userData.email || 'user@finpulse.com',
            role: (userData.role || 'USER').toUpperCase(),
            phone: userData.phone || userData.phoneNumber || '9876543210',
            createdAt: userData.createdAt || new Date().toISOString()
        };
        localStorage.setItem('fp_user', JSON.stringify(this.currentUser));
        this.loadAppData();
    },

    clearUser() {
        this.currentUser = null;
        this.state = { loans: [], expenses: [], emis: [], notifications: [] };
        localStorage.removeItem('fp_user');
        if (typeof ApiService !== 'undefined') ApiService.clearToken();
        location.hash = '#login';
    }
};

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
