import { displayErrorMessage, safeDisplayMessage } from '../../utils/dom/messages.min.js';

/**
 * @typedef {Object} AppErrorConfig
 * @property {Error} [originalError] Original error being wrapped
 * @property {boolean} [shouldLog=true] Whether to log the error
 * @property {string} [userMessage] Message to show to user (null for no display)
 * @property {string} [errorCode='UNKNOWN_ERROR'] One of AppError.Types values
 * @property {string} [displayTarget='page-msg'] DOM element ID for error display
 * @property {boolean} [autoHandle=false] Whether to automatically handle error
 * @property {string} [feature] Feature-specific error messages to load
 */

/**
 * Creates a new AppError for handling application-wide errors.
 * @class
 * @extends Error
 */
export class AppError extends Error {
    static #messageCache = new Map();

    static get BaseMessages() {
        return {
            system: {
                generic: 'A system error occurred.',
                network: 'Network connection error. Please check your connection.',
                server: 'Server error occurred. Please try again later.',
                processing: 'An error occurred while processing your request.',
                initialization: 'System initialization failed. Please refresh the page.',
                render: 'An error occurred while trying to render the page.',
                helpDesk: 'If this problem persists, please submit a new Help Desk Ticket for this issue. Thank You'
            },

            // Authentication messages
            auth: {
                tokenInvalid: 'Unable to validate your credentials. Please log in again.',
                unauthorized: 'You are not authorized to access this resource.',
                sessionExpired: 'Your session has expired.',
                loginFailed: 'Login failed. Please check your credentials.'
            },

            // Component-specific messages
            components: {
                navigation: 'Some navigation features are not working. Please refresh the page.',
                backup: 'The backup system is not responding. Your work will still be saved.',
                calendar: 'Calendar features are currently unavailable.',
                search: 'Search functionality is currently unavailable.',
            },

            // Form validation messages
            forms: {
                validationFailed: 'Form validation failed.',
                submissionFailed: 'Form submission failed.',
                noData: 'No local data found for this form.',
            },
        };
    }

    static async getMessages(feature) {
        if (!feature) return this.BaseMessages;

        // Check cache first
        if (this.#messageCache.has(feature)) {
            return this.#messageCache.get(feature);
        }

        try {
            // Try to load feature-specific messages
            const { messages } = await import(`../../../features/${feature}/errors.js`);
            this.#messageCache.set(feature, messages);
            return messages;
        }
        catch (err) {
            // Fallback to base messages
            return this.BaseMessages;
        }
    }

    /**
     * Creates a new AppError instance.
     * @param {string} [message='An unexpected error occurred'] - Technical error message.
     * @param {AppErrorConfig} [config={}] - Error configuration options.
     */
    constructor(message = 'An unexpected error occurred', config = {}) {
        super(message); // Calls Error constructor, sets this.message
        this.name = 'AppError'; // Override the name property, usually Error.
        this.originalError = config.originalError || null;
        this.shouldLog = config.shouldLog ?? true;

        // Explicitly handle null case
        this.userMessage = config.userMessage === null
            ? null
            : (config.userMessage || message);

        this.errorCode = config.errorCode || 'UNKNOWN_ERROR';
        this.logged = false;
        this.displayTarget = config.displayTarget || 'page-msg';

        // Capture stack trace
        Error.captureStackTrace?.(this, this.constructor);

        // Auto-handle if specified
        if (config.autoHandle) {
            this.handle().catch(err =>
                console.error('Auto-handling failed:', err)
            );
        }

        if (config.feature) {
            this.loadFeatureMessages(config.feature)
                .catch(err => console.warn('Failed to load feature messages:', err));
        }

        // Append help desk message for critical errors
        const criticalErrors = [
            'INITIALIZATION_ERROR',
            'NAVIGATION_ERROR',
            'DATABASE_ERROR',
            'API_ERROR',
            'FORM_VALIDATION_ERROR',
            'FORM_SUBMISSION_ERROR'
        ];

        if (criticalErrors.includes(this.errorCode)) {
            this.userMessage = `${this.userMessage} ${AppError.BaseMessages.system.helpDesk}`;
        }
    }

    // Static error types
    static get Types() {
        return {
            INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
            PROCESSING_ERROR: 'PROCESSING_ERROR',
            CALCULATION_ERROR: 'CALCULATION_ERROR',
            NAVIGATION_ERROR: 'NAVIGATION_ERROR',
            BACKUP_ERROR: 'BACKUP_ERROR',
            SETTINGS_ERROR: 'SETTINGS_ERROR',
            DATABASE_ERROR: 'DATABASE_ERROR',
            API_ERROR: 'API_ERROR',
            AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
            RENDER_ERROR: 'RENDER_ERROR',
            INPUT_ERROR: 'INPUT_ERROR',
            FORM_VALIDATION_ERROR: 'FORM_VALIDATION_ERROR',
            FORM_SUBMISSION_ERROR: 'FORM_SUBMISSION_ERROR',
            FORM_POPULATION_ERROR: 'FORM_POPULATION_ERROR',
        };
    }

