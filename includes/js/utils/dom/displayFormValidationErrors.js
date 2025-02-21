import { underscoreToHyphen, underscoreToHyphenPlusError } from "../string/stringUtils.js";
import { myError, top } from "./domUtils.js";

/**
 * Displays validation errors for form fields
 * @param {Array<{input: string, msg: string}>} errors - Array of validation errors
 * @returns {Promise<void>}
 */
export default async function displayFormValidationErrors(errors) {
    try {
        // Loop through the array of objects
        for (const error of errors) { 
            const { input, msg } = error;
            const errorContainer = underscoreToHyphenPlusError(input);
            myError(errorContainer, msg, underscoreToHyphen(input));
        }

        myError('form-msg', 'Please fix the following errors');
        top();
    }
    catch (err) {
        const { handleError } = await import("../error-messages/handleError.js");
        await handleError({
            filename: 'displayFormValidationError',
            consoleMsg: 'Display form validation error: ',
            err,
            userMsg: 'Unable to display validation errors',
            errorEle: 'form-msg'
        });
    }
}