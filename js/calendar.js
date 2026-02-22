import { APP_CONFIG } from './config.js';
import { getData, saveData } from './utils.js';
import { generateIntakesForDate } from './home.js';

// Module state
let currentDate = new Date();
let selectedDate = null;
let viewingDate = null; // Date being viewed in day view
let isInDayView = false;

// DOM Elements cache
const elements = {};

/**
 * Initialize Calendar Module
 */
export function initCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    // Build calendar HTML
    container.innerHTML = buildCalendarHTML();

    // Cache elements
    cacheElements();

    // Setup event listeners
    setupEventListeners();

    // Render current month
    renderMonth();
}

/**
 * Build Calendar HTML structure
 */
function buildCalendarHTML() {
    const L = APP_CONFIG.LABELS.CALENDAR;

    return `
        <!-- Month View Container -->
        <div id="cal-month-view">
            <!-- Month Navigation -->
            <div class="flex items-center justify-between mb-4">
                <button id="cal-prev-btn" class="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <span class="text-xl">${L.PREV}</span>
                </button>
                <div class="text-center">
                    <h3 id="cal-month-title" class="text-lg font-semibold text-gray-800"></h3>
                    <button id="cal-today-btn" class="text-xs text-teal-600 hover:text-teal-700 font-medium">${L.TODAY}</button>
                </div>
                <button id="cal-next-btn" class="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <span class="text-xl">${L.NEXT}</span>
                </button>
            </div>

            <!-- Weekday Headers -->
            <div class="calendar-grid mb-2">
                ${L.WEEKDAYS.map(day => `
                    <div class="text-center text-xs font-medium text-gray-500 py-2">${day}</div>
                `).join('')}
            </div>

            <!-- Calendar Grid -->
            <div id="cal-grid" class="calendar-grid mb-6">
                <!-- Days will be rendered here -->
            </div>

            <!-- Legend Block -->
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">${L.LEGEND.TITLE}</h4>
                <div class="flex gap-4 text-xs">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-teal-100 border-2 border-teal-500"></span>
                        <span class="text-gray-600">${L.LEGEND.TODAY}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-white border-2 border-indigo-500"></span>
                        <span class="text-gray-600">${L.LEGEND.SELECTED}</span>
                    </div>
                </div>
            </div>

            <!-- Actions Block -->
            <div id="cal-actions" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">${L.ACTIONS.TITLE}</h4>
                <div class="flex flex-col gap-2">
                    <div class="flex gap-2">
                        <button id="cal-view-day-btn" class="flex-1 py-2 px-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed transition-colors" disabled>
                            ${L.ACTIONS.VIEW_DAY}
                        </button>
                        <button id="cal-add-course-btn" class="flex-1 py-2 px-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed transition-colors" disabled>
                            ${L.ACTIONS.ADD_COURSE}
                        </button>
                    </div>
                </div>
                <p id="cal-selection-hint" class="text-xs text-gray-400 text-center mt-2">
                    ${APP_CONFIG.LABELS.MESSAGES.SELECT_DATE}
                </p>
            </div>
        </div>

        <!-- Day View Container (Hidden by default) -->
        <div id="cal-day-view" class="hidden animate-fade-in">
            <!-- Day view will be rendered here -->
        </div>
    `;
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    elements.monthView = document.getElementById('cal-month-view');
    elements.prevBtn = document.getElementById('cal-prev-btn');
    elements.nextBtn = document.getElementById('cal-next-btn');
    elements.todayBtn = document.getElementById('cal-today-btn');
    elements.monthTitle = document.getElementById('cal-month-title');
    elements.grid = document.getElementById('cal-grid');
    elements.viewDayBtn = document.getElementById('cal-view-day-btn');
    elements.addCourseBtn = document.getElementById('cal-add-course-btn');
    elements.selectionHint = document.getElementById('cal-selection-hint');
    elements.dayView = document.getElementById('cal-day-view');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation
    elements.prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMonth();
    });

    elements.nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMonth();
    });

    elements.todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = new Date();
        renderMonth();
        updateActions(true);
    });

    // Actions
    elements.viewDayBtn.addEventListener('click', () => {
        if (selectedDate) {
            showDayView(selectedDate);
        }
    });

    elements.addCourseBtn.addEventListener('click', () => {
        if (selectedDate) {
            // Store selected date for course form
            sessionStorage.setItem('courseStartDate', selectedDate.toISOString().split('T')[0]);
            // Switch to courses tab
            const coursesBtn = document.getElementById('nav-courses');
            if (coursesBtn) coursesBtn.click();
        }
    });
}

/**
 * Render month grid
 */
