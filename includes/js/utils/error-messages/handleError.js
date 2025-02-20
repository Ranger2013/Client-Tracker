import { myError } from "../dom/domUtils.js";

/**
 * Handles error logging and optional user feedback
 * @param {ErrorHandlerParams} params - Object containing all error handling parameters
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
        await errorLogs(filename, consoleMsg, err);
        console.warn(consoleMsg, err);

        // Handle UI feedback if needed
        if (userMsg && errorEle) {
            if (typeof errorEle === 'string') {
                errorEle = document.getElementById(errorEle);
            }
            
            const errorMessage = err?.message || '';
            const formattedMsg = `${userMsg}${errorMessage ? `: ${errorMessage}` : ''}<br>${helpDeskTicket}`;
            
            myError(errorEle, formattedMsg);
        }
    } 
    catch (logError) {
        console.error('Error in error handler:', logError);
        if (userMsg && errorEle) {
            myError(
                typeof errorEle === 'string' ? document.getElementById(errorEle) : errorEle,
                'An unexpected error occurred. Please try again.'
            );
        }
    }
}