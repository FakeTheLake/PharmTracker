/**
 * navigation.js — Tab switching with callback-based section refresh.
 *
 * Components register their refresh logic via registerRefresh().
 * showSection() hides all sections, shows the target, and invokes
 * the registered callback so data is always up-to-date on tab switch.
 */

const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

/** Map of sectionId → refresh callback */
const refreshCallbacks = {};

/** Currently visible section ID */
let activeSection = 'sectionHome';

// ── Public API ─────────────────────────────

/**
 * Register a function to call whenever a section becomes visible.
 * @param {string} sectionId — e.g. 'sectionHome'
 * @param {Function} callback
 */
export function registerRefresh(sectionId, callback) {
    refreshCallbacks[sectionId] = callback;
}

/**
 * Switch the visible section and update nav-button styling.
 * @param {string} id — section element ID
 */
export function showSection(id) {
    // Hide all sections
    sections.forEach(s => s.classList.add('hidden'));

    // Show target
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        activeSection = id;
    }

    // Update nav buttons
    navButtons.forEach(btn => {
        if (btn.dataset.section === id) {
            btn.classList.remove('text-slate-400');
            btn.classList.add('text-emerald-600');
        } else {
            btn.classList.remove('text-emerald-600');
            btn.classList.add('text-slate-400');
        }
    });

    // Run the registered refresh callback
    if (refreshCallbacks[id]) {
        refreshCallbacks[id]();
    }
}

/** Get the ID of the currently active section */
export function getActiveSection() {
    return activeSection;
}

// ── Initialization ─────────────────────────

/** Attach click handlers to all nav buttons */
export function initNavigation() {
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
    });
}
