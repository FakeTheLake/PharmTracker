import { APP_CONFIG } from './config.js';
import { saveData, getData, showToast, parseDecimal } from './utils.js';

// Module state
let editingPackageId = null;

export function initPackageForm() {
    const container = document.getElementById('packages-container');
    if (!container) return;

    // Build the form HTML
    container.innerHTML = `
        <div class="mb-6">
            <button id="pkg-toggle-btn" class="w-full py-3 px-4 bg-teal-50 text-teal-700 font-medium rounded-xl border border-teal-100 flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors">
                ${APP_CONFIG.LABELS.BUTTONS.ADD_PKG}
            </button>
        </div>

        <div id="pkg-form-container" class="hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
            <div class="space-y-4">
                <!-- Basic Fields -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${APP_CONFIG.LABELS.FORM.TRADE_NAME} <span class="text-red-400">*</span></label>
                    <div class="relative">
                        <input type="text" id="pkg-name" class="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" placeholder="${APP_CONFIG.LABELS.PLACEHOLDERS.PKG_NAME}">
                        <button type="button" class="clear-input-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hidden p-1" data-target="pkg-name">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${APP_CONFIG.LABELS.FORM.DOSAGE} <span class="text-red-400">*</span></label>
                    <div class="flex gap-2">
                        <input type="number" id="pkg-dose-val" class="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" placeholder="0" step="any">
                        <select id="pkg-dose-unit" class="w-24 px-2 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500 outline-none">
                            ${Object.entries(APP_CONFIG.LABELS.FORM.UNITS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Extended Fields (Hidden by default) -->
                <div id="pkg-extended-fields" class="hidden space-y-4 border-t border-gray-100 pt-4 mt-4">
                    
                    <!-- Row 1: Qty per Pkg & Stock -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${APP_CONFIG.LABELS.FORM.EXTENDED.QTY_PER_PKG} <span class="text-gray-300">(${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL})</span></label>
                            <input type="number" id="pkg-qty" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="0" step="any">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${APP_CONFIG.LABELS.FORM.EXTENDED.STOCK} <span class="text-gray-300">(${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL})</span></label>
                            <input type="number" id="pkg-stock" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="0" step="any">
                        </div>
                    </div>

                    <!-- Row 2: Type & Indications -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${APP_CONFIG.LABELS.FORM.EXTENDED.TYPE}</label>
                            <input type="text" id="pkg-type" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL}">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">${APP_CONFIG.LABELS.FORM.EXTENDED.INDICATIONS}</label>
                            <input type="text" id="pkg-indications" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL}">
                        </div>
                    </div>

                    <!-- Substance -->
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">${APP_CONFIG.LABELS.FORM.EXTENDED.SUBSTANCE}</label>
                        <div class="relative">
                            <input type="text" id="pkg-substance" class="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL}">
                            <button type="button" class="clear-input-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hidden p-1" data-target="pkg-substance">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Display Name -->
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-medium text-gray-500">${APP_CONFIG.LABELS.FORM.EXTENDED.DISPLAY_NAME} 
                                <span class="text-gray-400 cursor-help" title="${APP_CONFIG.LABELS.FORM.EXTENDED.AUTO_FILL_TIP}">ⓘ</span>
                            </label>
                            <button id="pkg-autofill-btn" type="button" class="text-teal-600 hover:text-teal-800 text-xs flex items-center gap-1" title="${APP_CONFIG.LABELS.FORM.EXTENDED.AUTO_FILL_TIP}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                ${APP_CONFIG.LABELS.FORM.EXTENDED.AUTO_FILL}
                            </button>
                        </div>
                        <div class="relative">
                            <input type="text" id="pkg-display-name" class="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL}">
                            <button type="button" class="clear-input-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hidden p-1" data-target="pkg-display-name">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Comment -->
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">${APP_CONFIG.LABELS.FORM.EXTENDED.COMMENT}</label>
                        <textarea id="pkg-comment" rows="2" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none" placeholder="${APP_CONFIG.LABELS.FORM.EXTENDED.OPTIONAL}"></textarea>
                    </div>

                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-3 mt-6">
                    <button id="pkg-extended-btn" class="text-teal-600 text-sm font-medium hover:text-teal-700 transition-colors text-left flex items-center gap-1">
                        <span>${APP_CONFIG.LABELS.BUTTONS.EXTENDED}</span>
                        <svg id="pkg-extended-icon" class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <button id="pkg-save-btn" class="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-sm active:transform active:scale-95">
                        ${APP_CONFIG.LABELS.BUTTONS.SAVE}
                    </button>
                    <button id="pkg-cancel-btn" class="hidden w-full py-2 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                        ${APP_CONFIG.LABELS.BUTTONS.CANCEL}
                    </button>
                </div>
            </div>
        </div>

        <div id="pkg-list" class="space-y-3 pb-20">
            <!-- List Items will be here -->
        </div>
    `;

    setupEventListeners();
    renderPackageList();
}

