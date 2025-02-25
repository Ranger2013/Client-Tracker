import { clearMsg, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { isNumeric } from "../../../utils/validation/validationUtils.js";

/**
 * Handles submission of fuel range form
 * @param {SubmitEvent} evt - Form submission event
 */
export default async function handleByRangeFormSubmission({evt, manageUser}) {
    evt.preventDefault();

    try {
        clearMsg({ container: 'form-msg' });
        const byRangeContainer = document.getElementById('by-range-container'); // Used to hide the section
        const fuelRangeContainer = document.getElementById('fuel-range-container'); // Dynamic container for fuel ranges
        
        const userData = Object.fromEntries(new FormData(evt.target));

        // Validate first before loading other modules
        const validationErrors = validateFormInputs(userData);

        if (validationErrors.length > 0) {
            const { default: displayFormValidationErrors } = await import("../../../utils/dom/displayFormValidationErrors.js");
            await displayFormValidationErrors(validationErrors);
            return;
        }

        // Only import and instantiate if validation passes
        const { addFuelCharges } = await import("./helpers/manageFuelCharges.js");
        const manageFuelCharges = await addFuelCharges({ userData, formType: 'range', manageUser });
        
        if (manageFuelCharges) {
            mySuccess('form-msg', 'Fuel Charges have been added');
            evt.target.reset();
            fuelRangeContainer.innerHTML = '';
            byRangeContainer.classList.add('w3-hide');
            top();
        }
        else {
            throw new Error('Failed to add fuel charges');
        }
    }
    catch (err) {
        top();
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'handleByRangeFormSubmissionError',
            consoleMsg: 'Handle by range form submission error: ',
            err,
            userMsg: 'Unable to add mileage charges at this time',
            errorEle: 'form-msg'
        });
    }
}

/**
 * Validates form inputs for fuel range submission
 * @param {Object} userData - Form data from FormData
 * @param {string} userData.ranges - Number of ranges
 * @param {string} userData.cost - Cost per range
 * @param {string} userData.mileage - Mileage range string (e.g., "50-60")
 * @returns {Array<{input: string, msg: string}>} Array of validation errors
 */
function validateFormInputs(userData) {
    const errors = [];

    for (const [key, value] of Object.entries(userData)) {
        if (key.includes('ranges') || key.includes('cost')) {
            if (!isNumeric(value)) {
                errors.push({
                    input: key,
                    msg: 'Input must be numeric.'
                });
            }
        }
        else if (key.includes('mileage')) {
            if (!validateRange(value)) {
                errors.push({
                    input: key,
                    msg: 'Improper range format.'
                });
            }
        }
    }

    return errors;
}

/**
 * Validates mileage range format (e.g., "50-60")
 * @param {string} range - Range string to validate
 * @returns {boolean} True if valid range format
 * @private
 */
function validateRange(range) {
    // Matches pattern: number-number or number-number+
    const rangePattern = /^\d+\-\d+\+?$/;
    return rangePattern.test(range);
}
