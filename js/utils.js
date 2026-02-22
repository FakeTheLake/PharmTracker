import { APP_CONFIG } from './config.js';

export function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Storage Save Error:', e);
        showToast(APP_CONFIG.LABELS.MESSAGES.ERROR, 'error');
        return false;
    }
}

export function getData(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error('Storage Read Error:', e);
        return [];
    }
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass = type === 'error' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-teal-100 text-teal-800 border-teal-200';
    
    toast.className = `${colorClass} px-4 py-2 rounded-lg shadow-md border text-sm font-medium toast-enter pointer-events-auto`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

export function parseDecimal(str) {
    if (!str) return 0;
    // Replace comma with dot
    const cleanStr = String(str).replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat(APP_CONFIG.LANG).format(date);
    } catch (e) {
        return dateStr;
    }
}