function setupEventListeners() {
    const toggleBtn = document.getElementById('pkg-toggle-btn');
    const formContainer = document.getElementById('pkg-form-container');
    const extendedBtn = document.getElementById('pkg-extended-btn');
    const extendedFields = document.getElementById('pkg-extended-fields');
    const extendedIcon = document.getElementById('pkg-extended-icon');
    const autofillBtn = document.getElementById('pkg-autofill-btn');
    const saveBtn = document.getElementById('pkg-save-btn');
    const cancelBtn = document.getElementById('pkg-cancel-btn');
    const clearBtns = formContainer.querySelectorAll('.clear-input-btn');
    const inputs = formContainer.querySelectorAll('input[type="text"], textarea');

    // Main Form Toggle
    toggleBtn.addEventListener('click', () => {
        const isHidden = formContainer.classList.contains('hidden');
        if (isHidden) {
            formContainer.classList.remove('hidden');
            toggleBtn.textContent = APP_CONFIG.LABELS.BUTTONS.CLOSE_FORM;
            toggleBtn.classList.replace('bg-teal-50', 'bg-gray-100');
            toggleBtn.classList.replace('text-teal-700', 'text-gray-600');
        } else {
            formContainer.classList.add('hidden');
            toggleBtn.textContent = APP_CONFIG.LABELS.BUTTONS.ADD_PKG;
            toggleBtn.classList.replace('bg-gray-100', 'bg-teal-50');
            toggleBtn.classList.replace('text-gray-600', 'text-teal-700');
            // Reset edit mode if closing
            if (editingPackageId) {
                cancelEdit();
            }
        }
    });

    // Extended Fields Toggle
    extendedBtn.addEventListener('click', () => {
        const isHidden = extendedFields.classList.contains('hidden');
        const btnText = extendedBtn.querySelector('span');
        
        if (isHidden) {
            extendedFields.classList.remove('hidden');
            btnText.textContent = APP_CONFIG.LABELS.BUTTONS.HIDE_EXTENDED;
            extendedIcon.classList.add('rotate-180');
        } else {
            extendedFields.classList.add('hidden');
            btnText.textContent = APP_CONFIG.LABELS.BUTTONS.EXTENDED;
            extendedIcon.classList.remove('rotate-180');
        }
    });

    // Auto-fill Logic: Trade name + dosage + quantity (if specified) + substance in parentheses (if specified)
    autofillBtn.addEventListener('click', () => {
        const name = document.getElementById('pkg-name').value.trim();
        const dose = document.getElementById('pkg-dose-val').value;
        const unitKey = document.getElementById('pkg-dose-unit').value;
        const unit = APP_CONFIG.LABELS.FORM.UNITS[unitKey];
        const quantity = document.getElementById('pkg-qty').value.trim();
        const substance = document.getElementById('pkg-substance').value.trim();

        if (!name) return;

        let displayName = name;
        if (dose) displayName += ` ${dose} ${unit}`;
        if (quantity) displayName += ` №${quantity}`;
        if (substance) displayName += ` (${substance})`;

        const displayInput = document.getElementById('pkg-display-name');
        displayInput.value = displayName;
        updateClearButton(displayInput);
    });

    // Clear Button Logic
    clearBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                input.value = '';
                input.focus();
                btn.classList.add('hidden');
            }
        });
    });

    // Input Listeners to show/hide clear button
    inputs.forEach(input => {
        input.addEventListener('input', () => updateClearButton(input));
    });

    // Save Logic
    saveBtn.addEventListener('click', handleSavePackage);

    // Cancel Edit
    cancelBtn.addEventListener('click', cancelEdit);
}

