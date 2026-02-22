import { APP_CONFIG } from './config.js';
import { saveData, getData, showToast, parseDecimal } from './utils.js';
import { getPackages } from './packages.js';

// Module state
let editingCourseId = null;
let editingPackageId = null;
let courses = [];
let showExactTime = false;
let useDifferentDoses = false; // Track if using different doses per time slot

// DOM Elements cache
const elements = {};

/**
 * Initialize Course Form
 */
export function initCourseForm() {
    const container = document.getElementById('courses-container');
    if (!container) return;

    courses = getData(APP_CONFIG.STORAGE_KEYS.COURSES) || [];
    container.innerHTML = buildCourseFormHTML();
    cacheElements();
    setupEventListeners();
    renderCourseList();
    checkPrefillPackage();
}

/**
 * Build Course Form HTML
 */
function buildCourseFormHTML() {
    const L = APP_CONFIG.LABELS.COURSE;
    const S = APP_CONFIG.LABELS.COURSE.SCHEDULE;
    const packages = getPackages();
    const mealConditions = APP_CONFIG.LABELS.MEAL_CONDITIONS;
    const reminderOptions = APP_CONFIG.LABELS.REMINDER_OPTIONS;

    return `
        <!-- Toggle Button -->
        <button id="crs-toggle-btn" class="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-xl border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-[0.98] transition-all mb-4">
            ${L.ADD_COURSE}
        </button>

        <!-- Course Form -->
        <div id="crs-form-container" class="hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 animate-fade-in">
            <div class="space-y-4">
                
                <!-- Package Select -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        ${L.SELECT_PACKAGE} <span class="text-red-400">*</span>
                    </label>
                    <select id="crs-package-select" class="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                        <option value="">— ${L.SELECT_PACKAGE} —</option>
                        ${packages.map(pkg => `
                            <option value="${pkg.id}" data-name="${pkg.displayName || pkg.tradeName}" data-tradename="${pkg.tradeName}" data-substance="${pkg.substance || ''}" data-dosage="${pkg.dosage || ''}" data-unit="${pkg.unitLabel || ''}">
                                ${pkg.displayName || pkg.tradeName}${pkg.dosage ? ` (${pkg.dosage} ${pkg.unitLabel || ''})` : ''}
                            </option>
                        `).join('')}
                    </select>
                    ${packages.length === 0 ? `
                        <p class="text-xs text-amber-600 mt-1">⚠️ ${APP_CONFIG.LABELS.MESSAGES.NO_PACKAGES_FOR_COURSE}</p>
                    ` : ''}
                </div>

                <!-- Course Name -->
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label class="block text-sm font-medium text-gray-700">
                            ${L.COURSE_NAME} <span class="text-gray-400 text-xs">(${L.OPTIONAL})</span>
                        </label>
                        <button id="crs-autoname-btn" type="button" class="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled title="${L.AUTO_NAME_TIP}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            ${L.AUTO_NAME}
                        </button>
                    </div>
                    <div class="relative">
                        <input type="text" id="crs-name" class="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="${L.COURSE_NAME_PLACEHOLDER}">
                        <button type="button" class="crs-clear-btn absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hidden p-1" data-target="crs-name">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <!-- Remaining -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        ${L.REMAINING} <span class="text-gray-400 text-xs">(${L.OPTIONAL})</span>
                    </label>
                    <div class="relative">
                        <input type="number" id="crs-remaining" class="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="0" min="0" step="any">
                        <button type="button" class="crs-clear-btn absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hidden p-1" data-target="crs-remaining">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <!-- Date Range -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            ${L.DATE_START} <span class="text-red-400">*</span>
                        </label>
                        <input type="date" id="crs-date-start" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            ${L.DATE_END}
                        </label>
                        <input type="date" id="crs-date-end" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400">
                    </div>
                </div>

                <!-- Lifelong Checkbox -->
                <label class="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" id="crs-lifelong" class="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                    <span class="text-sm text-gray-700">${L.LIFELONG}</span>
                </label>

                <!-- Schedule Section -->
                <div id="crs-schedule-section" class="border-t border-gray-100 pt-4 mt-4">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span>⏰</span> ${S.TITLE}
                    </h4>

                    <!-- Time Slots Checkboxes -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-xs font-medium text-gray-500">${S.TIME_SLOTS}</label>
                            <!-- Exact time button (hidden until time slots selected) -->
                            <button type="button" id="crs-exact-time-btn" class="hidden text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span id="crs-exact-time-text">${S.EXACT_TIME}</span>
                            </button>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <label class="time-slot-label flex flex-col items-center gap-1 p-2 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors has-[:checked]:ring-2 has-[:checked]:ring-amber-400">
                                <input type="checkbox" id="crs-time-morning" value="morning" class="sr-only time-slot-checkbox">
                                <span class="text-lg">🌅</span>
                                <span class="text-xs text-gray-600">${S.MORNING}</span>
                            </label>
                            <label class="time-slot-label flex flex-col items-center gap-1 p-2 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors has-[:checked]:ring-2 has-[:checked]:ring-yellow-400">
                                <input type="checkbox" id="crs-time-afternoon" value="afternoon" class="sr-only time-slot-checkbox">
                                <span class="text-lg">☀️</span>
                                <span class="text-xs text-gray-600">${S.AFTERNOON}</span>
                            </label>
                            <label class="time-slot-label flex flex-col items-center gap-1 p-2 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors has-[:checked]:ring-2 has-[:checked]:ring-orange-400">
                                <input type="checkbox" id="crs-time-evening" value="evening" class="sr-only time-slot-checkbox">
                                <span class="text-lg">🌆</span>
                                <span class="text-xs text-gray-600">${S.EVENING}</span>
                            </label>
                            <label class="time-slot-label flex flex-col items-center gap-1 p-2 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors has-[:checked]:ring-2 has-[:checked]:ring-indigo-400">
                                <input type="checkbox" id="crs-time-night" value="night" class="sr-only time-slot-checkbox">
                                <span class="text-lg">🌙</span>
                                <span class="text-xs text-gray-600">${S.NIGHT}</span>
                            </label>
                        </div>
                    </div>

                    <!-- Exact Time Inputs Container (Hidden until exact time enabled) -->
                    <div id="crs-exact-time-container" class="hidden mb-4 space-y-2">
                            <div id="crs-exact-morning-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">🌅</span>
                                <span class="text-sm text-gray-600 w-16">${S.MORNING}</span>
                                <input type="time" id="crs-exact-morning" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="08:00">
                            </div>
                            <div id="crs-exact-afternoon-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">☀️</span>
                                <span class="text-sm text-gray-600 w-16">${S.AFTERNOON}</span>
                                <input type="time" id="crs-exact-afternoon" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="13:00">
                            </div>
                            <div id="crs-exact-evening-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">🌆</span>
                                <span class="text-sm text-gray-600 w-16">${S.EVENING}</span>
                                <input type="time" id="crs-exact-evening" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="18:00">
                            </div>
                            <div id="crs-exact-night-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">🌙</span>
                                <span class="text-sm text-gray-600 w-16">${S.NIGHT}</span>
                                <input type="time" id="crs-exact-night" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="22:00">
                        </div>
                    </div>

                    <!-- Dose Section -->
                    <div id="crs-dose-section" class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-xs font-medium text-gray-500">${S.DOSE_PER_INTAKE}</label>
                            <!-- Different doses button (hidden until 2+ time slots) -->
                            <button type="button" id="crs-different-doses-btn" class="hidden text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <span id="crs-different-doses-text">${S.DIFFERENT_DOSES}</span>
                            </button>
                        </div>
                        
                        <!-- Single dose input (default) -->
                        <div id="crs-single-dose-container">
                            <input type="number" id="crs-dose-per-intake" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1" min="0" step="any">
                        </div>
                        
                        <!-- Multiple doses container (hidden by default) -->
                        <div id="crs-multi-dose-container" class="hidden space-y-2">
                            <div id="crs-dose-morning-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">🌅</span>
                                <span class="text-sm text-gray-600 w-16">${S.MORNING}</span>
                                <input type="number" id="crs-dose-morning" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1" min="0" step="any">
                            </div>
                            <div id="crs-dose-afternoon-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">☀️</span>
                                <span class="text-sm text-gray-600 w-16">${S.AFTERNOON}</span>
                                <input type="number" id="crs-dose-afternoon" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1" min="0" step="any">
                            </div>
                            <div id="crs-dose-evening-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">🌆</span>
                                <span class="text-sm text-gray-600 w-16">${S.EVENING}</span>
                                <input type="number" id="crs-dose-evening" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1" min="0" step="any">
                            </div>
                            <div id="crs-dose-night-row" class="hidden flex items-center gap-2">
                                <span class="text-lg w-8">🌙</span>
                                <span class="text-sm text-gray-600 w-16">${S.NIGHT}</span>
                                <input type="number" id="crs-dose-night" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1" min="0" step="any">
                            </div>
                        </div>
                    </div>

                    <!-- Interval -->
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${S.INTERVAL_DAYS}</label>
                            <input type="number" id="crs-interval-days" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1" min="1" value="1">
                            <p class="text-xs text-gray-400 mt-1">${S.INTERVAL_HINT}</p>
                        </div>
                        <div></div>
                    </div>

                    <!-- Meal Condition & Reminder -->
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${S.MEAL_CONDITION}</label>
                            <select id="crs-meal-condition" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                                ${mealConditions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${S.REMINDER}</label>
                            <select id="crs-reminder" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                                ${reminderOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                            </select>
                            <p class="text-xs text-gray-400 mt-1">${S.REMINDER_HINT}</p>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col gap-2 pt-4">
                    <button id="crs-save-btn" class="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm">
                        ${L.SAVE}
                    </button>
                    <button id="crs-cancel-btn" class="hidden w-full py-2 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                        ${L.CANCEL}
                    </button>
                </div>
            </div>
        </div>

        <!-- Course List -->
        <div id="crs-list" class="space-y-3 pb-20"></div>
    `;
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    elements.toggleBtn = document.getElementById('crs-toggle-btn');
    elements.formContainer = document.getElementById('crs-form-container');
    elements.packageSelect = document.getElementById('crs-package-select');
    elements.courseName = document.getElementById('crs-name');
    elements.autoNameBtn = document.getElementById('crs-autoname-btn');
    elements.remaining = document.getElementById('crs-remaining');
    elements.dateStart = document.getElementById('crs-date-start');
    elements.dateEnd = document.getElementById('crs-date-end');
    elements.lifelong = document.getElementById('crs-lifelong');
    elements.saveBtn = document.getElementById('crs-save-btn');
    elements.cancelBtn = document.getElementById('crs-cancel-btn');
    elements.list = document.getElementById('crs-list');

    // Time slots
    elements.timeMorning = document.getElementById('crs-time-morning');
    elements.timeAfternoon = document.getElementById('crs-time-afternoon');
    elements.timeEvening = document.getElementById('crs-time-evening');
    elements.timeNight = document.getElementById('crs-time-night');
    
    // Exact time
    elements.exactTimeBtn = document.getElementById('crs-exact-time-btn');
    elements.exactTimeText = document.getElementById('crs-exact-time-text');
    elements.exactTimeContainer = document.getElementById('crs-exact-time-container');
    elements.exactMorningRow = document.getElementById('crs-exact-morning-row');
    elements.exactAfternoonRow = document.getElementById('crs-exact-afternoon-row');
    elements.exactEveningRow = document.getElementById('crs-exact-evening-row');
    elements.exactNightRow = document.getElementById('crs-exact-night-row');
    elements.exactMorning = document.getElementById('crs-exact-morning');
    elements.exactAfternoon = document.getElementById('crs-exact-afternoon');
    elements.exactEvening = document.getElementById('crs-exact-evening');
    elements.exactNight = document.getElementById('crs-exact-night');
    
    // Dose elements
    elements.differentDosesBtn = document.getElementById('crs-different-doses-btn');
    elements.differentDosesText = document.getElementById('crs-different-doses-text');
    elements.singleDoseContainer = document.getElementById('crs-single-dose-container');
    elements.multiDoseContainer = document.getElementById('crs-multi-dose-container');
    elements.dosePerIntake = document.getElementById('crs-dose-per-intake');
    elements.doseMorningRow = document.getElementById('crs-dose-morning-row');
    elements.doseAfternoonRow = document.getElementById('crs-dose-afternoon-row');
    elements.doseEveningRow = document.getElementById('crs-dose-evening-row');
    elements.doseNightRow = document.getElementById('crs-dose-night-row');
    elements.doseMorning = document.getElementById('crs-dose-morning');
    elements.doseAfternoon = document.getElementById('crs-dose-afternoon');
    elements.doseEvening = document.getElementById('crs-dose-evening');
    elements.doseNight = document.getElementById('crs-dose-night');
    
    elements.intervalDays = document.getElementById('crs-interval-days');
    elements.mealCondition = document.getElementById('crs-meal-condition');
    elements.reminder = document.getElementById('crs-reminder');

    // Set default start date
    elements.dateStart.value = new Date().toISOString().split('T')[0];
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const L = APP_CONFIG.LABELS.COURSE;

    // Toggle form
    elements.toggleBtn.addEventListener('click', () => {
        const isHidden = elements.formContainer.classList.contains('hidden');
        if (isHidden) {
            elements.formContainer.classList.remove('hidden');
            elements.toggleBtn.textContent = L.CLOSE_FORM;
            elements.toggleBtn.classList.replace('bg-indigo-50', 'bg-gray-100');
            elements.toggleBtn.classList.replace('text-indigo-700', 'text-gray-600');
            elements.toggleBtn.classList.replace('border-indigo-100', 'border-gray-200');
            refreshPackageSelect();
        } else {
            elements.formContainer.classList.add('hidden');
            elements.toggleBtn.textContent = L.ADD_COURSE;
            elements.toggleBtn.classList.replace('bg-gray-100', 'bg-indigo-50');
            elements.toggleBtn.classList.replace('text-gray-600', 'text-indigo-700');
            elements.toggleBtn.classList.replace('border-gray-200', 'border-indigo-100');
            if (editingCourseId) cancelEdit();
        }
    });

    // Package select
    elements.packageSelect.addEventListener('change', () => {
        elements.autoNameBtn.disabled = !elements.packageSelect.value;
    });

    // Auto-name
    elements.autoNameBtn.addEventListener('click', handleAutoName);

    // Lifelong checkbox
    elements.lifelong.addEventListener('change', () => {
        elements.dateEnd.disabled = elements.lifelong.checked;
        if (elements.lifelong.checked) elements.dateEnd.value = '';
    });

    // Time slot checkboxes
    const timeSlots = [elements.timeMorning, elements.timeAfternoon, elements.timeEvening, elements.timeNight];
    timeSlots.forEach(cb => cb.addEventListener('change', handleTimeSlotChange));

    // Exact time toggle
    elements.exactTimeBtn.addEventListener('click', () => {
        showExactTime = !showExactTime;
        elements.exactTimeContainer.classList.toggle('hidden', !showExactTime);
        elements.exactTimeBtn.classList.toggle('text-indigo-800', showExactTime);
        // Update button text
        elements.exactTimeText.textContent = showExactTime ? 'Скрыть точное время' : APP_CONFIG.LABELS.COURSE.SCHEDULE.EXACT_TIME;
        if (showExactTime) updateExactTimeRows();
    });

    // Different doses toggle
    elements.differentDosesBtn.addEventListener('click', toggleDifferentDoses);

    // Save & Cancel
    elements.saveBtn.addEventListener('click', handleSave);
    elements.cancelBtn.addEventListener('click', cancelEdit);
}

