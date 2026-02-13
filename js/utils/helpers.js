/**
 * helpers.js — Pure utility functions (no side effects, no DOM dependencies)
 *
 * Formatting, escaping, parsing, constants.
 */

// ── ID Generation ──────────────────────────

/** Generate a unique identifier: timestamp + random suffix */
export function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ── HTML Safety ────────────────────────────

/** Escape HTML entities to prevent XSS */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── Date Formatting ────────────────────────

/** Format Date → DD.MM.YYYY (Russian locale) */
export function formatDateRu(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${date.getFullYear()}`;
}

/** Format Date → YYYY-MM-DD (ISO for <input type="date">) */
export function formatDateISO(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
}

// ── Date Comparisons ───────────────────────

/** Check if two Date objects fall on the same calendar day */
export function isSameDay(a, b) {
    return (
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear()
    );
}

/** Check if a Date is today */
export function isToday(date) {
    return isSameDay(date, new Date());
}

// ── Russian Number Handling ────────────────

/**
 * Parse a Russian-formatted number (comma as decimal separator).
 * Returns a float or null if invalid / empty.
 */
export function parseRuNum(value) {
    if (!value || !String(value).trim()) return null;
    const num = parseFloat(String(value).trim().replace(',', '.'));
    return isNaN(num) ? null : num;
}

/** Format a number for display with comma as decimal separator */
export function formatRuNum(n) {
    if (n === null || n === undefined) return '';
    return String(n).replace('.', ',');
}

// ── Medication Type Emoji ──────────────────

const TYPE_EMOJI_MAP = {
    'Таблетка': '💊',
    'Капсула': '💊',
    'Капли': '💧',
    'Укол': '💉',
    'Сироп': '🧴',
    'Ингалятор': '🌬️',
    'Порошок': '🧂',
    'Другое': '📦',
};

/** Get an emoji for a medication type */
export function typeEmoji(type) {
    return TYPE_EMOJI_MAP[type] || '💊';
}

// ── Locale Constants ───────────────────────

/** Russian month names (nominative case) */
export const russianMonths = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

/** Russian weekday names (starting with Sunday at index 0) */
export const russianWeekdays = [
    'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
    'Четверг', 'Пятница', 'Суббота',
];
