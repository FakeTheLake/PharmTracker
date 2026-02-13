/**
 * courses.js — Course CRUD component.
 *
 * Handles:
 *   · Course creation form (always visible)
 *   · Dynamic per-time-of-day dose fields
 *   · Course list rendering, editing, deletion
 *   · Prefill from package (called by packages.js)
 */

import { safeGetArray, saveArray } from '../utils/storage.js';
import {
    generateId, escapeHtml, formatDateRu, formatRuNum, parseRuNum,
} from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { registerRefresh } from '../ui/navigation.js';
import { applyDecimalMask } from '../ui/decimal-mask.js';

// ── DOM References ─────────────────────────

const addCourseForm       = document.getElementById('addCourseForm');
const saveCourseBtn       = document.getElementById('saveCourseBtn');
const courseFormTitle      = document.getElementById('courseFormTitle');
const courseListContainer  = document.getElementById('courseListContainer');

const coursePackageSelect   = document.getElementById('coursePackageSelect');
const courseCourseName      = document.getElementById('courseCourseName');
const courseActiveSubstance = document.getElementById('courseActiveSubstance');
const courseCurrentStock    = document.getElementById('courseCurrentStock');
const courseStartDate       = document.getElementById('courseStartDate');
const courseIsLifelong      = document.getElementById('courseIsLifelong');
const courseDosePerIntake   = document.getElementById('courseDosePerIntake');
const courseIntervalDays    = document.getElementById('courseIntervalDays');
const courseMealCondition   = document.getElementById('courseMealCondition');
const courseLowStockReminder = document.getElementById('courseLowStockReminder');

const courseScheduleMorning = document.getElementById('courseScheduleMorning');
const courseScheduleDay     = document.getElementById('courseScheduleDay');
const courseScheduleEvening = document.getElementById('courseScheduleEvening');
const courseScheduleNight   = document.getElementById('courseScheduleNight');

const errorCoursePackage   = document.getElementById('errorCoursePackage');
const errorCourseName      = document.getElementById('errorCourseName');
const errorCourseStartDate = document.getElementById('errorCourseStartDate');

// ── State ──────────────────────────────────

let editingCourseId      = null;
let isUsingDifferentDoses = false;

// ── Time Slot Config ───────────────────────

const TIME_SLOT_CONFIG = [
    { key: 'morning', cbId: 'courseScheduleMorning', label: '🌅 Утро' },
    { key: 'day',     cbId: 'courseScheduleDay',     label: '☀️ День' },
    { key: 'evening', cbId: 'courseScheduleEvening', label: '🌆 Вечер' },
    { key: 'night',   cbId: 'courseScheduleNight',   label: '🌙 Ночь' },
];

function getCheckedSlots() {
    return TIME_SLOT_CONFIG.filter(s => document.getElementById(s.cbId)?.checked);
}

// ── Different-Doses Toggle ─────────────────

function updateDoseToggle() {
    const btn = document.getElementById('toggleDifferentDosesBtn');
    if (!btn) return;

    const count = getCheckedSlots().length;

    if (count >= 2) {
        btn.classList.remove('hidden');
        btn.classList.add('flex');
    } else {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
        if (isUsingDifferentDoses) disableDiffDoses();
    }

    // Refresh per-time fields if in diff-dose mode
    if (isUsingDifferentDoses && count >= 2) {
        const cur = collectPerTimeDoses();
        renderPerTimeDoseFields('', cur);
    }
}

function toggleDiffDoses() {
    isUsingDifferentDoses ? disableDiffDoses() : enableDiffDoses();
}

function enableDiffDoses(doseMap = null) {
    isUsingDifferentDoses = true;
    document.getElementById('singleDoseContainer').classList.add('hidden');
    document.getElementById('perTimeDoseContainer').classList.remove('hidden');
    renderPerTimeDoseFields(courseDosePerIntake.value, doseMap);

    const textEl = document.getElementById('toggleDifferentDosesText');
    if (textEl) textEl.textContent = 'Одинаковая доза для всех приёмов';
}

function disableDiffDoses() {
    isUsingDifferentDoses = false;
    document.getElementById('singleDoseContainer').classList.remove('hidden');
    const container = document.getElementById('perTimeDoseContainer');
    container.classList.add('hidden');
    container.innerHTML = '';

    const textEl = document.getElementById('toggleDifferentDosesText');
    if (textEl) textEl.textContent = 'Разное количество в разное время суток?';
}

