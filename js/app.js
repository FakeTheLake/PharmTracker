/**
 * app.js — Application entry point & orchestrator.
 *
 * Responsibilities:
 *   · Initialize localStorage
 *   · Initialize all UI modules and components
 *   · Show the default section
 *   · Display welcome toast
 *
 * Import graph (no circular dependencies):
 *
 *   app.js
 *     ├── utils/storage.js
 *     ├── utils/toast.js
 *     ├── ui/navigation.js
 *     ├── ui/decimal-mask.js
 *     ├── components/home.js        → utils/*, services/schedule, ui/navigation
 *     ├── components/calendar.js     → utils/*, services/schedule, ui/navigation
 *     ├── components/courses.js      → utils/*, ui/navigation, ui/decimal-mask
 *     └── components/packages.js     → utils/*, ui/navigation, components/courses
 */

import { initLocalStorage }   from './utils/storage.js';
import { showToast }           from './utils/toast.js';
import { initNavigation, showSection } from './ui/navigation.js';
import { initAllDecimalMasks } from './ui/decimal-mask.js';

import { initHome }            from './components/home.js';
import { initCalendar }        from './components/calendar.js';
import { initCourseForm }      from './components/courses.js';
import { initPackageForm, renderPackageList } from './components/packages.js';

// ── Bootstrap ──────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // 1. Storage — ensure all keys exist
    initLocalStorage();

    // 2. UI infrastructure
    initNavigation();
    initAllDecimalMasks();

    // 3. Components
    initPackageForm();
    renderPackageList();
    initCourseForm();
    initCalendar();
    initHome();

    // 4. Show default section
    showSection('sectionHome');

    // 5. Welcome toast
    setTimeout(() => showToast('Добро пожаловать в ФармТрекер! 💊'), 500);
});
