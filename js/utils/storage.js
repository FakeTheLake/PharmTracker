/**
 * storage.js — localStorage wrapper with safe read/write and error handling.
 *
 * All data keys:
 *   medicationPackages  — array of package objects
 *   medicationCourses   — array of course objects
 *   medicationIntakes   — array of intake records
 *   userSettings        — settings object
 */

const ARRAY_KEYS = ['medicationPackages', 'medicationCourses', 'medicationIntakes'];

// ── Initialization ─────────────────────────

/** Create empty arrays / objects for any missing localStorage keys */
export function initLocalStorage() {
    ARRAY_KEYS.forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify([]));
        }
    });
    if (!localStorage.getItem('userSettings')) {
        localStorage.setItem('userSettings', JSON.stringify({}));
    }
}

// ── Array CRUD ─────────────────────────────

/** Safely read a JSON array from localStorage (always returns []) */
export function safeGetArray(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Write an array to localStorage */
export function saveArray(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ── Settings ───────────────────────────────

/** Read the user-settings object (always returns {}) */
export function getSettings() {
    try {
        const data = JSON.parse(localStorage.getItem('userSettings'));
        return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    } catch {
        return {};
    }
}

/** Persist the settings object */
export function saveSettings(settings) {
    localStorage.setItem('userSettings', JSON.stringify(settings));
}
