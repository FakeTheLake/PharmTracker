/**
 * calendar.js — Calendar section component.
 *
 * Features:
 *   · Month grid with day selection & today highlight
 *   · Green dot indicators for days with scheduled intakes
 *   · Day view with real schedule + intake checkboxes
 *   · Intake persistence to localStorage
 */

import { safeGetArray, saveArray } from '../utils/storage.js';
import {
    generateId, escapeHtml, formatDateRu, formatDateISO,
    formatRuNum, isSameDay, isToday, typeEmoji,
    russianMonths, russianWeekdays,
} from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { showSection, registerRefresh } from '../ui/navigation.js';
import { generateDaySchedule, hasScheduledIntakes } from '../services/schedule.js';

// ── State ──────────────────────────────────

let calendarCurrentDate  = new Date();
let calendarSelectedDate = null;

// ── DOM References ─────────────────────────

const monthView              = document.getElementById('calendarMonthView');
const dayView                = document.getElementById('calendarDayView');
const gridEl                 = document.getElementById('calendarGrid');
const monthTitleEl           = document.getElementById('calendarMonthTitle');
const selectedDateDisplayEl  = document.getElementById('calendarSelectedDateDisplay');
const viewScheduleBtn        = document.getElementById('calendarViewScheduleBtn');
const startCourseBtn         = document.getElementById('calendarStartCourseBtn');
const dayViewTitleEl         = document.getElementById('dayViewTitle');
const dayViewWeekdayEl       = document.getElementById('dayViewWeekday');

// ── Month Grid ─────────────────────────────

/** Render the calendar month grid */
export function renderCalendarGrid() {
    const year  = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    monthTitleEl.textContent = `${russianMonths[month]} ${year}`;
    gridEl.innerHTML = '';

    const firstDay     = new Date(year, month, 1);
    let startDay       = firstDay.getDay() - 1; // Monday = 0
    if (startDay < 0) startDay = 6;

    const totalDays    = new Date(year, month + 1, 0).getDate();
    const prevLast     = new Date(year, month, 0).getDate();
    const totalCells   = Math.ceil((startDay + totalDays) / 7) * 7;

    // Pre-load active courses for dot indicators
    const activeCourses = safeGetArray('medicationCourses').filter(c => c.isActive);

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('button');
        cell.className = 'h-10 flex flex-col items-center justify-center text-sm rounded-lg transition-all duration-200 relative';

        let dayNum, cellDate, isCurrent = true;

        if (i < startDay) {
            // Previous month
            dayNum   = prevLast - startDay + i + 1;
            cellDate = new Date(year, month - 1, dayNum);
            isCurrent = false;
            cell.classList.add('text-slate-300');
        } else if (i >= startDay + totalDays) {
            // Next month
            dayNum   = i - startDay - totalDays + 1;
            cellDate = new Date(year, month + 1, dayNum);
            isCurrent = false;
            cell.classList.add('text-slate-300');
        } else {
            // Current month
            dayNum   = i - startDay + 1;
            cellDate = new Date(year, month, dayNum);
            cell.classList.add('text-slate-700', 'hover:bg-slate-100');
        }

        cell.textContent = dayNum;

        // Today highlight
        if (isToday(cellDate)) {
            cell.classList.add('bg-indigo-100', 'text-indigo-700', 'font-semibold');
            cell.classList.remove('text-slate-700', 'text-slate-300');
        }

        // Selected highlight
        if (calendarSelectedDate && isSameDay(cellDate, calendarSelectedDate)) {
            cell.classList.add('border-2', 'border-indigo-500');
            if (!isToday(cellDate)) cell.classList.add('font-semibold');
        }

        // Green dot: scheduled intakes exist
        if (isCurrent && hasScheduledIntakes(cellDate, activeCourses)) {
            const dot = document.createElement('span');
            dot.className = 'absolute bottom-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full';
            cell.appendChild(dot);
        }

        // Click handler (capture date by value)
        const d = new Date(cellDate);
        cell.addEventListener('click', () => selectCalendarDay(d));
        gridEl.appendChild(cell);
    }
}

// ── Day Selection ──────────────────────────

function selectCalendarDay(date) {
    calendarSelectedDate = date;
    renderCalendarGrid();

    selectedDateDisplayEl.innerHTML =
        `<span class="text-slate-700 font-medium">${formatDateRu(date)}</span>`;

    viewScheduleBtn.disabled  = false;
    startCourseBtn.disabled   = false;
}

