import { APP_CONFIG } from './config.js';

// Track current active section
let activeSection = null;

export function initNavigation(initialSection = 'home') {
    const nav = document.getElementById('main-nav');
    const content = document.getElementById('app-content');
    
    // Clear content
    nav.innerHTML = '';
    content.innerHTML = '';

    const sections = [
        { id: 'home', label: APP_CONFIG.LABELS.NAV.HOME, icon: '🏠' },
        { id: 'calendar', label: APP_CONFIG.LABELS.NAV.CALENDAR, icon: '📅' },
        { id: 'courses', label: APP_CONFIG.LABELS.NAV.COURSES, icon: '📋' },
        { id: 'packages', label: APP_CONFIG.LABELS.NAV.PACKAGES, icon: '📦' }
    ];

    sections.forEach(sec => {
        // Create Nav Button
        const btn = document.createElement('button');
        btn.id = `nav-${sec.id}`;
        btn.className = 'flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-teal-600 active:text-teal-800 transition-colors gap-1';
        btn.innerHTML = `
            <span class="text-xl">${sec.icon}</span>
            <span class="text-xs font-medium">${sec.label}</span>
        `;
        
        btn.addEventListener('click', () => {
            setActiveSection(sec.id);
        });

        nav.appendChild(btn);

        // Create Section Container (Hidden by default)
        const sectionDiv = document.createElement('section');
        sectionDiv.id = `section-${sec.id}`;
        sectionDiv.className = 'w-full h-full hidden flex-col animate-fade-in';
        
        // Don't show header for 'home' section as per patch request
        const headerHtml = sec.id === 'home' ? '' : `<h2 class="text-2xl font-bold mb-4 text-gray-800">${Object.values(APP_CONFIG.LABELS.HEADERS)[sections.indexOf(sec)]}</h2>`;
        
        sectionDiv.innerHTML = `
            ${headerHtml}
            <div id="${sec.id}-container" class="flex-1">
                <div class="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    ${APP_CONFIG.LABELS.PLACEHOLDERS.SECTION_DEV}
                </div>
            </div>
        `;
        content.appendChild(sectionDiv);
    });

    // Create Settings Section (not in bottom nav)
    const settingsDiv = document.createElement('section');
    settingsDiv.id = `section-settings`;
    settingsDiv.className = 'w-full h-full hidden flex-col animate-fade-in';
    settingsDiv.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">${APP_CONFIG.LABELS.HEADERS.SETTINGS}</h2>
        <div id="settings-container" class="flex-1">
            <div class="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                ${APP_CONFIG.LABELS.PLACEHOLDERS.SECTION_DEV}
            </div>
        </div>
    `;
    content.appendChild(settingsDiv);

    setActiveSection(initialSection);
}

export function setActiveSection(sectionId) {
    // Track active section
    activeSection = sectionId;
    
    // Update Nav State
    document.querySelectorAll('#main-nav button').forEach(btn => {
        if (btn.id === `nav-${sectionId}`) {
            btn.classList.add('text-teal-600');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('text-teal-600');
            btn.classList.add('text-gray-400');
        }
    });

    // Update Content Visibility
    document.querySelectorAll('#app-content section').forEach(sec => {
        if (sec.id === `section-${sectionId}`) {
            sec.classList.remove('hidden');
            sec.classList.add('flex');
        } else {
            sec.classList.add('hidden');
            sec.classList.remove('flex');
        }
    });
}

// Get current active section
export function getActiveSection() {
    return activeSection;
}
