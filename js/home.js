import { APP_CONFIG } from './config.js';
import { getData, saveData } from './utils.js';

// Module state
let selectedDate = new Date();
let currentWeekStart = null;

/**
 * Initialize Home Module
 */
export function initHome() {
    const container = document.getElementById('home-container');
    if (!container) return;

    // Set initial week
    currentWeekStart = getWeekStart(new Date());
    selectedDate = new Date();

    renderHome();
}

/**
 * Main render function
 */
export function renderHome() {
    const container = document.getElementById('home-container');
    if (!container) return;

    const L = APP_CONFIG.LABELS.HOME;
    const CAL = APP_CONFIG.LABELS.CALENDAR;

    // Format header date
    const headerDate = formatHeaderDate(currentWeekStart);

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Week Header -->
            <div class="flex items-center justify-between">
                <button id="home-week-prev" class="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                    <span class="text-2xl font-light">${L.WEEK_NAV.PREV}</span>
                </button>
                <div class="text-center">
                    <h3 class="text-lg font-bold text-gray-800">${headerDate.month} ${headerDate.year}</h3>
                    <p class="text-xs text-gray-500">${headerDate.weekNum} неделя</p>
                </div>
                <button id="home-week-next" class="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                    <span class="text-2xl font-light">${L.WEEK_NAV.NEXT}</span>
                </button>
            </div>

            <!-- Week Days Scroll -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                <div id="home-week-nav" class="flex justify-between items-center gap-1 overflow-x-auto scrollbar-hide">
                    ${renderWeekDays()}
                </div>
            </div>

            <!-- Section Title -->
            <div class="flex items-center gap-2">
                <h4 class="text-sm font-semibold text-gray-600">${L.TITLE}</h4>
                <span class="text-xs text-gray-400">${formatSelectedDate(selectedDate)}</span>
            </div>

            <!-- Intakes List -->
            <div id="home-intakes-list" class="space-y-3 pb-4">
                <!-- Intakes will be injected here -->
            </div>
        </div>
    `;

    updateIntakesList();
    setupEventListeners();
}

/**
 * Get Monday of the week containing the given date
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Format header date info
 */
function formatHeaderDate(weekStart) {
    const MONTHS = APP_CONFIG.LABELS.CALENDAR.MONTHS;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // If week spans two months, show both
    let month;
    if (weekStart.getMonth() === weekEnd.getMonth()) {
        month = MONTHS[weekStart.getMonth()];
    } else {
        month = `${MONTHS[weekStart.getMonth()].slice(0, 3)} — ${MONTHS[weekEnd.getMonth()].slice(0, 3)}`;
    }

    return {
        month,
        year: weekStart.getFullYear(),
        weekNum: getWeekNumber(weekStart)
    };
}

/**
 * Format selected date for display
 */
function formatSelectedDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) {
        return 'сегодня';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (selected.getTime() === tomorrow.getTime()) {
        return 'завтра';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (selected.getTime() === yesterday.getTime()) {
        return 'вчера';
    }

    return `${selected.getDate()} ${APP_CONFIG.LABELS.CALENDAR.MONTHS[selected.getMonth()].toLowerCase()}`;
}

/**
 * Render week days buttons
 */
function renderWeekDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const WEEKDAYS = APP_CONFIG.LABELS.CALENDAR.WEEKDAYS;

    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        date.setHours(0, 0, 0, 0);

        const isSelected = date.getTime() === new Date(selectedDate.setHours(0, 0, 0, 0)).getTime();
        const isToday = date.getTime() === today.getTime();
        const dayName = WEEKDAYS[i];
        const dayNum = date.getDate();

        // Check if has intakes
        const dateStr = date.toISOString().split('T')[0];
        const intakes = generateIntakesForDate(dateStr);
        const savedIntakes = getData(APP_CONFIG.STORAGE_KEYS.INTAKES) || [];
        const hasIntakes = intakes.length > 0;
        const allDone = hasIntakes && intakes.every(intake => {
            const key = `${intake.courseId}_${intake.date}_${intake.slot}`;
            return savedIntakes.some(si => si.id === key && si.taken);
        });

        // Build classes
        let btnClasses = 'week-day-btn flex flex-col items-center justify-center min-w-[2.75rem] py-2 px-1 rounded-xl transition-all relative';
        let dayNameClasses = 'text-[10px] uppercase font-bold mb-0.5';
        let dayNumClasses = 'text-sm font-bold';

        if (isSelected) {
            btnClasses += ' bg-teal-600 text-white shadow-md';
            dayNameClasses += ' text-teal-100';
        } else if (isToday) {
            btnClasses += ' bg-teal-100 text-teal-700 font-semibold';
            dayNameClasses += ' text-teal-500';
        } else {
            btnClasses += ' text-gray-500 hover:bg-gray-100';
            dayNameClasses += ' text-gray-400';
        }

        // Intake indicator
        let indicator = '';
        if (hasIntakes && !isSelected) {
            if (allDone) {
                indicator = '<span class="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>';
            } else {
                indicator = '<span class="absolute bottom-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>';
            }
        }

        html += `
            <button class="${btnClasses}" data-date="${date.toISOString()}">
                <span class="${dayNameClasses}">${dayName}</span>
                <span class="${dayNumClasses}">${dayNum}</span>
                ${indicator}
            </button>
        `;
    }
    return html;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Week navigation
    const prevBtn = document.getElementById('home-week-prev');
    const nextBtn = document.getElementById('home-week-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderHome();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderHome();
        });
    }

    // Day selection
    const weekNav = document.getElementById('home-week-nav');
    if (weekNav) {
        weekNav.querySelectorAll('.week-day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDate = new Date(btn.dataset.date);
                renderHome();
            });
        });
    }
}

/**
 * Update intakes list for selected date
 */
export function updateIntakesList() {
    const listContainer = document.getElementById('home-intakes-list');
    if (!listContainer) return;

    const L = APP_CONFIG.LABELS.HOME;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const intakes = generateIntakesForDate(dateStr);
    const savedIntakes = getData(APP_CONFIG.STORAGE_KEYS.INTAKES) || [];

    if (intakes.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <div class="text-5xl mb-4">💊</div>
                <p class="font-medium">${L.EMPTY}</p>
                <p class="text-sm mt-2">${L.EMPTY_HINT}</p>
            </div>
        `;
        return;
    }

    // Sort by time
    intakes.sort((a, b) => {
        const timeA = a.exactTime || getDefaultTime(a.slot);
        const timeB = b.exactTime || getDefaultTime(b.slot);
        return timeA.localeCompare(timeB);
    });

    listContainer.innerHTML = intakes.map(intake => {
        const intakeKey = `${intake.courseId}_${intake.date}_${intake.slot}`;
        const isTaken = savedIntakes.some(si => si.id === intakeKey && si.taken);
        const timeDisplay = intake.exactTime || intake.slotLabel;

        return `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-all ${isTaken ? 'opacity-60' : ''}">
                <label class="relative flex items-center justify-center cursor-pointer shrink-0">
                    <input type="checkbox" class="intake-checkbox sr-only" data-intake-id="${intakeKey}" ${isTaken ? 'checked' : ''}>
                    <div class="w-7 h-7 border-2 border-teal-200 rounded-lg transition-all flex items-center justify-center ${isTaken ? 'bg-teal-500 border-teal-500' : 'bg-white hover:border-teal-400'}">
                        <svg class="w-4 h-4 text-white ${isTaken ? 'block' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </label>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-800 truncate ${isTaken ? 'line-through text-gray-400' : ''}">${intake.courseName}</h4>
                    <div class="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                        <span class="flex items-center gap-1">
                            <span class="opacity-70">⏰</span> ${timeDisplay}
                        </span>
                        <span class="text-gray-300">•</span>
                        <span class="flex items-center gap-1">
                            <span class="opacity-70">💊</span> ${intake.dose}
                        </span>
                        ${intake.mealLabel ? `
                            <span class="text-gray-300">•</span>
                            <span class="flex items-center gap-1">
                                <span class="opacity-70">🍽️</span> ${intake.mealLabel}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Attach checkbox listeners
    listContainer.querySelectorAll('.intake-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            toggleIntake(e.target.dataset.intakeId, e.target.checked);
        });
    });
}

