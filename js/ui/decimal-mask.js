/**
 * decimal-mask.js — Input mask for Russian decimal numbers.
 *
 * Rules:
 *   · Only digits and comma allowed
 *   · Dot is auto-replaced with comma on input
 *   · At most one comma (decimal separator)
 */

/**
 * Apply the decimal mask to a single <input> element.
 * @param {HTMLInputElement} input
 */
export function applyDecimalMask(input) {
    input.addEventListener('input', () => {
        // Replace dot → comma, strip non-digit/comma chars
        let value = input.value.replace(/\./g, ',').replace(/[^\d,]/g, '');

        // Allow only one comma
        const parts = value.split(',');
        if (parts.length > 2) {
            value = parts[0] + ',' + parts.slice(1).join('');
        }

        input.value = value;
    });
}

/**
 * Auto-discover and mask all inputs with the [data-decimal] attribute.
 */
export function initAllDecimalMasks() {
    document.querySelectorAll('[data-decimal]').forEach(el => applyDecimalMask(el));
}
