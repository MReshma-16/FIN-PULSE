/* =====================================================
   FIN PULSE – Main Application Controller
   SPA Router, State Management, and User Data Sync
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
    authScreens: ['loan', 'expense', 'emi', 'dashboard', 'reports', 'profile', 'admin', 'notifications'],
    publicScreens: ['splash', 'register', 'login'],

    /* =====================================================
       INITIALIZATION
       ===================================================== */
    init() {
        console.log('🚀 FIN PULSE Initializing...');

        this.loadTheme();

        // Router
        window.addEventListener('hashchange', () => this.handleRoute());

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize modules
        if (typeof AuthModule !== 'undefined') AuthModule.init();
        if (typeof LoanModule !== 'undefined') LoanModule.init();
        if (typeof ExpenseModule !== 'undefined') ExpenseModule.init();
        if (typeof ProfileModule !== 'undefined') ProfileModule.init();

        // Load logged in user data
        if (this.currentUser) {
            this.loadAppData();
        }

        // Handle route
        this.handleRoute();

        // Global Modal click handler
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('active');
            }
        });

        console.log('✅ FIN PULSE Ready!');
    },

    /* =====================================================
       ROUTING & UI RENDER
       ===================================================== */
    handleRoute() {
        const hash = location.hash.replace('#', '') || 'splash';
        const screen = this.screens.includes(hash) ? hash : 'splash';

        // Guard: redirect to splash if trying to view protected screen without user
        if (this.authScreens.includes(screen) && !this.currentUser) {
            location.hash = '#splash';
            return;
        }

        // Guard: admin screen check
        if (screen === 'admin' && this.currentUser && this.currentUser.role !== 'ADMIN') {
            Utils.showToast('Admin access required', 'warning');
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

        // Show/Hide Header and Nav bars
        const header = document.getElementById('main-header');
        const nav = document.getElementById('bottom-nav');
        const isAuth = this.currentUser !== null;
        const showChrome = isAuth && !this.publicScreens.includes(screenId);

        if (header) header.classList.toggle('hidden', !showChrome);
        if (nav) nav.classList.toggle('hidden', !showChrome);

        // Toggle Admin Link in Desktop Nav
        const adminNavLink = document.querySelector('.admin-nav-item');
        if (adminNavLink) {
            adminNavLink.classList.toggle('hidden', !this.currentUser || this.currentUser.role !== 'ADMIN');
        }

        // Highlight Desktop & Mobile Active Links
        document.querySelectorAll('.header-nav-link, .nav-item').forEach(item => {
            const itemScreen = item.getAttribute('data-screen') || item.getAttribute('href')?.replace('#', '');
            item.classList.toggle('active', itemScreen === screenId);
        });

        // Trigger Screen Renderers
        this.renderScreen(screenId);

        window.scrollTo(0, 0);
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
    async loadAppData() {
        if (!this.currentUser) return;
        UserStorage.loadData();
        if (typeof NotifModule !== 'undefined') NotifModule.updateBadge();
    },

    setUser(userData) {
        this.currentUser = {
            fullName: userData.fullName || userData.name || 'User',
            email: userData.email,
            role: userData.role || 'USER',
            phone: userData.phone || userData.phoneNumber || '9876543210',
            createdAt: userData.createdAt || new Date().toISOString()
        };
        localStorage.setItem('fp_user', JSON.stringify(this.currentUser));
        // Load data specific to this user
        this.loadAppData();
    },

    clearUser() {
        this.currentUser = null;
        this.state = { loans: [], expenses: [], emis: [], notifications: [] };
        localStorage.removeItem('fp_user');
        ApiService.clearToken();
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
