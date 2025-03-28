import { top } from "../../window/scroll.js";
import { safeDisplayMessage } from "../messages.js";
import { underscoreToHyphen, underscoreToHyphenPlusError } from "../../string/stringUtils.js";

/**
 * Displays form validation errors on the page by finding and populating error elements.
 * 
 * @async
 * @param {Array<Object>} errors - Array of validation error objects
 * @param {string} errors[].input - Field identifier matching the form input name
 *                                  (e.g., 'horse_name' for an input with name="horse_name")
 * @param {string} errors[].message - Error message to display for this field
 * 
 * @param {Object} [options={}] - Optional configuration
 * @param {string} [options.formMessage='Please fix the following errors'] - General error message 
 *                                                                          displayed at the top of the form
 * @param {boolean} [options.scrollToTop=true] - Whether to automatically scroll to the top of the form
 * 
 * @returns {Promise<void>} - Resolves when errors are displayed
 * 
 * @throws {Error} When errors array is invalid or empty
 * 
 * @example
 * // Basic usage
 * await displayFormValidationErrors([
 *   { input: 'horse_name', message: 'Horse name cannot be empty' },
 *   { input: 'trim_cycle', message: 'Please select a valid trim cycle' }
 * ]);
 * 
 * @example
 * // With custom options
 * await displayFormValidationErrors(
 *   [{ input: 'email', message: 'Invalid email format' }],
 *   { 
 *     formMessage: 'Please correct these issues before continuing',
 *     scrollToTop: false 
 *   }
 * );
 * 
 * @description
 * For each error, the function will find an element with ID matching '{input}-error'
 * (e.g., 'horse-name-error' for input='horse_name') and display the error message.
 * The function also highlights the corresponding input fields and shows a summary message.
 */
export default async function displayFormValidationErrors(errors, options = {}) {
    const {
        formMessage = 'Please fix the following errors',
        scrollToTop = true
    } = options;

    try {
        // Validate errors parameter
        if (!Array.isArray(errors) || errors.length === 0) {
            console.warn('displayFormValidationErrors called with invalid or empty errors array:', errors);
            return; // Silent fail - no need to show error to user if there's nothing to display
        }

        // Validate array contents
        const validErrors = errors.filter(error => 
            error && 
            typeof error === 'object' &&
            typeof error.input === 'string' &&
            typeof error.msg === 'string'
        );

        if (validErrors.length === 0) {
            console.warn('No valid error entries found in:', errors);
            return; // Silent fail - nothing valid to display
        }

        // Display valid errors
        for (const { input, msg } of validErrors) {
            safeDisplayMessage({
                elementId: underscoreToHyphenPlusError(input),
                message: msg,
                targetId: underscoreToHyphen(input)
            });
        }

        // Show general form message
        safeDisplayMessage({
            elementId: 'form-msg',
            message: formMessage
        });

        // Scroll to top if needed
        if (scrollToTop) top();
    }
    catch (err) {
        const { AppError } = await import("../../../errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_VALIDATION_ERROR,
            userMessage: null,
        });
    }
}