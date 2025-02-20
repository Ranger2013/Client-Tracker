import { myError } from "../dom/domUtils.js";

/**
 * Handles errors by logging them and optionally displaying user messages
 * @param {Object} options - Error handling options
 * @param {string} options.filename - Name of file for error logging
 * @param {string} options.consoleMsg - Message to show in console
 * @param {Error} options.err - The error object
 * @param {string} [options.userMsg] - Optional message to show to user
 * @param {string} [options.errorEle] - Optional DOM element ID for displaying error
 * @returns {Promise<void>}
 * @throws {Error} If the error logging itself fails
 * 
 * @example
 * handleError({
 *   filename: 'myFile.js',
 *   consoleMsg: 'Failed to fetch data',
 *   err: error,
 *   userMsg: 'Unable to load data',
 *   errorEle: 'errorDiv'
 * });
 */
export async function handleError({ filename, consoleMsg, err, userMsg = null, errorEle = null }) {
    try {
        const [ticket, errorLog] = await Promise.all([
            import("../error-messages/errorMessages.js"),
            import("../error-messages/errorLogs.js"),
        ]);

        const { helpDeskTicket } = ticket;
        const { default: errorLogs } = errorLog;

        // Log error first
        await errorLogs(filename, consoleMsg, err); // err might be undefined here

        // Handle UI feedback if needed
        if (userMsg && errorEle) {
            const formattedMsg = `${userMsg}<br>${helpDeskTicket}`;

            myError(errorEle, formattedMsg);
        }
    } catch (logError) {
        if (errorEle) {
            const element = typeof errorEle === 'string' ? 
                document.getElementById(errorEle) 
                : errorEle;
            myError(element, 'An unexpected error occurred. Please try again.');
        }
    }
}