/**
 * Get default time for a slot
 */
function getDefaultTime(slot) {
    switch (slot) {
        case 'morning': return '08:00';
        case 'afternoon': return '13:00';
        case 'evening': return '18:00';
        case 'night': return '22:00';
        default: return '12:00';
    }
}

/**
 * Toggle intake taken state
 */
function toggleIntake(intakeId, taken) {
    let savedIntakes = getData(APP_CONFIG.STORAGE_KEYS.INTAKES) || [];
    const index = savedIntakes.findIndex(si => si.id === intakeId);

    if (index !== -1) {
        savedIntakes[index].taken = taken;
        savedIntakes[index].updatedAt = new Date().toISOString();
    } else {
        savedIntakes.push({
            id: intakeId,
            taken: taken,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    if (saveData(APP_CONFIG.STORAGE_KEYS.INTAKES, savedIntakes)) {
        renderHome();
    }
}

/**
 * Generate intakes for a specific date based on active courses
 */
export function generateIntakesForDate(dateStr) {
    const courses = getData(APP_CONFIG.STORAGE_KEYS.COURSES) || [];
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const dayIntakes = [];

    courses.forEach(course => {
        // Skip inactive courses
        if (course.isActive === false) return;

        // Check date range
        const startDate = new Date(course.dateStart);
        startDate.setHours(0, 0, 0, 0);

        if (targetDate < startDate) return;

        if (course.dateEnd) {
            const endDate = new Date(course.dateEnd);
            endDate.setHours(0, 0, 0, 0);
            if (targetDate > endDate) return;
        }

        // Check interval (every N days)
        const diffDays = Math.round((targetDate - startDate) / (1000 * 60 * 60 * 24));
        if (diffDays % (course.intervalDays || 1) !== 0) return;

        // Generate intakes for each time slot
        if (course.timeSlots && course.timeSlots.length > 0) {
            course.timeSlots.forEach(slot => {
                dayIntakes.push({
                    courseId: course.id,
                    courseName: course.courseName,
                    packageName: course.packageName,
                    date: dateStr,
                    slot: slot.slot,
                    slotLabel: slot.label,
                    exactTime: slot.exactTime || null,
                    dose: slot.dose || course.dosePerIntake || 1,
                    mealLabel: course.mealConditionLabel || null
                });
            });
        }
    });

    return dayIntakes;
}