function renderPerTimeDoseFields(defaultVal = '', doseMap = null) {
    const container = document.getElementById('perTimeDoseContainer');
    if (!container) return;
    container.innerHTML = '';

    getCheckedSlots().forEach(slot => {
        let val = defaultVal;
        if (doseMap && doseMap[slot.key] != null) val = formatRuNum(doseMap[slot.key]);

        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5';
        wrapper.innerHTML = `
            <span class="text-sm text-slate-600 w-24 flex-shrink-0">${slot.label}</span>
            <input type="text" id="perTimeDose_${slot.key}"
                   placeholder="1 или 0,25" value="${escapeHtml(val)}" data-decimal
                   class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700
                          placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500
                          focus:border-transparent text-sm transition-all duration-200">`;
        container.appendChild(wrapper);
        applyDecimalMask(wrapper.querySelector('input'));
    });
}

function collectPerTimeDoses() {
    const doses = {};
    TIME_SLOT_CONFIG.forEach(s => {
        const input = document.getElementById(`perTimeDose_${s.key}`);
        doses[s.key] = input ? parseRuNum(input.value) : null;
    });
    return doses;
}

function resetDoseUI() {
    if (isUsingDifferentDoses) disableDiffDoses();
    const btn = document.getElementById('toggleDifferentDosesBtn');
    if (btn) { btn.classList.add('hidden'); btn.classList.remove('flex'); }
}

// ── Package Select Population ──────────────

export function populatePackageSelect() {
    const pkgs = safeGetArray('medicationPackages');
    coursePackageSelect.innerHTML = '<option value="" disabled selected>Выберите упаковку</option>';

    pkgs.forEach(p => {
        const opt = document.createElement('option');
        opt.value       = p.id;
        opt.textContent = p.displayName || `${p.tradeName} ${p.dosageValue} ${p.dosageUnit}`;
        coursePackageSelect.appendChild(opt);
    });
}

/** When a package is selected, auto-fill course name & active substance */
function onPackageSelectChange() {
    const pkg = safeGetArray('medicationPackages').find(p => p.id === coursePackageSelect.value);
    if (!pkg) return;

    courseActiveSubstance.value = pkg.activeIngredient || '';
    updateCourseClearBtn(courseActiveSubstance);

    courseCourseName.value = pkg.tradeName || '';
    updateCourseClearBtn(courseCourseName);

    validateCourseForm();
}

// ── Clear-Field Buttons ────────────────────

function updateCourseClearBtn(field) {
    const btn = document.querySelector(`[data-clear-course-field="${field.id}"]`);
    if (btn) btn.classList.toggle('hidden', field.value.length === 0);
}

// ── Validation ─────────────────────────────

function validateCourseForm() {
    const ok =
        coursePackageSelect.value !== '' &&
        courseCourseName.value.trim().length > 0 &&
        courseStartDate.value !== '';
    saveCourseBtn.disabled = !ok;
    return ok;
}

function validateCourseWithErrors() {
    let ok = true;
    [errorCoursePackage, errorCourseName, errorCourseStartDate].forEach(e => e.classList.add('hidden'));

    if (!coursePackageSelect.value)       { errorCoursePackage.classList.remove('hidden');   ok = false; }
    if (!courseCourseName.value.trim())   { errorCourseName.classList.remove('hidden');      ok = false; }
    if (!courseStartDate.value)           { errorCourseStartDate.classList.remove('hidden'); ok = false; }

    return ok;
}

// ── Save / Update ──────────────────────────

function saveCourse() {
    if (!validateCourseWithErrors()) return;

    const data = {
        id:                   editingCourseId || generateId(),
        packageId:            coursePackageSelect.value,
        courseName:           courseCourseName.value.trim(),
        activeSubstance:      courseActiveSubstance.value.trim(),
        currentStock:         parseRuNum(courseCurrentStock.value),
        startDate:            courseStartDate.value,
        isLifelong:           courseIsLifelong.checked,
        schedule: {
            morning: courseScheduleMorning.checked,
            day:     courseScheduleDay.checked,
            evening: courseScheduleEvening.checked,
            night:   courseScheduleNight.checked,
        },
        dosePerIntake:        isUsingDifferentDoses ? null : parseRuNum(courseDosePerIntake.value),
        useDifferentDoses:    isUsingDifferentDoses,
        doses:                isUsingDifferentDoses ? collectPerTimeDoses() : null,
        intervalDays:         parseInt(courseIntervalDays.value, 10) || 1,
        mealCondition:        courseMealCondition.value || null,
        lowStockReminderDays: parseInt(courseLowStockReminder.value, 10) || null,
        isActive:             true,
        createdAt:            new Date().toISOString(),
    };

    let courses = safeGetArray('medicationCourses');

    if (editingCourseId) {
        const idx = courses.findIndex(c => c.id === editingCourseId);
        if (idx !== -1) {
            data.createdAt = courses[idx].createdAt;
            data.isActive  = courses[idx].isActive;
            courses[idx]   = data;
        }
        showToast('Курс обновлён ✓');
    } else {
        courses.push(data);
        showToast('Курс сохранён ✓');
    }

    saveArray('medicationCourses', courses);
    resetCourseForm();
    renderCourseList();
}

