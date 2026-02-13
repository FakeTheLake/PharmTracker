/**
 * home.js — Home section component.
 *
 * Displays:
 *   · Today's summary (planned / taken / remaining)
 *   · List of currently active medications
 *   · Profile / notification settings
 */

import { safeGetArray, getSettings, saveSettings } from '../utils/storage.js';
import { escapeHtml, typeEmoji, formatDateISO } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { generateDaySchedule } from '../services/schedule.js';
import { registerRefresh } from '../ui/navigation.js';

// ── Render ─────────────────────────────────

/** Refresh the entire home section */
export function renderHomeSection() {
    renderTodayStats();
    renderActiveMeds();
}

/** Update the three stat counters for today */
function renderTodayStats() {
    const todayStr = formatDateISO(new Date());
    const schedule = generateDaySchedule(todayStr);
    const intakes = safeGetArray('medicationIntakes').filter(i => i.date === todayStr);

    const planned   = schedule.length;
    const taken     = intakes.length;
    const remaining = Math.max(0, planned - taken);

    document.getElementById('statPlanned').textContent   = planned;
    document.getElementById('statTaken').textContent      = taken;
    document.getElementById('statRemaining').textContent  = remaining;
}

/** Render the list of currently active medication courses */
function renderActiveMeds() {
    const courses   = safeGetArray('medicationCourses');
    const pkgs      = safeGetArray('medicationPackages');
    const container = document.getElementById('homeActiveMeds');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = courses.filter(c => {
        if (!c.isActive || !c.startDate) return false;
        return new Date(c.startDate + 'T00:00:00') <= today;
    });

    if (active.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Нет активных курсов</p>';
        return;
    }

    let html = '<div class="space-y-2">';
    active.forEach(c => {
        const pkg        = pkgs.find(p => p.id === c.packageId);
        const substance  = c.activeSubstance || c.courseName;
        const emoji      = typeEmoji(pkg?.medicationType);
        const dosageInfo = pkg ? `${pkg.dosageValue} ${pkg.dosageUnit}` : '';

        const schedParts = [];
        if (c.schedule?.morning) schedParts.push('утро');
        if (c.schedule?.day)     schedParts.push('день');
        if (c.schedule?.evening) schedParts.push('вечер');
        if (c.schedule?.night)   schedParts.push('ночь');

        html += `
            <div class="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                <span class="text-lg">${emoji}</span>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-slate-700 text-sm truncate">${escapeHtml(substance)}</div>
                    <div class="text-xs text-slate-400">
                        ${escapeHtml(dosageInfo)}${schedParts.length ? ' · ' + schedParts.join(', ') : ''}
                    </div>
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ── Settings ───────────────────────────────

/** Load saved settings into form fields */
function loadSettings() {
    const s = getSettings();
    const notifEl  = document.getElementById('settingNotifications');
    const timeEl   = document.getElementById('settingDefaultTime');
    const repeatEl = document.getElementById('settingRepeatInterval');

    if (notifEl)  notifEl.checked = s.notificationsEnabled || false;
    if (timeEl)   timeEl.value    = s.defaultTime || '08:00';
    if (repeatEl) repeatEl.value  = s.repeatInterval || '0';
}

/** Save current settings form values to localStorage */
function handleSaveSettings() {
    const settings = {
        notificationsEnabled: document.getElementById('settingNotifications')?.checked || false,
        defaultTime:          document.getElementById('settingDefaultTime')?.value || '08:00',
        repeatInterval:       document.getElementById('settingRepeatInterval')?.value || '0',
    };
    saveSettings(settings);
    showToast('Настройки сохранены ✓');
}

// ── Initialization ─────────────────────────

/**
 * Wire up event listeners and register refresh callback.
 * The "go to today" button emits a custom event that calendar.js handles,
 * avoiding a circular import.
 */
export function initHome() {
    document.getElementById('saveSettingsBtn')?.addEventListener('click', handleSaveSettings);

    document.getElementById('homeGoToTodayBtn')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('pharmtracker:navigate-to-today'));
    });

    loadSettings();
    registerRefresh('sectionHome', renderHomeSection);
}