function updateClearButton(input) {
    const btn = document.querySelector(`.clear-input-btn[data-target="${input.id}"]`);
    if (!btn) return;
    
    if (input.value.length > 0) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

function handleSavePackage() {
    const tradeNameInput = document.getElementById('pkg-name');
    const doseValInput = document.getElementById('pkg-dose-val');
    const doseUnitInput = document.getElementById('pkg-dose-unit');

    const tradeName = tradeNameInput.value.trim();
    const doseVal = doseValInput.value.trim();
    const doseUnit = doseUnitInput.value;

    // Validation
    if (!tradeName || !doseVal) {
        showToast(APP_CONFIG.LABELS.MESSAGES.VALIDATION_ERROR, 'error');
        if (!tradeName) tradeNameInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        if (!doseVal) doseValInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        return;
    }

    // Remove error classes
    tradeNameInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    doseValInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500');

    // Collect Optional Data
    const pkgQty = document.getElementById('pkg-qty').value;
    const pkgStock = document.getElementById('pkg-stock').value;
    const pkgType = document.getElementById('pkg-type').value.trim();
    const pkgSubstance = document.getElementById('pkg-substance').value.trim();
    const pkgDisplayName = document.getElementById('pkg-display-name').value.trim();
    const pkgIndications = document.getElementById('pkg-indications').value.trim();
    const pkgComment = document.getElementById('pkg-comment').value.trim();

    const packageData = {
        id: editingPackageId || (Date.now() + Math.random()),
        tradeName: tradeName,
        dosage: parseDecimal(doseVal),
        unit: doseUnit,
        unitLabel: APP_CONFIG.LABELS.FORM.UNITS[doseUnit],
        quantity: parseDecimal(pkgQty),
        stock: parseDecimal(pkgStock),
        type: pkgType,
        substance: pkgSubstance,
        displayName: pkgDisplayName || tradeName,
        indications: pkgIndications,
        comment: pkgComment,
        createdAt: editingPackageId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Save
    let packages = getData(APP_CONFIG.STORAGE_KEYS.PACKAGES) || [];
    
    if (editingPackageId) {
        // Update existing
        const index = packages.findIndex(p => p.id === editingPackageId);
        if (index !== -1) {
            packageData.createdAt = packages[index].createdAt;
            packages[index] = packageData;
        }
        showToast(APP_CONFIG.LABELS.MESSAGES.UPDATED, 'success');
    } else {
        // Add new
        packages.push(packageData);
        showToast(APP_CONFIG.LABELS.MESSAGES.SAVED, 'success');
    }
    
    if (saveData(APP_CONFIG.STORAGE_KEYS.PACKAGES, packages)) {
        resetForm();
        renderPackageList();
    }
}

function resetForm() {
    editingPackageId = null;
    
    // Clear inputs
    const container = document.getElementById('pkg-form-container');
    container.querySelectorAll('input, textarea, select').forEach(input => {
        if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
        input.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    });
    
    // Hide clear buttons
    container.querySelectorAll('.clear-input-btn').forEach(btn => btn.classList.add('hidden'));

    // Reset save button text
    const saveBtn = document.getElementById('pkg-save-btn');
    saveBtn.textContent = APP_CONFIG.LABELS.BUTTONS.SAVE;

    // Hide cancel button
    document.getElementById('pkg-cancel-btn').classList.add('hidden');

    // Collapse extended fields if open
    const extendedFields = document.getElementById('pkg-extended-fields');
    const extendedBtn = document.getElementById('pkg-extended-btn');
    const extendedIcon = document.getElementById('pkg-extended-icon');
    
    if (!extendedFields.classList.contains('hidden')) {
        extendedFields.classList.add('hidden');
        extendedBtn.querySelector('span').textContent = APP_CONFIG.LABELS.BUTTONS.EXTENDED;
        extendedIcon.classList.remove('rotate-180');
    }
}

function cancelEdit() {
    resetForm();
    // Optionally hide form
    const formContainer = document.getElementById('pkg-form-container');
    const toggleBtn = document.getElementById('pkg-toggle-btn');
    formContainer.classList.add('hidden');
    toggleBtn.textContent = APP_CONFIG.LABELS.BUTTONS.ADD_PKG;
    toggleBtn.classList.replace('bg-gray-100', 'bg-teal-50');
    toggleBtn.classList.replace('text-gray-600', 'text-teal-700');
}

// Render package list
export function renderPackageList() {
    const listContainer = document.getElementById('pkg-list');
    if (!listContainer) return;

    const packages = getData(APP_CONFIG.STORAGE_KEYS.PACKAGES) || [];

    if (packages.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <div class="text-5xl mb-4">📦</div>
                <p class="font-medium">${APP_CONFIG.LABELS.MESSAGES.NO_PACKAGES}</p>
                <p class="text-sm mt-1">${APP_CONFIG.LABELS.MESSAGES.NO_PACKAGES_HINT}</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = packages.map(pkg => `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in" data-pkg-id="${pkg.id}">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${pkg.displayName || pkg.tradeName}</h3>
                    ${pkg.displayName && pkg.displayName !== pkg.tradeName ? `<p class="text-xs text-gray-400">${pkg.tradeName}</p>` : ''}
                </div>
                <span class="text-sm font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                    ${pkg.dosage}${pkg.unitLabel || APP_CONFIG.LABELS.FORM.UNITS[pkg.unit] || pkg.unit}
                </span>
            </div>
            
            <div class="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                ${pkg.type ? `<span class="bg-gray-100 px-2 py-1 rounded">${pkg.type}</span>` : ''}
                ${pkg.substance ? `<span class="bg-purple-50 text-purple-600 px-2 py-1 rounded">${pkg.substance}</span>` : ''}
            </div>

            ${pkg.stock > 0 ? `
                <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span class="text-gray-400">${APP_CONFIG.LABELS.FORM.EXTENDED.STOCK}:</span>
                    <span class="font-medium ${pkg.stock < 10 ? 'text-orange-500' : 'text-green-600'}">${pkg.stock} шт</span>
                </div>
            ` : ''}

            ${pkg.indications ? `
                <p class="text-xs text-gray-500 mb-2"><span class="text-gray-400">${APP_CONFIG.LABELS.FORM.EXTENDED.INDICATIONS}:</span> ${pkg.indications}</p>
            ` : ''}

            ${pkg.comment ? `
                <p class="text-xs text-gray-400 italic mb-3">${pkg.comment}</p>
            ` : ''}

            <div class="flex gap-2 pt-2 border-t border-gray-100">
                <button class="pkg-edit-btn flex-1 py-2 text-sm font-medium text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" data-id="${pkg.id}">
                    ${APP_CONFIG.LABELS.BUTTONS.EDIT}
                </button>
                <button class="pkg-delete-btn flex-1 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${pkg.id}">
                    ${APP_CONFIG.LABELS.BUTTONS.DELETE}
                </button>
                <button class="pkg-course-btn flex-1 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" data-id="${pkg.id}">
                    ${APP_CONFIG.LABELS.BUTTONS.CREATE_COURSE}
                </button>
            </div>
        </div>
    `).join('');

    // Attach event listeners
    attachListEventListeners();
}

function attachListEventListeners() {
    // Edit buttons
    document.querySelectorAll('.pkg-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            editPackage(id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.pkg-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            deletePackage(id);
        });
    });

    // Create Course buttons
    document.querySelectorAll('.pkg-course-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            createCourseFromPackage(id);
        });
    });
}