// ── Month / Day View Switching ─────────────

function showDayView() {
    if (!calendarSelectedDate) return;
    monthView.classList.add('hidden');
    dayView.classList.remove('hidden');
    updateDayViewHeader();
    renderDaySchedule();
}

function showMonthView() {
    dayView.classList.add('hidden');
    monthView.classList.remove('hidden');
    calendarCurrentDate = new Date(calendarSelectedDate || new Date());
    renderCalendarGrid();
}

function updateDayViewHeader() {
    if (!calendarSelectedDate) return;
    dayViewTitleEl.textContent   = formatDateRu(calendarSelectedDate);
    dayViewWeekdayEl.textContent = russianWeekdays[calendarSelectedDate.getDay()];
}

function dayViewShift(delta) {
    if (!calendarSelectedDate) return;
    calendarSelectedDate = new Date(calendarSelectedDate);
    calendarSelectedDate.setDate(calendarSelectedDate.getDate() + delta);
    updateDayViewHeader();
    renderDaySchedule();
}

// ── Navigate to Courses ────────────────────

function calendarGoToCourses() {
    showSection('sectionCourses');
    if (calendarSelectedDate) {
        const startDateInput = document.getElementById('courseStartDate');
        if (startDateInput) {
            startDateInput.value = formatDateISO(calendarSelectedDate);
            startDateInput.dispatchEvent(new Event('change')); // triggers validation
        }
        showToast('Дата начала установлена');
    }
    document.getElementById('addCourseForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Navigate to Today (called from Home) ───

/** Public: jump to today's day view */
export function navigateToToday() {
    showSection('sectionCalendar');
    calendarCurrentDate  = new Date();
    calendarSelectedDate = new Date();
    renderCalendarGrid();
    selectCalendarDay(new Date());
    showDayView();
}

// ── Day Schedule Rendering ─────────────────

const TIME_LABELS = {
    morning: '🌅 Утро',
    day:     '☀️ День',
    evening: '🌆 Вечер',
    night:   '🌙 Ночь',
};
const TIME_ORDER = ['morning', 'day', 'evening', 'night'];

function renderDaySchedule() {
    const container = document.getElementById('dayScheduleContent');
    if (!calendarSelectedDate) { container.innerHTML = ''; return; }

    const dateStr  = formatDateISO(calendarSelectedDate);
    const schedule = generateDaySchedule(dateStr);
    const intakes  = safeGetArray('medicationIntakes');

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selD  = new Date(dateStr + 'T00:00:00');
    const isFuture = selD > today;

    // ── Empty state ──
    if (schedule.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-700 mb-2">В этот день приёмов не запланировано</h3>
                <p class="text-sm text-slate-400 mb-4">Создайте курс, чтобы добавить приёмы</p>
                <button data-action="go-to-courses"
                    class="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Запланировать приём
                </button>
            </div>`;
        attachGoToCourses(container);
        return;
    }

    // ── Summary bar ──
    const takenCount = schedule.filter(item =>
        intakes.some(i => i.courseId === item.courseId && i.date === dateStr && i.timeOfDay === item.timeOfDay)
    ).length;
    const totalCount = schedule.length;
    const pct = totalCount ? (takenCount / totalCount * 100) : 0;

    let html = `
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3">
            <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Приёмов: <strong class="text-slate-700">${totalCount}</strong></span>
                <span class="text-slate-500">Выполнено:
                    <strong class="${takenCount === totalCount ? 'text-emerald-600' : 'text-amber-600'}">${takenCount}/${totalCount}</strong>
                </span>
            </div>
            <div class="mt-2 w-full bg-slate-100 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full transition-all duration-300" style="width:${pct}%"></div>
            </div>
        </div>`;

    // ── Group by time of day ──
    const groups = {};
    schedule.forEach(item => {
        if (!groups[item.timeOfDay]) groups[item.timeOfDay] = [];
        groups[item.timeOfDay].push(item);
    });

    TIME_ORDER.forEach(time => {
        if (!groups[time]) return;
        html += `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-3">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <h4 class="text-sm font-medium text-slate-600">${TIME_LABELS[time]}</h4>
                </div>
                <div class="divide-y divide-slate-100">`;

        groups[time].forEach(item => {
            const taken       = intakes.some(i => i.courseId === item.courseId && i.date === dateStr && i.timeOfDay === item.timeOfDay);
            const takenCls    = taken ? 'intake-taken' : '';
            const checkedAttr = taken ? 'checked' : '';
            const disabledAttr = isFuture ? 'disabled' : '';

            html += `
                <div class="intake-row flex items-center gap-3 px-4 py-3 ${takenCls}"
                     data-course-id="${item.courseId}" data-date="${dateStr}"
                     data-time="${item.timeOfDay}" data-dose="${item.dose}">
                    <input type="checkbox" ${checkedAttr} ${disabledAttr}
                        class="intake-cb w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0 cursor-pointer">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-700 text-sm">
                            ${typeEmoji(item.packageType)} ${escapeHtml(item.courseName)}
                        </div>
                        <div class="text-xs text-slate-400 flex flex-wrap gap-x-2 mt-0.5">
                            <span>${formatRuNum(item.dose)} шт.</span>
                            ${item.dosageInfo ? `<span>· ${escapeHtml(item.dosageInfo)}</span>` : ''}
                            ${item.mealCondition ? `<span>· ${escapeHtml(item.mealCondition)}</span>` : ''}
                        </div>
                    </div>
                    <span class="intake-status text-xs ${taken ? 'text-emerald-500' : 'text-slate-300'} flex-shrink-0">
                        ${taken ? '✓' : '○'}
                    </span>
                </div>`;
        });

        html += '</div></div>';
    });

    container.innerHTML = html;

    // Attach checkbox listeners
    container.querySelectorAll('.intake-cb').forEach(cb => {
        cb.addEventListener('change', function () {
            const row = this.closest('.intake-row');
            handleIntakeToggle(row, this.checked);
        });
    });
}

// ── Intake Persistence ─────────────────────

function handleIntakeToggle(row, isChecked) {
    const { courseId, date, time, dose } = row.dataset;
    let intakes = safeGetArray('medicationIntakes');

    if (isChecked) {
        intakes.push({
            id:           generateId(),
            courseId,
            date,
            timeOfDay:    time,
            actualAmount: parseFloat(dose) || 1,
            takenAt:      new Date().toISOString(),
        });
        row.classList.add('intake-taken');
        const status = row.querySelector('.intake-status');
        if (status) { status.textContent = '✓'; status.classList.replace('text-slate-300', 'text-emerald-500'); }
    } else {
        intakes = intakes.filter(i => !(i.courseId === courseId && i.date === date && i.timeOfDay === time));
        row.classList.remove('intake-taken');
        const status = row.querySelector('.intake-status');
        if (status) { status.textContent = '○'; status.classList.replace('text-emerald-500', 'text-slate-300'); }
    }

    saveArray('medicationIntakes', intakes);

    // Re-render to update the progress bar
    renderDaySchedule();
}

// ── Event Delegation for dynamic buttons ───

function attachGoToCourses(container) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="go-to-courses"]')) {
            calendarGoToCourses();
        }
    });
}

// ── Initialization ─────────────────────────

export function initCalendar() {
    // Month navigation
    document.getElementById('calendarPrevMonth').addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendarGrid();
    });
    document.getElementById('calendarNextMonth').addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendarGrid();
    });
    document.getElementById('calendarTodayBtn').addEventListener('click', () => {
        calendarCurrentDate  = new Date();
        calendarSelectedDate = new Date();
        renderCalendarGrid();
        selectCalendarDay(new Date());
    });

    // Day view controls
    viewScheduleBtn.addEventListener('click', showDayView);
    startCourseBtn.addEventListener('click', calendarGoToCourses);
    document.getElementById('dayViewPrevDay').addEventListener('click', () => dayViewShift(-1));
    document.getElementById('dayViewNextDay').addEventListener('click', () => dayViewShift(1));
    document.getElementById('dayViewBackBtn').addEventListener('click', showMonthView);

    // Listen for "navigate to today" from home section (avoids circular import)
    window.addEventListener('pharmtracker:navigate-to-today', navigateToToday);

    // Register refresh & initial render
    registerRefresh('sectionCalendar', renderCalendarGrid);
    renderCalendarGrid();
}
