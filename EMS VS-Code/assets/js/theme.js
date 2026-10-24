/**
 * EMS Theme Management System
 * Handles Dark / Light mode toggling, persistent localStorage storage, and instant dynamic stylesheet injection.
 */

const THEME_KEY = "ems_theme";

// Automatically determine the relative path prefix to assets
function getAssetsPathPrefix() {
    const path = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    // If in a subfolder (Admin, HR, manager, Employee, Intern)
    if (path.includes('/admin/') || path.includes('/hr/') || path.includes('/manager/') || path.includes('/employee/') || path.includes('/intern/')) {
        return '../assets/';
    }
    return './assets/';
}

// Injects the theme stylesheet into <head> if not already loaded
function ensureThemeStylesheet() {
    if (document.getElementById('ems-theme-stylesheet')) return;
    const link = document.createElement('link');
    link.id = 'ems-theme-stylesheet';
    link.rel = 'stylesheet';
    link.href = getAssetsPathPrefix() + 'css/theme.css';
    document.head.appendChild(link);
}

/**
 * Returns current theme ('dark' | 'light')
 */
export function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}

/**
 * Sets theme ('dark' | 'light') and applies it across the DOM immediately
 */
export function setTheme(mode) {
    const validTheme = mode === 'light' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, validTheme);

    ensureThemeStylesheet();

    if (validTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.setAttribute('data-theme', 'light');
        if (document.body) {
            document.body.classList.add('light-theme');
        }
    } else {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
        if (document.body) {
            document.body.classList.remove('light-theme');
        }
    }

    // Dispatch event so any custom listeners can update their UI if needed
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: validTheme } }));
}

/**
 * Toggles between dark and light themes
 */
export function toggleTheme() {
    const current = getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
    return next;
}

/**
 * Initializes theme on page load (runs immediately to prevent flicker)
 */
export function initTheme() {
    ensureThemeStylesheet();
    const current = getTheme();
    setTheme(current);
}

/**
 * Initializes responsive mobile navigation & off-canvas drawer across all dashboards
 */
export function initMobileNavigation() {
    if (typeof window === 'undefined') return;

    // 1. Create mobile backdrop if not present
    let backdrop = document.getElementById('emsMobileSidebarBackdrop');
    if (!backdrop && document.body) {
        backdrop = document.createElement('div');
        backdrop.id = 'emsMobileSidebarBackdrop';
        backdrop.className = 'ems-mobile-backdrop';
        document.body.appendChild(backdrop);
    }

    const closeSidebar = () => {
        const sidebars = document.querySelectorAll('.sidebar, [id$="Sidebar"], aside.sidebar');
        sidebars.forEach(s => s.classList.remove('mobile-open'));
        if (backdrop) backdrop.classList.remove('active');
        if (document.body) document.body.classList.remove('mobile-nav-active');
    };

    if (backdrop && !backdrop.dataset.attached) {
        backdrop.dataset.attached = "true";
        backdrop.addEventListener('click', closeSidebar);
    }

    // 2. Wire up hamburger buttons
    const hamburgers = document.querySelectorAll('.hamburger, #hamburgerToggle, #sidebarToggle, [id*="hamburger"], [id*="sidebarToggle"]');
    hamburgers.forEach(btn => {
        if (btn.dataset.mobileAttached) return;
        btn.dataset.mobileAttached = "true";

        btn.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.stopPropagation();
                const sidebar = document.querySelector('.sidebar, [id$="Sidebar"], aside.sidebar');
                if (sidebar) {
                    const isOpen = sidebar.classList.contains('mobile-open');
                    if (isOpen) {
                        closeSidebar();
                    } else {
                        sidebar.classList.add('mobile-open');
                        if (backdrop) backdrop.classList.add('active');
                        if (document.body) document.body.classList.add('mobile-nav-active');
                    }
                }
            }
        });
    });

    // 3. Close when any link inside sidebar is tapped
    const sidebarLinks = document.querySelectorAll('.sidebar a, [id$="Sidebar"] a');
    sidebarLinks.forEach(link => {
        if (!link.dataset.mobileCloseAttached) {
            link.dataset.mobileCloseAttached = "true";
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        }
    });

    // 4. Ensure data tables have mobile horizontal scrolling container
    document.querySelectorAll('table').forEach(tbl => {
        const parent = tbl.parentElement;
        if (parent && !parent.classList.contains('table-container') && !parent.classList.contains('table-wrap') && !parent.classList.contains('table-responsive')) {
            parent.style.overflowX = 'auto';
            parent.style.webkitOverflowScrolling = 'touch';
            parent.style.maxWidth = '100%';
        }
    });
}

// Auto-run theme initialization
initTheme();

// Ensure body gets theme class and mobile navigation once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initMobileNavigation();
    });
} else {
    initTheme();
    initMobileNavigation();
}