function renderMonth() {
    const L = APP_CONFIG.LABELS.CALENDAR;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update title
    elements.monthTitle.textContent = `${L.MONTHS[month]} ${year}`;

    // Get first day of month (0 = Sunday, convert to Monday-based)
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6; // Sunday becomes 6

    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Get today for comparison
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Build grid HTML
    let gridHTML = '';

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        gridHTML += `
            <div class="text-center py-2 text-gray-300 text-sm">${day}</div>
        `;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = isCurrentMonth && today.getDate() === day;
        const isSelected = selectedDate && 
            selectedDate.getFullYear() === year && 
            selectedDate.getMonth() === month && 
            selectedDate.getDate() === day;

        // Build classes
        let classes = 'text-center py-2 text-sm rounded-lg cursor-pointer transition-all hover:bg-gray-100';
        
        if (isToday) {
            classes += ' bg-teal-100 border-2 border-teal-500 font-semibold text-teal-700';
        } else if (isSelected) {
            classes += ' bg-white border-2 border-indigo-500 font-semibold text-indigo-700';
        } else {
            classes += ' text-gray-700';
        }

        gridHTML += `
            <div class="${classes}" data-date="${dateStr}" data-day="${day}">${day}</div>
        `;
    }

    // Next month days (fill remaining cells)
    const totalCells = startDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    
    for (let i = 1; i <= remainingCells; i++) {
        gridHTML += `
            <div class="text-center py-2 text-gray-300 text-sm">${i}</div>
        `;
    }

    elements.grid.innerHTML = gridHTML;

    // Add click handlers to day cells
    elements.grid.querySelectorAll('[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
            const dateStr = cell.dataset.date;
            selectDate(dateStr);
        });
    });
}

/**
 * Select a date
 */
function selectDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    selectedDate = new Date(year, month - 1, day);

    // Re-render to update selection
    renderMonth();

    // Enable actions
    updateActions(true);
}

/**
 * Update action buttons state
 */
function updateActions(enabled) {
    if (enabled) {
        elements.viewDayBtn.disabled = false;
        elements.viewDayBtn.classList.remove('text-gray-400', 'bg-gray-100', 'cursor-not-allowed');
        elements.viewDayBtn.classList.add('text-teal-600', 'bg-teal-50', 'hover:bg-teal-100');

        elements.addCourseBtn.disabled = false;
        elements.addCourseBtn.classList.remove('text-gray-400', 'bg-gray-100', 'cursor-not-allowed');
        elements.addCourseBtn.classList.add('text-indigo-600', 'bg-indigo-50', 'hover:bg-indigo-100');

        elements.selectionHint.classList.add('hidden');
    } else {
        elements.viewDayBtn.disabled = true;
        elements.viewDayBtn.classList.add('text-gray-400', 'bg-gray-100', 'cursor-not-allowed');
        elements.viewDayBtn.classList.remove('text-teal-600', 'bg-teal-50', 'hover:bg-teal-100');

        elements.addCourseBtn.disabled = true;
        elements.addCourseBtn.classList.add('text-gray-400', 'bg-gray-100', 'cursor-not-allowed');
        elements.addCourseBtn.classList.remove('text-indigo-600', 'bg-indigo-50', 'hover:bg-indigo-100');

        elements.selectionHint.classList.remove('hidden');
    }
}

/**
 * Show day view
 */
function showDayView(date) {
    viewingDate = new Date(date);
    isInDayView = true;
    
    // Hide month view, show day view
    elements.monthView.classList.add('hidden');
    elements.dayView.classList.remove('hidden');
    
    // Render day view content
    renderDayView();
}

/**
 * Render day view content
 */
function renderDayView() {
    const L = APP_CONFIG.LABELS.CALENDAR.DAY_VIEW;
    const MONTHS = APP_CONFIG.LABELS.CALENDAR.MONTHS;
    
    // Format date for display
    const day = viewingDate.getDate();
    const month = MONTHS[viewingDate.getMonth()];
    const year = viewingDate.getFullYear();
    const weekday = APP_CONFIG.LABELS.CALENDAR.WEEKDAYS[getWeekdayIndex(viewingDate)];
    
    const dateStr = viewingDate.toISOString().split('T')[0];
    
    // Get intakes for this day using the generator
    const dayIntakes = generateIntakesForDate(dateStr);
    
    // Check if today
    const today = new Date();
    const isToday = viewingDate.toDateString() === today.toDateString();
    
    elements.dayView.innerHTML = `
        <!-- Day Navigation -->
        <div class="flex items-center justify-between mb-6">
            <button id="day-prev-btn" class="p-3 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                <span class="text-2xl">${L.PREV_DAY}</span>
            </button>
            <div class="text-center flex-1">
                <h3 class="text-xl font-bold text-gray-800">${day} ${month}</h3>
                <p class="text-sm text-gray-500">${weekday}, ${year}${isToday ? ' • Сегодня' : ''}</p>
            </div>
            <button id="day-next-btn" class="p-3 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                <span class="text-2xl">${L.NEXT_DAY}</span>
            </button>
        </div>
        
        <!-- Day Content -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
            ${dayIntakes.length > 0 ? renderIntakesList(dayIntakes) : `
                <div class="text-center py-8">
                    <div class="text-5xl mb-4">📋</div>
                    <p class="text-gray-500 mb-3">${L.NO_INTAKES}</p>
                    <button id="day-schedule-btn" class="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                        ${L.SCHEDULE_LINK}
                    </button>
                </div>
            `}
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-col gap-3">
            <button id="day-back-calendar-btn" class="w-full py-3 px-4 bg-teal-50 text-teal-700 font-medium rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors flex items-center justify-center gap-2">
                <span>📅</span> ${L.BACK_CALENDAR}
            </button>
            <button id="day-back-home-btn" class="w-full py-3 px-4 bg-gray-50 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <span>🏠</span> ${L.BACK_HOME}
            </button>
        </div>
    `;
    
    // Setup day view event listeners
    setupDayViewListeners();
}