/**
 * Handle time slot checkbox change
 */
function handleTimeSlotChange() {
    const selectedCount = getSelectedTimeSlotsCount();
    
    // Show/hide exact time button (when at least 1 slot selected)
    elements.exactTimeBtn.classList.toggle('hidden', selectedCount === 0);
    
    // Hide exact time inputs if no slots selected
    if (selectedCount === 0 && showExactTime) {
        showExactTime = false;
        elements.exactTimeContainer.classList.add('hidden');
    }
    
    // Show/hide different doses button (only for 2+ slots)
    elements.differentDosesBtn.classList.toggle('hidden', selectedCount < 2);
    
    // If less than 2 slots and different doses was enabled, switch back to single
    if (selectedCount < 2 && useDifferentDoses) {
        toggleDifferentDoses();
    }
    
    // Update visible rows
    if (showExactTime) updateExactTimeRows();
    if (useDifferentDoses) updateDoseRows();
}

/**
 * Get count of selected time slots
 */
function getSelectedTimeSlotsCount() {
    let count = 0;
    if (elements.timeMorning.checked) count++;
    if (elements.timeAfternoon.checked) count++;
    if (elements.timeEvening.checked) count++;
    if (elements.timeNight.checked) count++;
    return count;
}

/**
 * Update exact time rows visibility
 */
