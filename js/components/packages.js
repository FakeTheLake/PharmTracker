/**
 * packages.js — Package CRUD component.
 *
 * Handles:
 *   · Collapsible package creation form
 *   · Auto-fill display name
 *   · Clear-field icons
 *   · Validation, save, edit, delete
 *   · Package list rendering
 *   · "Create course" bridge to courses.js
 */

import { safeGetArray, saveArray } from '../utils/storage.js';
import { generateId, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { showSection, registerRefresh } from '../ui/navigation.js';
import { prefillCourseFromPackage, populatePackageSelect } from './courses.js';

// ── DOM References ─────────────────────────

const toggleFormBtn   = document.getElementById('togglePackageFormBtn');
const toggleFormIcon  = document.getElementById('togglePackageFormIcon');
const toggleFormText  = document.getElementById('togglePackageFormText');
const formContainer   = document.getElementById('packageFormContainer');
const addPackageForm  = document.getElementById('addPackageForm');
const savePackageBtn  = document.getElementById('savePackageBtn');
const autoFillBtn     = document.getElementById('autoFillDisplayNameBtn');
const formTitle       = document.getElementById('packageFormTitle');
const listContainer   = document.getElementById('packageListContainer');

/** Shorthand map of form field references */
const F = {
    tradeName:        document.getElementById('packageTradeName'),
    quantity:         document.getElementById('packageQuantity'),
    dosageValue:      document.getElementById('packageDosageValue'),
    dosageUnit:       document.getElementById('packageDosageUnit'),
    type:             document.getElementById('packageType'),
    activeIngredient: document.getElementById('packageActiveIngredient'),
    displayName:      document.getElementById('packageDisplayName'),
    indications:      document.getElementById('packageIndications'),
    comment:          document.getElementById('packageComment'),
    rdaPercent:       document.getElementById('packageRdaPercent'),
};

/** Error message elements for required fields */
const ERR = {
    tradeName:    document.getElementById('errorTradeName'),
    quantity:     document.getElementById('errorQuantity'),
    dosageValue:  document.getElementById('errorDosageValue'),
    dosageUnit:   document.getElementById('errorDosageUnit'),
    type:         document.getElementById('errorType'),
};

// ── State ──────────────────────────────────

let isFormVisible   = false;
let editingPackageId = null;

// ── Toggle Form ────────────────────────────

function toggleForm() {
    isFormVisible = !isFormVisible;

    if (isFormVisible) {
        formContainer.classList.remove('hidden');
        toggleFormText.textContent = 'Скрыть форму';
        toggleFormIcon.innerHTML =
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
        toggleFormBtn.classList.replace('bg-emerald-500',      'bg-slate-500');
        toggleFormBtn.classList.replace('hover:bg-emerald-600','hover:bg-slate-600');
        toggleFormBtn.classList.replace('active:bg-emerald-700','active:bg-slate-700');
    } else {
        formContainer.classList.add('hidden');
        toggleFormText.textContent = 'Добавить упаковку';
        toggleFormIcon.innerHTML =
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>';
        toggleFormBtn.classList.replace('bg-slate-500',       'bg-emerald-500');
        toggleFormBtn.classList.replace('hover:bg-slate-600', 'hover:bg-emerald-600');
        toggleFormBtn.classList.replace('active:bg-slate-700','active:bg-emerald-700');
    }
}

// ── Validation ─────────────────────────────

function validateForm() {
    const ok =
        F.tradeName.value.trim().length > 0 &&
        parseFloat(F.quantity.value) > 0 &&
        F.dosageValue.value.trim().length > 0 && parseFloat(F.dosageValue.value) > 0 &&
        F.dosageUnit.value !== '' &&
        F.type.value !== '';
    savePackageBtn.disabled = !ok;
    return ok;
}

function validateWithErrors() {
    let ok = true;
    Object.values(ERR).forEach(e => e.classList.add('hidden'));

    if (!F.tradeName.value.trim())              { ERR.tradeName.classList.remove('hidden');   ok = false; }
    if (!(parseFloat(F.quantity.value) > 0))    { ERR.quantity.classList.remove('hidden');    ok = false; }
    if (!(parseFloat(F.dosageValue.value) > 0)) { ERR.dosageValue.classList.remove('hidden'); ok = false; }
    if (!F.dosageUnit.value)                    { ERR.dosageUnit.classList.remove('hidden');  ok = false; }
    if (!F.type.value)                          { ERR.type.classList.remove('hidden');        ok = false; }

    return ok;
}

// ── Auto-Fill Display Name ─────────────────

function canAutoFill() {
    return (
        !F.displayName.value.trim() &&
        F.tradeName.value.trim() &&
        parseFloat(F.quantity.value) > 0 &&
        parseFloat(F.dosageValue.value) > 0 &&
        F.dosageUnit.value
    );
}

function updateAutoFillBtn() {
    autoFillBtn.disabled = !canAutoFill();
}

function generateDisplayName() {
    let name = `${F.tradeName.value.trim()} ${F.dosageValue.value.trim()} ${F.dosageUnit.value} ${F.quantity.value} шт.`;
    const activeIng = F.activeIngredient.value.trim();
    if (activeIng) name += ` (${activeIng})`;
    return name;
}

function autoFillDisplayName() {
    if (canAutoFill()) {
        F.displayName.value = generateDisplayName();
        F.displayName.dispatchEvent(new Event('input'));
        updateAutoFillBtn();
        showToast('Название сгенерировано');
    }
}

// ── Clear-Field Icons ──────────────────────

function updateClearBtn(field) {
    const btn = document.querySelector(`[data-clear-field="${field.id}"]`);
    if (btn) btn.classList.toggle('hidden', field.value.length === 0);
}

// ── Reset Form ─────────────────────────────

function resetForm() {
    addPackageForm.reset();
    Object.values(ERR).forEach(e => e.classList.add('hidden'));
    document.querySelectorAll('.clear-field-btn').forEach(b => b.classList.add('hidden'));

    editingPackageId = null;
    formTitle.innerHTML = '<span class="text-xl">📦</span> Новая упаковка';
    savePackageBtn.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Сохранить упаковку';
    validateForm();
    updateAutoFillBtn();
}

// ── Save / Update ──────────────────────────

function savePackage() {
    if (!validateWithErrors()) return;

    const data = {
        id:              editingPackageId || generateId(),
        tradeName:       F.tradeName.value.trim(),
        quantity:        parseInt(F.quantity.value, 10),
        currentQuantity: parseInt(F.quantity.value, 10),
        dosageValue:     F.dosageValue.value.trim(),
        dosageUnit:      F.dosageUnit.value,
        medicationType:  F.type.value,
        activeIngredient:F.activeIngredient.value.trim(),
        displayName:     F.displayName.value.trim() || generateDisplayName(),
        indications:     F.indications.value.trim(),
        comment:         F.comment.value.trim(),
        rdaPercent:      F.rdaPercent.value.trim(),
        createdAt:       new Date().toISOString(),
    };

    let pkgs = safeGetArray('medicationPackages');

    if (editingPackageId) {
        const idx = pkgs.findIndex(p => p.id === editingPackageId);
        if (idx !== -1) {
            data.currentQuantity = pkgs[idx].currentQuantity ?? data.quantity;
            data.createdAt       = pkgs[idx].createdAt;
            pkgs[idx] = data;
        }
        showToast('Упаковка обновлена ✓');
    } else {
        pkgs.push(data);
        showToast('Упаковка сохранена ✓');
    }

    saveArray('medicationPackages', pkgs);
    resetForm();
    renderPackageList();
}

// ── Edit ───────────────────────────────────

function editPackage(id) {
    const pkg = safeGetArray('medicationPackages').find(p => p.id === id);
    if (!pkg) { showToast('Упаковка не найдена'); return; }

    editingPackageId = id;
    if (!isFormVisible) toggleForm();
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Populate fields
    F.tradeName.value        = pkg.tradeName || '';
    F.quantity.value          = pkg.quantity || '';
    F.dosageValue.value       = pkg.dosageValue || '';
    F.dosageUnit.value        = pkg.dosageUnit || '';
    F.type.value              = pkg.medicationType || '';
    F.activeIngredient.value  = pkg.activeIngredient || '';
    F.displayName.value       = pkg.displayName || '';
    F.indications.value       = pkg.indications || '';
    F.comment.value           = pkg.comment || '';
    F.rdaPercent.value        = pkg.rdaPercent || '';

    [F.tradeName, F.activeIngredient, F.displayName].forEach(updateClearBtn);

    formTitle.innerHTML = '<span class="text-xl">✏️</span> Редактирование упаковки';
    savePackageBtn.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> Обновить';
    validateForm();
    updateAutoFillBtn();
}

// ── Delete ──────────────────────────────────

function deletePackage(id) {
    if (!confirm('Удалить упаковку?')) return;
    const pkgs = safeGetArray('medicationPackages').filter(p => p.id !== id);
    saveArray('medicationPackages', pkgs);
    if (editingPackageId === id) resetForm();
    renderPackageList();
    showToast('Упаковка удалена');
}

// ── Create Course Bridge ───────────────────

function createCourseFromPackage(pkgId) {
    showSection('sectionCourses');
    prefillCourseFromPackage(pkgId);
}

// ── Render Package List ────────────────────

export function renderPackageList() {
    const pkgs = safeGetArray('medicationPackages');

    // Also update the course package select dropdown
    populatePackageSelect();

    listContainer.innerHTML = '';

    if (pkgs.length === 0) {
        listContainer.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                </div>
                <h2 class="text-lg font-medium text-slate-700 mb-2">Список упаковок пуст</h2>
                <p class="text-sm text-slate-400">Добавьте первую упаковку</p>
            </div>`;
        return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-2';
    header.innerHTML = `
        <h3 class="text-sm font-medium text-slate-500">Сохранённые упаковки</h3>
        <span class="text-xs text-slate-400">${pkgs.length} шт.</span>`;
    listContainer.appendChild(header);

    pkgs.forEach(pkg => {
        const dn = pkg.displayName || `${pkg.tradeName} ${pkg.dosageValue} ${pkg.dosageUnit} ${pkg.quantity} шт.`;

        let optionalInfo = '';
        if (pkg.activeIngredient) {
            optionalInfo += `<div class="text-xs text-slate-500"><span class="text-slate-400">Действ. вещество:</span> ${escapeHtml(pkg.activeIngredient)}</div>`;
        }
        if (pkg.indications) {
            optionalInfo += `<div class="text-xs text-slate-500"><span class="text-slate-400">Показания:</span> ${escapeHtml(pkg.indications)}</div>`;
        }
        if (pkg.comment) {
            optionalInfo += `<div class="text-xs text-slate-500"><span class="text-slate-400">Комментарий:</span> ${escapeHtml(pkg.comment)}</div>`;
        }

        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3';
        card.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <h4 class="font-semibold text-slate-700 text-base leading-tight">${escapeHtml(dn)}</h4>
                <span class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    ${escapeHtml(pkg.medicationType)}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Торговое</span>
                    <span class="text-slate-700 font-medium">${escapeHtml(pkg.tradeName)}</span>
                </div>
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Дозировка</span>
                    <span class="text-slate-700 font-medium">${escapeHtml(pkg.dosageValue)} ${escapeHtml(pkg.dosageUnit)}</span>
                </div>
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">В упаковке</span>
                    <span class="text-slate-700 font-medium">${pkg.quantity} шт.</span>
                </div>
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Осталось</span>
                    <span class="text-slate-700 font-medium">${pkg.currentQuantity ?? pkg.quantity} шт.</span>
                </div>
            </div>
            ${optionalInfo ? `<div class="space-y-1 pt-1 border-t border-slate-100">${optionalInfo}</div>` : ''}
            <div class="flex gap-2 pt-2 border-t border-slate-100">
                <button class="pkg-edit flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    ✏️ Редактировать
                </button>
                <button class="pkg-del flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    🗑 Удалить
                </button>
            </div>
            <button class="pkg-course w-full px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                ➕ Создать курс
            </button>`;

        card.querySelector('.pkg-edit').addEventListener('click', () => editPackage(pkg.id));
        card.querySelector('.pkg-del').addEventListener('click', () => deletePackage(pkg.id));
        card.querySelector('.pkg-course').addEventListener('click', () => createCourseFromPackage(pkg.id));
        listContainer.appendChild(card);
    });
}

