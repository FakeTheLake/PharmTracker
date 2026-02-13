/**
 * toast.js — Lightweight toast notification system.
 *
 * Depends on DOM elements: #toast, #toastMessage
 */

const toastEl = document.getElementById('toast');
const toastMsgEl = document.getElementById('toastMessage');
let toastTimeout = null;

/**
 * Display a toast message that auto-hides after `duration` ms.
 * @param {string} message — text to show
 * @param {number} [duration=2000] — auto-hide delay in milliseconds
 */
export function showToast(message, duration = 2000) {
    if (toastTimeout) clearTimeout(toastTimeout);

    toastMsgEl.textContent = message;
    toastEl.classList.remove('toast-hide');
    toastEl.classList.add('toast-show');

    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('toast-show');
        toastEl.classList.add('toast-hide');
    }, duration);
}
