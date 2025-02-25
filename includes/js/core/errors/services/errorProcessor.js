/**
 * Processes errors with consistent handling patterns
 * @param {Error} error - The error to process
 * @param {Object} config - Error handling configuration
 * @param {string} config.context - Context where error occurred (e.g., 'navigation', 'initialization')
 * @param {string} config.defaultMessage - Default user message for unhandled errors
 * @param {Object} [config.handlers] - Custom handlers for specific error types
 * @param {string} [config.errorElement='page-msg'] - DOM element ID for error display
 * @returns {Promise<void>}
 */
export async function processError(error, config) {
    const { context, defaultMessage, handlers = {}, errorElement = 'page-msg' } = config;

    // Lazy load required modules only when needed
    const { handleError } = await import('./errorHandler.js');
    
    // Check for custom handlers first
    for (const [ErrorClass, handler] of Object.entries(handlers)) {
        if (error instanceof ErrorClass) {
            return handler(error);
        }
    }

    // Default AppError handling
    if (error.name === 'AppError') {
        return handleError({
            filename: `${context}Error`,
            consoleMsg: `${context} error:`,
            err: error,
            userMsg: error.userMessage,
            errorEle: errorElement
        });
    }

    // Handle unexpected errors
    return handleError({
        filename: `${context}Error`,
        consoleMsg: `Unexpected ${context} error:`,
        err: error,
        userMsg: defaultMessage,
        errorEle: errorElement
    });
}