/**
 * Render intakes list for day view
 */
function renderIntakesList(intakes) {
    const savedIntakes = getData(APP_CONFIG.STORAGE_KEYS.INTAKES) || [];

    return `
        <div class="space-y-3">
            ${intakes.map(intake => {
                const intakeKey = `${intake.courseId}_${intake.date}_${intake.slot}`;
                const isTaken = savedIntakes.some(si => si.id === intakeKey && si.taken);
                
                return `
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl transition-all ${isTaken ? 'opacity-60' : ''}">
                        <label class="relative flex items-center justify-center cursor-pointer">
                            <input type="checkbox" class="intake-checkbox sr-only" data-intake-id="${intakeKey}" ${isTaken ? 'checked' : ''}>
                            <div class="w-6 h-6 border-2 border-teal-200 rounded-lg transition-all flex items-center justify-center check-box-visual ${isTaken ? 'bg-teal-500 border-teal-500' : 'bg-white'}">
                                <svg class="w-3 h-3 text-white ${isTaken ? 'block' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                        </label>
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-gray-800 text-sm truncate ${isTaken ? 'line-through text-gray-400' : ''}">${intake.courseName}</p>
                            <p class="text-xs text-gray-500">${intake.exactTime || intake.slotLabel} • ${intake.dose}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Setup day view event listeners
 */
function setupDayViewListeners() {
    // Previous day
    const prevBtn = document.getElementById('day-prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            viewingDate.setDate(viewingDate.getDate() - 1);
            renderDayView();
        });
    }
    
    // Next day
    const nextBtn = document.getElementById('day-next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            viewingDate.setDate(viewingDate.getDate() + 1);
            renderDayView();
        });
    }
    
    // Intake checkboxes
    document.querySelectorAll('#cal-day-view .intake-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            toggleIntake(e.target.dataset.intakeId, e.target.checked);
        });
    });

    // Schedule link
    const scheduleBtn = document.getElementById('day-schedule-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            // Store date and switch to courses
            sessionStorage.setItem('courseStartDate', viewingDate.toISOString().split('T')[0]);
            const coursesBtn = document.getElementById('nav-courses');
            if (coursesBtn) coursesBtn.click();
        });
    }
    
    // Back to calendar
    const backCalBtn = document.getElementById('day-back-calendar-btn');
    if (backCalBtn) {
        backCalBtn.addEventListener('click', () => {
            hideDayView();
        });
    }
    
    // Back to home
    const backHomeBtn = document.getElementById('day-back-home-btn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => {
            hideDayView();
            const homeBtn = document.getElementById('nav-home');
            if (homeBtn) homeBtn.click();
        });
    }
}

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
            updatedAt: new Date().toISOString()
        });
    }

    if (saveData(APP_CONFIG.STORAGE_KEYS.INTAKES, savedIntakes)) {
        renderDayView();
    }
}

/**
 * Hide day view and return to month view
 */
function hideDayView() {
    isInDayView = false;
    
    // Update selected date to viewing date
    selectedDate = new Date(viewingDate);
    currentDate = new Date(viewingDate);
    
    // Show month view, hide day view
    elements.dayView.classList.add('hidden');
    elements.monthView.classList.remove('hidden');
    
    // Re-render month with updated selection
    renderMonth();
    updateActions(true);
}

/**
 * Get weekday index (Monday = 0, Sunday = 6)
 */
function getWeekdayIndex(date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

/**
 * Get selected date
 */
export function getSelectedDate() {
    return selectedDate;
}

/**
 * Get viewing date (for day view)
 */
export function getViewingDate() {
    return viewingDate;
}

/**
 * Check if in day view
 */
export function isShowingDayView() {
    return isInDayView;
}

/**
 * Refresh calendar (for external calls)
 */
export function refreshCalendar() {
    if (elements.grid) {
        if (isInDayView) {
            renderDayView();
        } else {
            renderMonth();
        }
    }
}
