/**
 * @typedef {Object} ErrorConfig
 * @property {Error} [originalError] - Original error if wrapping
 * @property {boolean} [shouldLog=true] - Whether error should be logged
 * @property {string} [userMessage] - User-friendly message
 * @property {string} [errorCode] - Error classification code
 * @property {string} [displayTarget='page-msg'] - DOM element ID for error display
 */

export class AppError extends Error {
    /**
     * Creates an application error with enhanced tracking and display capabilities
     * @param {string} message - Technical error message
     * @param {ErrorConfig} config - Error configuration
     */
    constructor(message, {
        originalError = null,
        shouldLog = true,
        userMessage = null,
        errorCode = null,
        displayTarget = 'page-msg'
    } = {}) 
    {
        super(message);

        this.name = 'AppError';
        this.originalError = originalError;
        this.shouldLog = shouldLog;
        this.userMessage = userMessage ?? 'An unexpected error occurred';
        this.errorCode = errorCode;
        this.logged = false;
        this.displayTarget = displayTarget;

        // Maintains proper stack trace
        Error.captureStackTrace?.(this, this.constructor);
    }

    /**
     * Creates an error instance from an existing error
     * @param {Error} error - Original error to wrap
     * @param {Partial<ErrorConfig>} config - Additional configuration
     */
    static from(error, config = {}) 
    {
        return new AppError(error.message, {
            originalError: error,
            ...config
        });
    }
}
