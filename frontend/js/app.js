/* =====================================================
   FIN PULSE – Main Application Controller
   SPA Router, State Management, and Seamless Navigation
   ===================================================== */

const App = {
    // ─── Current User State (Default Active Session so all pages work) ──────────────────────────
    currentUser: JSON.parse(localStorage.getItem('fp_user')) || {
        fullName: 'User Account',
        email: 'user@finpulse.com',
        role: 'ADMIN',
        phone: '9876543210',
        createdAt: new Date().toISOString()
    },

    // ─── Application State ───────────────────────────
    state: {
        loans: [],
        expenses: [],
        emis: [],
        notifications: []
    },

    // ─── Screen Registry ─────────────────────────────
    screens: ['splash', 'register', 'login', 'loan', 'expense', 'emi', 'dashboard', 'reports', 'profile', 'admin', 'notifications'],

    /* =====================================================
       INITIALIZATION
       ===================================================== */
    init() {
        console.log('🚀 FIN PULSE Initializing...');

        // Ensure user session is persisted
        if (!localStorage.getItem('fp_user')) {
            localStorage.setItem('fp_user', JSON.stringify(this.currentUser));
        }

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

        // Load data
        this.loadAppData();

        // Handle initial route (default to dashboard if on splash or empty hash)
        const hash = location.hash.replace('#', '');
        if (!hash || hash === 'splash') {
            location.hash = '#dashboard';
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
       ROUTING & UI RENDER (ALL PAGES ALWAYS WORK)
       ===================================================== */
    handleRoute() {
        const hash = location.hash.replace('#', '') || 'dashboard';
        const screen = this.screens.includes(hash) ? hash : 'dashboard';
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

        // Show Header and Navigation Bar
        const header = document.getElementById('main-header');
        const nav = document.getElementById('bottom-nav');

        if (header) header.classList.remove('hidden');
        if (nav) nav.classList.remove('hidden');

        // Ensure Admin Link is visible in Desktop Nav
        const adminNavLink = document.querySelector('.admin-nav-item');
        if (adminNavLink) {
            adminNavLink.classList.remove('hidden');
        }

        // Highlight Active Desktop & Mobile Navigation Links
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
            role: userData.role || 'ADMIN',
            phone: userData.phone || userData.phoneNumber || '9876543210',
            createdAt: userData.createdAt || new Date().toISOString()
        };
        localStorage.setItem('fp_user', JSON.stringify(this.currentUser));
        this.loadAppData();
    },

    clearUser() {
        this.currentUser = {
            fullName: 'Guest User',
            email: 'guest@finpulse.com',
            role: 'USER',
            phone: '9876543210',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('fp_user', JSON.stringify(this.currentUser));
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