function editPackage(id) {
    const packages = getData(APP_CONFIG.STORAGE_KEYS.PACKAGES) || [];
    const pkg = packages.find(p => p.id === id);
    if (!pkg) return;

    editingPackageId = id;

    // Show form
    const formContainer = document.getElementById('pkg-form-container');
    const toggleBtn = document.getElementById('pkg-toggle-btn');
    formContainer.classList.remove('hidden');
    toggleBtn.textContent = APP_CONFIG.LABELS.BUTTONS.CLOSE_FORM;
    toggleBtn.classList.replace('bg-teal-50', 'bg-gray-100');
    toggleBtn.classList.replace('text-teal-700', 'text-gray-600');

    // Fill form
    document.getElementById('pkg-name').value = pkg.tradeName || '';
    document.getElementById('pkg-dose-val').value = pkg.dosage || '';
    document.getElementById('pkg-dose-unit').value = pkg.unit || 'MG';
    document.getElementById('pkg-qty').value = pkg.quantity || '';
    document.getElementById('pkg-stock').value = pkg.stock || '';
    document.getElementById('pkg-type').value = pkg.type || '';
    document.getElementById('pkg-substance').value = pkg.substance || '';
    document.getElementById('pkg-display-name').value = pkg.displayName || '';
    document.getElementById('pkg-indications').value = pkg.indications || '';
    document.getElementById('pkg-comment').value = pkg.comment || '';

    // Update clear buttons
    formContainer.querySelectorAll('input[type="text"], textarea').forEach(input => {
        updateClearButton(input);
    });

    // Show extended fields
    const extendedFields = document.getElementById('pkg-extended-fields');
    const extendedBtn = document.getElementById('pkg-extended-btn');
    const extendedIcon = document.getElementById('pkg-extended-icon');
    extendedFields.classList.remove('hidden');
    extendedBtn.querySelector('span').textContent = APP_CONFIG.LABELS.BUTTONS.HIDE_EXTENDED;
    extendedIcon.classList.add('rotate-180');

    // Change save button to update
    document.getElementById('pkg-save-btn').textContent = APP_CONFIG.LABELS.BUTTONS.UPDATE;
    
    // Show cancel button
    document.getElementById('pkg-cancel-btn').classList.remove('hidden');

    // Scroll to form
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deletePackage(id) {
    if (!confirm(APP_CONFIG.LABELS.BUTTONS.CONFIRM_DELETE)) return;

    let packages = getData(APP_CONFIG.STORAGE_KEYS.PACKAGES) || [];
    packages = packages.filter(p => p.id !== id);

    if (saveData(APP_CONFIG.STORAGE_KEYS.PACKAGES, packages)) {
        showToast(APP_CONFIG.LABELS.MESSAGES.DELETED, 'success');
        renderPackageList();
    }
}

function createCourseFromPackage(id) {
    // Switch to Courses tab
    const coursesBtn = document.getElementById('nav-courses');
    if (coursesBtn) {
        coursesBtn.click();
    }
    // Log for now - will be implemented in courses.js
    console.log('Create course from package:', id);
    // Store selected package ID for course form
    sessionStorage.setItem('selectedPackageId', id.toString());
}

// Export function to get packages
export function getPackages() {
    return getData(APP_CONFIG.STORAGE_KEYS.PACKAGES) || [];
}
