import { safeDisplayMessage } from "../../../../../../core/utils/dom/messages.js";
import { isNumeric } from "../../../../../../core/utils/validation/validators.js";
import { top } from "../../../../../../core/utils/window/scroll.js";

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
            const { default: displayFormValidationErrors } = await import("../../../../../../core/utils/dom/forms/displayFormValidationErrors.js");

            await displayFormValidationErrors(validationErrors);
            return;
        }

        // Only import and instantiate if validation passes
        const { addFuelCharges } = await import("./manageFuelCharges.js");
        const manageFuelCharges = await addFuelCharges({ userData, formType: 'range', manageUser });
        
        if (manageFuelCharges) {
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Fuel Charges have been added',
                isSuccess: true,
            });
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
        const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
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
 * Validates a mileage range input.
 * @param {string} input - The mileage range input string to validate (e.g., "50-59+" or "71-80").
 * @returns {boolean} - Returns true if the input is valid, otherwise false.
 */
export function validateRange(input) {
	const pattern = /(\d{1,})-(\d{1,})\+?/;
	const match = input.match(pattern);
	
	if (!match) {
		 // Input does not match the pattern
		 return false;
	}
	
	// Extract the first and second numbers from the matched groups
	const start = parseInt(match[1], 10); // Parse with radix 10
	const end = parseInt(match[2], 10);   // Parse with radix 10
	
	// Ensure the first number is smaller than the second number
	if (start >= end) {
		 return false;
	}

	// Input is valid if it matches the pattern and start < end
	return true;
}

