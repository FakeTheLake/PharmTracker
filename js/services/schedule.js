/**
 * schedule.js — Business logic for generating daily intake schedules.
 *
 * Reads courses and packages from localStorage and produces
 * an ordered list of intake items for a given calendar day.
 */

import { safeGetArray } from '../utils/storage.js';

/** Time-of-day sort order */
const TIME_ORDER = { morning: 0, day: 1, evening: 2, night: 3 };

/** Human-readable labels for each time slot */
const TIME_LABELS = {
    morning: '🌅 Утро',
    day:     '☀️ День',
    evening: '🌆 Вечер',
    night:   '🌙 Ночь',
};

/** All four time slots */
const SLOTS = ['morning', 'day', 'evening', 'night'];

// ── Schedule Generation ────────────────────

/**
 * Build an array of intake items for a specific date.
 *
 * Checks every active course:
 *   · startDate ≤ selectedDate
 *   · interval alignment: (daysDiff % intervalDays) === 0
 *   · for each enabled time slot → create an item
 *
 * @param {string} dateStr — YYYY-MM-DD
 * @returns {Array<Object>} sorted intake items
 */
export function generateDaySchedule(dateStr) {
    const courses = safeGetArray('medicationCourses');
    const pkgs = safeGetArray('medicationPackages');
    const items = [];
    const selectedDate = new Date(dateStr + 'T00:00:00');

    courses.forEach(course => {
        if (!course.isActive || !course.startDate) return;

        const start = new Date(course.startDate + 'T00:00:00');
        if (selectedDate < start) return;

        // Interval check
        const diffDays = Math.round((selectedDate - start) / 86400000);
        const interval = course.intervalDays || 1;
        if (diffDays % interval !== 0) return;

        const pkg = pkgs.find(p => p.id === course.packageId);

        SLOTS.forEach(slot => {
            if (!course.schedule?.[slot]) return;

            // Determine dose for this slot
            let dose = null;
            if (course.useDifferentDoses && course.doses?.[slot] != null) {
                dose = course.doses[slot];
            } else {
                dose = course.dosePerIntake;
            }

            items.push({
                courseId:       course.id,
                courseName:    course.courseName,
                dosageInfo:    pkg ? `${pkg.dosageValue} ${pkg.dosageUnit}` : '',
                packageType:   pkg?.medicationType || '',
                timeOfDay:     slot,
                timeLabel:     TIME_LABELS[slot],
                dose:          dose ?? 1,
                mealCondition: course.mealCondition,
                date:          dateStr,
            });
        });
    });

    // Sort by time of day
    items.sort((a, b) => TIME_ORDER[a.timeOfDay] - TIME_ORDER[b.timeOfDay]);
    return items;
}

// ── Quick Check ────────────────────────────

/**
 * Fast boolean check: does a given date have any scheduled intakes?
 * Used for calendar dot indicators.
 *
 * @param {Date}  date    — the calendar date to check
 * @param {Array} courses — pre-filtered list of active courses
 * @returns {boolean}
 */
export function hasScheduledIntakes(date, courses) {
    for (const c of courses) {
        if (!c.startDate) continue;
        const start = new Date(c.startDate + 'T00:00:00');
        if (date < start) continue;

        const diff = Math.round((date - start) / 86400000);
        const interval = c.intervalDays || 1;
        if (diff % interval !== 0) continue;

        if (c.schedule?.morning || c.schedule?.day || c.schedule?.evening || c.schedule?.night) {
            return true;
        }
    }
    return false;
}