// ── Reset ──────────────────────────────────

function resetCourseForm() {
    addCourseForm.reset();
    [errorCoursePackage, errorCourseName, errorCourseStartDate].forEach(e => e.classList.add('hidden'));
    document.querySelectorAll('.clear-course-field-btn').forEach(b => b.classList.add('hidden'));
    resetDoseUI();

    editingCourseId = null;
    courseFormTitle.innerHTML =
        '<span class="text-xl">📋</span> Новый курс приёма';
    saveCourseBtn.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Сохранить курс';
    validateCourseForm();
}

// ── Edit ───────────────────────────────────

function editCourse(id) {
    const course = safeGetArray('medicationCourses').find(c => c.id === id);
    if (!course) { showToast('Курс не найден'); return; }

    editingCourseId = id;
    addCourseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Populate fields directly (no auto-fill trigger)
    coursePackageSelect.value   = course.packageId || '';
    courseCourseName.value      = course.courseName || '';
    updateCourseClearBtn(courseCourseName);
    courseActiveSubstance.value = course.activeSubstance || '';
    updateCourseClearBtn(courseActiveSubstance);
    courseCurrentStock.value    = course.currentStock != null ? formatRuNum(course.currentStock) : '';
    updateCourseClearBtn(courseCurrentStock);
    courseStartDate.value       = course.startDate || '';
    courseIsLifelong.checked    = course.isLifelong || false;

    // Schedule checkboxes
    courseScheduleMorning.checked = course.schedule?.morning || false;
    courseScheduleDay.checked     = course.schedule?.day     || false;
    courseScheduleEvening.checked = course.schedule?.evening || false;
    courseScheduleNight.checked   = course.schedule?.night   || false;

    // Dose
    resetDoseUI();
    updateDoseToggle();
    if (course.useDifferentDoses && course.doses) {
        courseDosePerIntake.value = '';
        enableDiffDoses(course.doses);
    } else {
        courseDosePerIntake.value = course.dosePerIntake != null ? formatRuNum(course.dosePerIntake) : '';
    }

    courseIntervalDays.value      = course.intervalDays || '';
    courseMealCondition.value    = course.mealCondition || '';
    courseLowStockReminder.value = course.lowStockReminderDays != null
        ? String(course.lowStockReminderDays) : '';

    // UI mode
    courseFormTitle.innerHTML =
        '<span class="text-xl">✏️</span> Редактирование курса';
    saveCourseBtn.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> Обновить';
    validateCourseForm();
}

// ── Delete ──────────────────────────────────

function deleteCourse(id) {
    if (!confirm('Удалить курс?')) return;
    const courses = safeGetArray('medicationCourses').filter(c => c.id !== id);
    saveArray('medicationCourses', courses);
    if (editingCourseId === id) resetCourseForm();
    renderCourseList();
    showToast('Курс удалён');
}

// ── Prefill from Package (public) ──────────

/**
 * Called by packages.js when user clicks "Создать курс" on a package card.
 * @param {string} pkgId — the package ID to prefill from
 */
export function prefillCourseFromPackage(pkgId) {
    const sel = document.getElementById('coursePackageSelect');
    if (sel) {
        sel.value = pkgId;
        onPackageSelectChange();
        validateCourseForm();
    }
    addCourseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Заполните данные курса');
}

// ── Render Course List ─────────────────────