function updateExactTimeRows() {
    elements.exactMorningRow.classList.toggle('hidden', !elements.timeMorning.checked);
    elements.exactAfternoonRow.classList.toggle('hidden', !elements.timeAfternoon.checked);
    elements.exactEveningRow.classList.toggle('hidden', !elements.timeEvening.checked);
    elements.exactNightRow.classList.toggle('hidden', !elements.timeNight.checked);
}

/**
 * Toggle different doses mode
 */
function toggleDifferentDoses() {
    const S = APP_CONFIG.LABELS.COURSE.SCHEDULE;
    useDifferentDoses = !useDifferentDoses;
    
    elements.singleDoseContainer.classList.toggle('hidden', useDifferentDoses);
    elements.multiDoseContainer.classList.toggle('hidden', !useDifferentDoses);
    elements.differentDosesText.textContent = useDifferentDoses ? S.SAME_DOSE : S.DIFFERENT_DOSES;
    
    if (useDifferentDoses) {
        updateDoseRows();
        // Copy single dose value to all visible dose inputs
        const singleDose = elements.dosePerIntake.value;
        if (singleDose) {
            if (elements.timeMorning.checked) elements.doseMorning.value = singleDose;
            if (elements.timeAfternoon.checked) elements.doseAfternoon.value = singleDose;
            if (elements.timeEvening.checked) elements.doseEvening.value = singleDose;
            if (elements.timeNight.checked) elements.doseNight.value = singleDose;
        }
    }
}

