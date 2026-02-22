import { APP_CONFIG } from './config.js';
import { initNavigation, setActiveSection, getActiveSection } from './navigation.js';
import { initPackageForm } from './packages.js';
import { initCalendar } from './calendar.js';
import { initCourseForm } from './courses.js';
import { initHome } from './home.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize with Home as default section
    initNavigation('home');
    initPackageForm();
    initCalendar();
    initCourseForm();
    initHome();

    // Settings button handler - toggle on/off
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const currentSection = getActiveSection();
            if (currentSection === 'settings') {
                // If already in settings, go back to home
                setActiveSection('home');
            } else {
                setActiveSection('settings');
            }
        });
    }
});