import { top } from "../../window/scroll.min.js";
import { safeDisplayMessage } from "../messages.min.js";
import { underscoreToHyphen, underscoreToHyphenPlusError } from "../../string/stringUtils.min.js";

/**
 * Displays validation errors for form fields
 * @param {Array<{input: string, msg: string}>} errors - Array of validation errors
 * @param {Object} [options] - Display options
 * @param {string} [options.formMessage='Please fix the following errors'] - General form message
 * @param {boolean} [options.scrollToTop=true] - Whether to scroll to top after showing errors
 * @returns {Promise<void>}
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