/**
 * Update dose rows visibility
 */
function updateDoseRows() {
    elements.doseMorningRow.classList.toggle('hidden', !elements.timeMorning.checked);
    elements.doseAfternoonRow.classList.toggle('hidden', !elements.timeAfternoon.checked);
    elements.doseEveningRow.classList.toggle('hidden', !elements.timeEvening.checked);
    elements.doseNightRow.classList.toggle('hidden', !elements.timeNight.checked);
}

/**
 * Refresh package select options
 */
function refreshPackageSelect() {
    const packages = getPackages();
    const L = APP_CONFIG.LABELS.COURSE;
    const currentValue = elements.packageSelect.value;

    elements.packageSelect.innerHTML = `
        <option value="">— ${L.SELECT_PACKAGE} —</option>
        ${packages.map(pkg => `
            <option value="${pkg.id}" data-name="${pkg.displayName || pkg.tradeName}" data-tradename="${pkg.tradeName}" data-substance="${pkg.substance || ''}" data-dosage="${pkg.dosage || ''}" data-unit="${pkg.unitLabel || ''}">
                ${pkg.displayName || pkg.tradeName}${pkg.dosage ? ` (${pkg.dosage} ${pkg.unitLabel || ''})` : ''}
            </option>
        `).join('')}
    `;

    if (currentValue) elements.packageSelect.value = currentValue;
}