// ── Initialization ─────────────────────────

export function initPackageForm() {
    toggleFormBtn.addEventListener('click', toggleForm);
    addPackageForm.addEventListener('submit', e => { e.preventDefault(); savePackage(); });
    autoFillBtn.addEventListener('click', autoFillDisplayName);

    // Clear-field buttons
    document.querySelectorAll('.clear-field-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = document.getElementById(btn.dataset.clearField);
            if (field) {
                field.value = '';
                field.dispatchEvent(new Event('input'));
                btn.classList.add('hidden');
                field.focus();
            }
        });
    });

    // Show/hide clear icons
    [F.tradeName, F.activeIngredient, F.displayName].forEach(f =>
        f.addEventListener('input', () => updateClearBtn(f))
    );

    // Validation listeners
    [F.tradeName, F.quantity, F.dosageValue, F.dosageUnit, F.type].forEach(f => {
        f.addEventListener('input',  () => { validateForm(); updateAutoFillBtn(); });
        f.addEventListener('change', () => { validateForm(); updateAutoFillBtn(); });
    });
    F.displayName.addEventListener('input', updateAutoFillBtn);
    F.activeIngredient.addEventListener('input', updateAutoFillBtn);

    // Register refresh callback
    registerRefresh('sectionPackages', renderPackageList);

    validateForm();
    updateAutoFillBtn();
}
