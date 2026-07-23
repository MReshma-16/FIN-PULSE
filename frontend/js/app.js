/* =====================================================
   FIN PULSE – Main Application
   SPA Router, State Management, and Initialization
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

    // ─── Auth-required screens ───────────────────────
    authScreens: ['loan', 'expense', 'emi', 'dashboard', 'reports', 'profile', 'admin', 'notifications'],

    // ─── Public screens ──────────────────────────────
    publicScreens: ['splash', 'register', 'login'],

    /* =====================================================
       INITIALIZATION
       ===================================================== */
    init() {
        console.log('🚀 FIN PULSE Initializing...');

        // Load theme from localStorage
        this.loadTheme();

        // Set up hash-based routing
        window.addEventListener('hashchange', () => this.handleRoute());

        // Set up theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize modules
        if (typeof AuthModule !== 'undefined') AuthModule.init();
        if (typeof LoanModule !== 'undefined') LoanModule.init();
        if (typeof ExpenseModule !== 'undefined') ExpenseModule.init();
        if (typeof ProfileModule !== 'undefined') ProfileModule.init();

        // Load initial data if user is logged in
        if (this.currentUser) {
            this.loadAppData();
        }

        // Handle initial route
        this.handleRoute();

        // Set up confirm modal close handler
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('active');
            }
        });

        console.log('✅ FIN PULSE Ready!');
    },

    /* =====================================================
       ROUTING
       ===================================================== */
    handleRoute() {
        const hash = location.hash.replace('#', '') || 'splash';
        const screen = this.screens.includes(hash) ? hash : 'splash';

        // Auth guard – redirect to splash if not logged in
        if (this.authScreens.includes(screen) && !this.currentUser) {
            location.hash = '#splash';
            return;
        }

        // If logged in and visiting splash/login/register, go to dashboard
        if (this.currentUser && this.publicScreens.includes(screen)) {
            // Allow splash visit but still show header/nav
        }

        this.showScreen(screen);
    },

    /**
     * Show a specific screen and hide all others
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
        });

        // Show target screen
        const target = document.getElementById(`${screenId}-screen`);
        if (target) {
            target.classList.add('active');
        }

        // Toggle header and nav visibility
        const header = document.getElementById('main-header');
        const nav = document.getElementById('bottom-nav');
        const isAuth = this.currentUser !== null;
        const showChrome = isAuth && !this.publicScreens.includes(screenId);

        if (header) header.classList.toggle('hidden', !showChrome);
        if (nav) nav.classList.toggle('hidden', !showChrome);

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            const itemScreen = item.getAttribute('data-screen') || item.getAttribute('href')?.replace('#', '');
            item.classList.toggle('active', itemScreen === screenId);
        });

        // Render screen-specific content
        this.renderScreen(screenId);

        // Scroll to top
        window.scrollTo(0, 0);
    },

    /**
     * Navigate to a screen
     */
    navigateTo(screen) {
        location.hash = `#${screen}`;
    },

    /**
     * Render screen-specific content
     */
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
                // Static screen, nothing to render dynamically
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
       DATA MANAGEMENT
       ===================================================== */

    /**
     * Load all application data (from API or mock)
     */
    async loadAppData() {
        try {
            // Try loading from API first, fall back to mock data
            const loans = await ApiService.getLoans();
            this.state.loans = loans || MockData.loans;

            const expenses = await ApiService.getExpenses();
            this.state.expenses = expenses || MockData.expenses;

            const notifications = await ApiService.getNotifications();
            this.state.notifications = notifications || MockData.notifications;

            // Initialize EMIs from mock if needed
            if (this.state.emis.length === 0) {
                MockData.init();
            }

            // Update notification badge
            if (typeof NotifModule !== 'undefined') NotifModule.updateBadge();

        } catch (err) {
            console.warn('Using mock data:', err.message);
            this.state.loans = MockData.loans;
            this.state.expenses = MockData.expenses;
            this.state.notifications = MockData.notifications;
            MockData.init();
        }
    },

    /**
     * Set current user after login/register
     */
    setUser(userData) {
        this.currentUser = {
            fullName: userData.fullName || userData.name || 'User',
            email: userData.email,
            role: userData.role || 'USER',
            phone: userData.phone || userData.phoneNumber || '9876543210',
            createdAt: userData.createdAt || new Date().toISOString()
        };
        localStorage.setItem('fp_user', JSON.stringify(this.currentUser));
    },

    /**
     * Clear user session (logout)
     */
    clearUser() {
        this.currentUser = null;
        this.state = { loans: [], expenses: [], emis: [], notifications: [] };
        localStorage.removeItem('fp_user');
        ApiService.clearToken();
    }
};

/* =====================================================
   GLOBAL HELPER: Close confirm modal
   ===================================================== */
function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('active');
}

/* =====================================================
   BOOTSTRAP – Start the app when DOM is ready
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally available
window.App = App;