/**
 * Handle auto-name generation
 */
function handleAutoName() {
    const opt = elements.packageSelect.selectedOptions[0];
    if (!opt?.value) return;

    const name = opt.dataset.name || '';
    const startDate = elements.dateStart.value;

    let courseName = `Курс: ${name}`;
    if (startDate) {
        const date = new Date(startDate);
        const month = APP_CONFIG.LABELS.CALENDAR.MONTHS[date.getMonth()];
        courseName += ` [${month} ${date.getFullYear()}]`;
    }

    elements.courseName.value = courseName;
}

/**
 * Validate form
 */
function validateForm() {
    let isValid = true;
    [elements.packageSelect, elements.dateStart].forEach(el => {
        el.classList.remove('ring-2', 'ring-red-500', 'border-red-500');
    });

    if (!elements.packageSelect.value) {
        elements.packageSelect.classList.add('ring-2', 'ring-red-500', 'border-red-500');
        isValid = false;
    }
    if (!elements.dateStart.value) {
        elements.dateStart.classList.add('ring-2', 'ring-red-500', 'border-red-500');
        isValid = false;
    }

    if (!isValid) showToast(APP_CONFIG.LABELS.MESSAGES.VALIDATION_ERROR, 'error');
    return isValid;
}

/**
 * Collect time slots data with doses
 */
function collectTimeSlots() {
    const slots = [];
    const S = APP_CONFIG.LABELS.COURSE.SCHEDULE;
    
    if (elements.timeMorning.checked) {
        slots.push({
            slot: 'morning',
            label: S.MORNING,
            exactTime: showExactTime ? elements.exactMorning.value : null,
            dose: useDifferentDoses ? parseDecimal(elements.doseMorning.value) || 1 : null
        });
    }
    if (elements.timeAfternoon.checked) {
        slots.push({
            slot: 'afternoon',
            label: S.AFTERNOON,
            exactTime: showExactTime ? elements.exactAfternoon.value : null,
            dose: useDifferentDoses ? parseDecimal(elements.doseAfternoon.value) || 1 : null
        });
    }
    if (elements.timeEvening.checked) {
        slots.push({
            slot: 'evening',
            label: S.EVENING,
            exactTime: showExactTime ? elements.exactEvening.value : null,
            dose: useDifferentDoses ? parseDecimal(elements.doseEvening.value) || 1 : null
        });
    }
    if (elements.timeNight.checked) {
        slots.push({
            slot: 'night',
            label: S.NIGHT,
            exactTime: showExactTime ? elements.exactNight.value : null,
            dose: useDifferentDoses ? parseDecimal(elements.doseNight.value) || 1 : null
        });
    }

    return slots;
}

/**
 * Build course object from form
 */