    /**
     * Static helper to handle any error type.
     * @param {Error} err - Error to handle.
     * @param {Object} [config] - Config to use if creating new AppError.
     * @returns {Promise<void>}
     */
    static async handleError(err, config = {}) {
        if (err instanceof AppError) {
            await err.handle();
        }
        else {

            const error = new AppError(err.message, {
                originalError: err,
                ...config
            });
            await error.handle();
        }
    }

    /**
     * Process any error, creating AppError instance only if needed.
     * @param {Error} error - The error to process.
     * @param {Object} config - Configuration for new AppError if needed.
     * @param {boolean} [shouldThrow=true] - Whether to throw the error after processing.
     * @returns {Promise<AppError>}
     */
    static async process(error, config = {}, shouldThrow = true) {
        let appError;
        if (error instanceof AppError) {
            appError = error;
        }
        else {
            appError = new AppError(error.message, {
                originalError: error,
                ...config
            });
        }

        await appError.handle(shouldThrow);
        return appError;
    }

    /**
     * Handles error with logging and display.
     * @param {boolean} [shouldThrow=false] - Whether to throw the error after handling.
     * @returns {Promise<AppError>}
     */
    async handle(shouldThrow = false) {
        try {
            if (this.shouldLog && !this.logged) {
                await this.logError();
            }
            if (this.userMessage !== null) {
                await this.displayError();
            }
            if (shouldThrow) {
                throw this;
            }
            return this;
        }
        catch (handlingError) {
            // If we're supposed to throw, do it immediately
            if (shouldThrow) {
                throw handlingError;
            }

            // Otherwise, try to handle the failure gracefully
            console.error('Error handling failed:', {
                handling: handlingError.message,
                originalError: this.message
            });
            this.displayFallbackError();
            return this;
        }
    }

    /**
     * Logs error to server with dynamic imports.
     * @private
     * @returns {Promise<void>}
     */
    async logServerSideError() {
        try {
            // Import dependencies
            const [{ fetchData }, { getValidationToken }] = await Promise.all([
                import('../../network/services/network.js'),
                import('../../auth/services/tokenUtils.js')
            ]);

            const token = getValidationToken();
            if (!token) {
                console.warn('No validation token available');
                return;
            }

            // Format error data to match API expectations
            const errorData = {
                page: this.errorCode,
                error: {
                    name: this.name,
                    message: this.message,
                    code: this.errorCode,
                    stack: this.stack?.split('\n'),
                    originalError: this.originalError ? {
                        name: this.originalError.name,
                        message: this.originalError.message,
                        stack: this.originalError.stack?.split('\n')
                    } : null,
                    userMessage: this.userMessage
                }
            };

            const response = await fetchData({
                api: '/includes/api/error-logs/errorLogAPI.php',
                data: errorData,
                token
            });

            this.logged = true;

        }
        catch (loggingError) {
            console.error('Server logging failed:', loggingError);
            await this.queueForSync()
                .catch(err => console.warn('Failed to queue error:', err));
            // throw loggingError;
        }
    }

    /**
     * Main error logging method.
     * @param {boolean} [shouldRethrow=false] - Whether to rethrow the error after logging.
     * @returns {Promise<void>}
     */
    async logError(shouldRethrow = false) {
        // Single source of console logging
        if (!this.logged) {
            console.warn(`${this.name}:`, {
                message: this.message,
                code: this.errorCode,
                originalError: this.originalError
            });
        }

        try {
            await this.logServerSideError();

            if (shouldRethrow) {
                throw this;
            }
        }
        catch (loggingError) {
            console.error('Error logging failed:', loggingError);
            await this.queueForSync();

            if (shouldRethrow) {
                throw loggingError;
            }
        }
    }

    /**
     * Displays error message to user.
     * @returns {Promise<void>}
     */
    async displayError() {
        try {
            // Clear any processing messages first
            const processingMsgs = document.querySelectorAll('[data-msg-type="processing"]');
            processingMsgs.forEach(msg => msg.textContent = '');

            safeDisplayMessage({
                elementId: this.displayTarget,
                message: this.userMessage,
                isSuccess: false
            });
        }
        catch (displayError) {
            // ...existing error handling...
        }
    }

    /**
     * Fallback error display.
     * @returns {void}
     */
    displayFallbackError() {
        try {
            displayErrorMessage(this.displayTarget, 'A system error occurred. Please refresh the page.');
        }
        catch (fallbackError) {
            console.error('Fallback display failed:', fallbackError);
        }
    }

    /**
     * Queues error for sync when offline.
     * @returns {Promise<void>}
     */
    async queueForSync() {
        try {
            const { default: IndexedDBOperations } = await import('../../database/IndexedDBOperations.js');
            const indexed = new IndexedDBOperations();
            const db = await indexed.openDBPromise();
            await indexed.putStorePromise(db, {
                errorCode: this.errorCode,
                message: this.message,
                stack: this.stack,
                timestamp: new Date().toISOString()
            }, indexed.stores.ERRORQUEUE);
        }
        catch (err) {
            console.warn('Failed to queue error:', err);
        }
    }

    /**
     * Creates an AppError from an existing error.
     * @param {Error} error - The existing error.
     * @param {Object} [config] - Configuration for the new AppError.
     * @returns {AppError}
     */
    static from(error, config = {}) {
        return new AppError(error.message, {
            originalError: error,
            ...config
        });
    }
}