export function renderCourseList() {
    const courses = safeGetArray('medicationCourses');
    const pkgs    = safeGetArray('medicationPackages');
    courseListContainer.innerHTML = '';

    if (courses.length === 0) {
        courseListContainer.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-violet-50 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                </div>
                <h2 class="text-lg font-medium text-slate-700 mb-2">Список курсов пуст</h2>
                <p class="text-sm text-slate-400">Создайте первый курс</p>
            </div>`;
        return;
    }

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'flex items-center justify-between mb-2';
    hdr.innerHTML = `
        <h3 class="text-sm font-medium text-slate-500">Сохранённые курсы</h3>
        <span class="text-xs text-slate-400">${courses.length} шт.</span>`;
    courseListContainer.appendChild(hdr);

    courses.forEach(course => {
        const pkg     = pkgs.find(p => p.id === course.packageId);
        const pkgName = pkg ? (pkg.displayName || pkg.tradeName) : 'Не найдена';
        const pkgDose = pkg ? `${pkg.dosageValue} ${pkg.dosageUnit}` : '';

        // Schedule icons
        const schedArr = [];
        if (course.schedule?.morning) schedArr.push('🌅');
        if (course.schedule?.day)     schedArr.push('☀️');
        if (course.schedule?.evening) schedArr.push('🌆');
        if (course.schedule?.night)   schedArr.push('🌙');
        const schedStr = schedArr.length ? schedArr.join(' ') : '—';

        const startF = course.startDate
            ? formatDateRu(new Date(course.startDate + 'T00:00:00')) : '—';

        const statusBadge = course.isActive
            ? '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Активен</span>'
            : '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Пауза</span>';

        // Extra info
        let extra = '';
        if (course.useDifferentDoses && course.doses) {
            const doseLabels = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
            const parts = Object.entries(course.doses)
                .filter(([, v]) => v != null)
                .map(([k, v]) => `${doseLabels[k]} ${formatRuNum(v)}`);
            if (parts.length) extra += `<div class="text-xs text-slate-500"><span class="text-slate-400">Дозы:</span> ${parts.join(' · ')}</div>`;
        } else if (course.dosePerIntake != null) {
            extra += `<div class="text-xs text-slate-500"><span class="text-slate-400">Доза:</span> ${formatRuNum(course.dosePerIntake)}</div>`;
        }
        if (course.mealCondition) extra += `<div class="text-xs text-slate-500"><span class="text-slate-400">Приём:</span> ${escapeHtml(course.mealCondition)}</div>`;
        if (course.isLifelong) extra += '<div class="text-xs text-slate-500">♾ Бессрочный</div>';
        if (course.intervalDays > 1) extra += `<div class="text-xs text-slate-500">Каждые ${course.intervalDays} дн.</div>`;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3';
        card.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <h4 class="font-semibold text-slate-700 text-base">${escapeHtml(course.courseName)}</h4>
                ${statusBadge}
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Упаковка</span>
                    <span class="text-slate-700 font-medium text-xs">${escapeHtml(pkgName)}</span>
                </div>
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Дозировка</span>
                    <span class="text-slate-700 font-medium text-xs">${escapeHtml(pkgDose)}</span>
                </div>
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Начало</span>
                    <span class="text-slate-700 font-medium">${startF}</span>
                </div>
                <div class="bg-slate-50 rounded-lg px-3 py-2">
                    <span class="text-slate-400 text-xs block">Расписание</span>
                    <span class="text-slate-700 font-medium">${schedStr}</span>
                </div>
            </div>
            ${extra ? `<div class="space-y-1 pt-1 border-t border-slate-100">${extra}</div>` : ''}
            <div class="flex gap-2 pt-2 border-t border-slate-100">
                <button class="crs-edit flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    ✏️ Редактировать
                </button>
                <button class="crs-del flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    🗑 Удалить
                </button>
            </div>`;

        card.querySelector('.crs-edit').addEventListener('click', () => editCourse(course.id));
        card.querySelector('.crs-del').addEventListener('click', () => deleteCourse(course.id));
        courseListContainer.appendChild(card);
    });
}

// ── Initialization ─────────────────────────

export function initCourseForm() {
    populatePackageSelect();

    // Schedule checkbox listeners → toggle diff-dose button
    [courseScheduleMorning, courseScheduleDay, courseScheduleEvening, courseScheduleNight]
        .forEach(cb => cb?.addEventListener('change', updateDoseToggle));

    document.getElementById('toggleDifferentDosesBtn')?.addEventListener('click', toggleDiffDoses);

    // Package change
    coursePackageSelect.addEventListener('change', () => {
        onPackageSelectChange();
        validateCourseForm();
    });

    // Form submit
    addCourseForm.addEventListener('submit', e => { e.preventDefault(); saveCourse(); });

    // Clear buttons
    document.querySelectorAll('.clear-course-field-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = document.getElementById(btn.dataset.clearCourseField);
            if (field) {
                field.value = '';
                field.dispatchEvent(new Event('input'));
                btn.classList.add('hidden');
                field.focus();
            }
        });
    });

    // Show/hide clear icons on input
    [courseCourseName, courseActiveSubstance, courseCurrentStock]
        .forEach(f => f?.addEventListener('input', () => updateCourseClearBtn(f)));

    // Validation listeners
    [courseCourseName, courseStartDate].forEach(f => {
        f?.addEventListener('input', validateCourseForm);
        f?.addEventListener('change', validateCourseForm);
    });

    // Register refresh callback
    registerRefresh('sectionCourses', () => {
        populatePackageSelect();
        renderCourseList();
    });

    validateCourseForm();
    renderCourseList();
}