function buildCourseObject() {
    const opt = elements.packageSelect.selectedOptions[0];
    const packageId = parseFloat(elements.packageSelect.value);
    const mealLabel = APP_CONFIG.LABELS.MEAL_CONDITIONS.find(m => m.value === elements.mealCondition.value)?.label || '';
    
    return {
        id: editingCourseId || (Date.now() + Math.random()),
        packageId,
        packageName: opt.dataset.name || '',
        tradeName: opt.dataset.tradename || '',
        packageDosage: opt.dataset.dosage || '',
        packageUnit: opt.dataset.unit || '',
        substance: opt.dataset.substance || '',
        courseName: elements.courseName.value.trim() || opt.dataset.name || '',
        remaining: parseDecimal(elements.remaining.value),
        dateStart: elements.dateStart.value,
        dateEnd: elements.lifelong.checked ? null : elements.dateEnd.value,
        isLifelong: elements.lifelong.checked,
        timeSlots: collectTimeSlots(),
        useExactTime: showExactTime,
        useDifferentDoses,
        dosePerIntake: useDifferentDoses ? null : (parseDecimal(elements.dosePerIntake.value) || 1),
        intervalDays: parseInt(elements.intervalDays.value) || 1,
        mealCondition: elements.mealCondition.value,
        mealConditionLabel: mealLabel,
        reminderDays: parseInt(elements.reminder.value) || 0,
        isActive: true,
        createdAt: editingCourseId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Handle save
 */
function handleSave() {
    if (!validateForm()) return;

    const courseData = buildCourseObject();
    const L = APP_CONFIG.LABELS.MESSAGES;

    courses = getData(APP_CONFIG.STORAGE_KEYS.COURSES) || [];

    if (editingCourseId) {
        const index = courses.findIndex(c => c.id === editingCourseId);
        if (index !== -1) {
            courseData.createdAt = courses[index].createdAt;
            courses[index] = courseData;
        }
        showToast(L.COURSE_UPDATED, 'success');
    } else {
        courses.push(courseData);
        showToast(L.COURSE_SAVED, 'success');
    }

    if (saveData(APP_CONFIG.STORAGE_KEYS.COURSES, courses)) {
        resetForm();
        renderCourseList();
    }
}

/**
 * Reset form
 */
function resetForm() {
    editingCourseId = null;
    editingPackageId = null;
    showExactTime = false;
    useDifferentDoses = false;

    elements.packageSelect.value = '';
    elements.courseName.value = '';
    elements.remaining.value = '';
    elements.dateStart.value = new Date().toISOString().split('T')[0];
    elements.dateEnd.value = '';
    elements.lifelong.checked = false;
    elements.dateEnd.disabled = false;

    // Time slots
    elements.timeMorning.checked = false;
    elements.timeAfternoon.checked = false;
    elements.timeEvening.checked = false;
    elements.timeNight.checked = false;
    elements.exactTimeBtn.classList.add('hidden');
    elements.exactTimeContainer.classList.add('hidden');
    elements.exactTimeText.textContent = APP_CONFIG.LABELS.COURSE.SCHEDULE.EXACT_TIME;
    elements.exactMorningRow.classList.add('hidden');
    elements.exactAfternoonRow.classList.add('hidden');
    elements.exactEveningRow.classList.add('hidden');
    elements.exactNightRow.classList.add('hidden');
    elements.exactMorning.value = '08:00';
    elements.exactAfternoon.value = '13:00';
    elements.exactEvening.value = '18:00';
    elements.exactNight.value = '22:00';

    // Doses
    elements.differentDosesBtn.classList.add('hidden');
    elements.differentDosesText.textContent = APP_CONFIG.LABELS.COURSE.SCHEDULE.DIFFERENT_DOSES;
    elements.singleDoseContainer.classList.remove('hidden');
    elements.multiDoseContainer.classList.add('hidden');
    elements.dosePerIntake.value = '';
    elements.doseMorning.value = '';
    elements.doseAfternoon.value = '';
    elements.doseEvening.value = '';
    elements.doseNight.value = '';
    elements.doseMorningRow.classList.add('hidden');
    elements.doseAfternoonRow.classList.add('hidden');
    elements.doseEveningRow.classList.add('hidden');
    elements.doseNightRow.classList.add('hidden');

    elements.intervalDays.value = '1';
    elements.mealCondition.value = '';
    elements.reminder.value = '0';

    [elements.packageSelect, elements.dateStart].forEach(el => {
        el.classList.remove('ring-2', 'ring-red-500', 'border-red-500');
    });

    elements.saveBtn.textContent = APP_CONFIG.LABELS.COURSE.SAVE;
    elements.cancelBtn.classList.add('hidden');
    elements.autoNameBtn.disabled = true;
}

/**
 * Cancel edit
 */
function cancelEdit() {
    resetForm();
    const L = APP_CONFIG.LABELS.COURSE;
    elements.formContainer.classList.add('hidden');
    elements.toggleBtn.textContent = L.ADD_COURSE;
    elements.toggleBtn.classList.replace('bg-gray-100', 'bg-indigo-50');
    elements.toggleBtn.classList.replace('text-gray-600', 'text-indigo-700');
    elements.toggleBtn.classList.replace('border-gray-200', 'border-indigo-100');
}

/**
 * Render course list
 */
export function renderCourseList() {
    courses = getData(APP_CONFIG.STORAGE_KEYS.COURSES) || [];
    const L = APP_CONFIG.LABELS;

    if (courses.length === 0) {
        elements.list.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <div class="text-5xl mb-4">📋</div>
                <p class="font-medium">${L.MESSAGES.NO_COURSES}</p>
                <p class="text-sm mt-1">${L.MESSAGES.NO_COURSES_HINT}</p>
            </div>
        `;
        return;
    }

    elements.list.innerHTML = courses.map(course => {
        // Build time display
        let timeDisplay = '';
        if (course.timeSlots?.length > 0) {
            if (course.useExactTime) {
                const times = course.timeSlots.filter(t => t.exactTime).map(t => t.exactTime).join(', ');
                timeDisplay = times || course.timeSlots.map(t => t.label).join(', ');
            } else {
                timeDisplay = course.timeSlots.map(t => t.label).join(', ');
            }
        }

        // Build dose display
        let doseDisplay = '';
        if (course.useDifferentDoses && course.timeSlots?.length > 0) {
            const doses = course.timeSlots.map(t => `${t.label}: ${t.dose || 1}`).join(', ');
            doseDisplay = doses;
        } else if (course.dosePerIntake > 0) {
            doseDisplay = `${course.dosePerIntake} за приём`;
        }

        const dosageDisplay = course.packageDosage ? `${course.packageDosage} ${course.packageUnit}` : '';

        return `
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in" data-course-id="${course.id}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-gray-800 truncate" title="${course.courseName}">${course.courseName}</h3>
                        <p class="text-sm text-gray-500" title="${course.packageName}">${course.packageName}</p>
                        ${course.tradeName && course.tradeName !== course.packageName ? 
                            `<p class="text-xs text-gray-400" title="${course.tradeName}">${course.tradeName}</p>` : ''}
                    </div>
                    <div class="flex flex-col items-end gap-1 ml-2">
                        <span class="text-xs font-medium px-2 py-1 rounded-lg ${course.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}">
                            ${course.isActive ? 'Активен' : 'Завершён'}
                        </span>
                        ${dosageDisplay ? `
                            <span class="text-xs font-medium px-2 py-1 rounded-lg bg-teal-50 text-teal-600">${dosageDisplay}</span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2 text-xs mb-3">
                    <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                        <span>📅</span> ${formatDateRange(course.dateStart, course.dateEnd, course.isLifelong)}
                    </span>
                    ${timeDisplay ? `
                        <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1">
                            <span>⏰</span> ${timeDisplay}
                        </span>
                    ` : ''}
                    ${doseDisplay ? `
                        <span class="bg-teal-50 text-teal-600 px-2 py-1 rounded flex items-center gap-1">
                            <span>💊</span> ${doseDisplay}
                        </span>
                    ` : ''}
                    ${course.intervalDays > 1 ? `
                        <span class="bg-purple-50 text-purple-600 px-2 py-1 rounded flex items-center gap-1">
                            <span>🔄</span> каждые ${course.intervalDays} дн.
                        </span>
                    ` : ''}
                    ${course.mealConditionLabel ? `
                        <span class="bg-orange-50 text-orange-600 px-2 py-1 rounded flex items-center gap-1">
                            <span>🍽️</span> ${course.mealConditionLabel}
                        </span>
                    ` : ''}
                    ${course.remaining > 0 ? `
                        <span class="bg-amber-50 text-amber-600 px-2 py-1 rounded flex items-center gap-1">
                            <span>📊</span> Осталось: ${course.remaining}
                        </span>
                    ` : ''}
                    ${course.substance ? `
                        <span class="bg-violet-50 text-violet-600 px-2 py-1 rounded flex items-center gap-1">
                            <span>🧪</span> ${course.substance}
                        </span>
                    ` : ''}
                    ${course.reminderDays > 0 ? `
                        <span class="bg-red-50 text-red-500 px-2 py-1 rounded flex items-center gap-1">
                            <span>🔔</span> За ${course.reminderDays} дн.
                        </span>
                    ` : ''}
                </div>

                <div class="flex gap-2 pt-3 border-t border-gray-100">
                    <button class="crs-edit-btn flex-1 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" data-id="${course.id}">
                        ${L.BUTTONS.EDIT}
                    </button>
                    <button class="crs-delete-btn flex-1 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${course.id}">
                        ${L.BUTTONS.DELETE}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    attachListEventListeners();
}

/**
 * Format date range
 */
function formatDateRange(start, end, isLifelong) {
    const fmt = (d) => {
        if (!d) return '';
        const date = new Date(d);
        return `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    };
    if (isLifelong) return `с ${fmt(start)} — бессрочно`;
    if (end) return `${fmt(start)} — ${fmt(end)}`;
    return `с ${fmt(start)}`;
}

/**
 * Attach list event listeners
 */
function attachListEventListeners() {
    document.querySelectorAll('.crs-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editCourse(parseFloat(btn.dataset.id)));
    });
    document.querySelectorAll('.crs-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCourse(parseFloat(btn.dataset.id)));
    });
}

/**
 * Edit course
 */
function editCourse(id) {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    editingCourseId = id;
    editingPackageId = course.packageId;
    const L = APP_CONFIG.LABELS.COURSE;

    // Show form
    elements.formContainer.classList.remove('hidden');
    elements.toggleBtn.textContent = L.CLOSE_FORM;
    elements.toggleBtn.classList.replace('bg-indigo-50', 'bg-gray-100');
    elements.toggleBtn.classList.replace('text-indigo-700', 'text-gray-600');
    elements.toggleBtn.classList.replace('border-indigo-100', 'border-gray-200');

    refreshPackageSelect();
    elements.packageSelect.value = course.packageId;
    elements.courseName.value = course.courseName || '';
    elements.remaining.value = course.remaining || '';
    elements.dateStart.value = course.dateStart || '';
    elements.dateEnd.value = course.dateEnd || '';
    elements.lifelong.checked = course.isLifelong || false;
    elements.dateEnd.disabled = course.isLifelong || false;

    // Time slots
    elements.timeMorning.checked = course.timeSlots?.some(t => t.slot === 'morning') || false;
    elements.timeAfternoon.checked = course.timeSlots?.some(t => t.slot === 'afternoon') || false;
    elements.timeEvening.checked = course.timeSlots?.some(t => t.slot === 'evening') || false;
    elements.timeNight.checked = course.timeSlots?.some(t => t.slot === 'night') || false;

    // Update visibility
    handleTimeSlotChange();

    // Exact times
    showExactTime = course.useExactTime || false;
    elements.exactTimeContainer.classList.toggle('hidden', !showExactTime);
    elements.exactTimeBtn.classList.toggle('text-indigo-800', showExactTime);
    
    if (course.timeSlots) {
        const morning = course.timeSlots.find(t => t.slot === 'morning');
        const afternoon = course.timeSlots.find(t => t.slot === 'afternoon');
        const evening = course.timeSlots.find(t => t.slot === 'evening');
        const night = course.timeSlots.find(t => t.slot === 'night');
        
        if (morning?.exactTime) elements.exactMorning.value = morning.exactTime;
        if (afternoon?.exactTime) elements.exactAfternoon.value = afternoon.exactTime;
        if (evening?.exactTime) elements.exactEvening.value = evening.exactTime;
        if (night?.exactTime) elements.exactNight.value = night.exactTime;
        
        // Different doses
        if (course.useDifferentDoses) {
            useDifferentDoses = true;
            elements.singleDoseContainer.classList.add('hidden');
            elements.multiDoseContainer.classList.remove('hidden');
            elements.differentDosesText.textContent = APP_CONFIG.LABELS.COURSE.SCHEDULE.SAME_DOSE;
            updateDoseRows();
            
            if (morning?.dose) elements.doseMorning.value = morning.dose;
            if (afternoon?.dose) elements.doseAfternoon.value = afternoon.dose;
            if (evening?.dose) elements.doseEvening.value = evening.dose;
            if (night?.dose) elements.doseNight.value = night.dose;
        }
    }

    if (showExactTime) updateExactTimeRows();

    elements.dosePerIntake.value = course.dosePerIntake || '';
    elements.intervalDays.value = course.intervalDays || 1;
    elements.mealCondition.value = course.mealCondition || '';
    elements.reminder.value = course.reminderDays || '0';

    elements.saveBtn.textContent = L.UPDATE;
    elements.cancelBtn.classList.remove('hidden');
    elements.autoNameBtn.disabled = !elements.packageSelect.value;

    elements.formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Delete course
 */
function deleteCourse(id) {
    const L = APP_CONFIG.LABELS;
    if (!confirm(L.BUTTONS.CONFIRM_DELETE.replace('упаковку', 'курс'))) return;

    courses = courses.filter(c => c.id !== id);
    if (saveData(APP_CONFIG.STORAGE_KEYS.COURSES, courses)) {
        showToast(L.MESSAGES.COURSE_DELETED, 'success');
        renderCourseList();
    }
}

/**
 * Check for prefilled data
 */
function checkPrefillPackage() {
    const packageId = sessionStorage.getItem('selectedPackageId');
    if (packageId) {
        sessionStorage.removeItem('selectedPackageId');
        openFormWithPackage(packageId);
    }

    const startDate = sessionStorage.getItem('courseStartDate');
    if (startDate) {
        sessionStorage.removeItem('courseStartDate');
        prefillStartDate(startDate);
    }
}

/**
 * Open form with package selected
 */
function openFormWithPackage(packageId) {
    elements.formContainer.classList.remove('hidden');
    elements.toggleBtn.textContent = APP_CONFIG.LABELS.COURSE.CLOSE_FORM;
    elements.toggleBtn.classList.replace('bg-indigo-50', 'bg-gray-100');
    elements.toggleBtn.classList.replace('text-indigo-700', 'text-gray-600');
    elements.toggleBtn.classList.replace('border-indigo-100', 'border-gray-200');
    
    refreshPackageSelect();
    elements.packageSelect.value = packageId;
    elements.autoNameBtn.disabled = false;
}

/**
 * Prefill start date (called from calendar)
 */
export function prefillStartDate(dateStr) {
    if (!elements.formContainer) return;
    
    // Open form if hidden
    if (elements.formContainer.classList.contains('hidden')) {
        elements.formContainer.classList.remove('hidden');
        elements.toggleBtn.textContent = APP_CONFIG.LABELS.COURSE.CLOSE_FORM;
        elements.toggleBtn.classList.replace('bg-indigo-50', 'bg-gray-100');
        elements.toggleBtn.classList.replace('text-indigo-700', 'text-gray-600');
        elements.toggleBtn.classList.replace('border-indigo-100', 'border-gray-200');
        refreshPackageSelect();
    }
    
    elements.dateStart.value = dateStr;
    elements.formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Get all courses
 */
export function getCourses() {
    return getData(APP_CONFIG.STORAGE_KEYS.COURSES) || [];
}
