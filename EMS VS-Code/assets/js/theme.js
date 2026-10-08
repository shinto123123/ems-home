/**
 * EMS Theme Management System
 * Handles Dark / Light mode toggling, persistent localStorage storage, and instant dynamic stylesheet injection.
 */

const THEME_KEY = "ems_theme";

// Automatically determine the relative path prefix to assets
function getAssetsPathPrefix() {
    const path = window.location.pathname;
    // If in a subfolder (Admin, HR, manager, Employee, Intern)
    if (path.includes('/Admin/') || path.includes('/HR/') || path.includes('/manager/') || path.includes('/Employee/') || path.includes('/Intern/')) {
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

// Auto-run on script execution
initTheme();

// Ensure body gets the class once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
    });
} else {
    initTheme();
}
