import { displayErrorMessage, safeDisplayMessage } from '../../utils/dom/messages.js';

/**
 * Configuration options for AppError
 * @typedef {Object} ErrorConfig
 * @property {Error} [originalError] - Original error being wrapped (optional)
 * @property {boolean} [shouldLog=true] - Whether to log the error (defaults to true)
 * @property {string} [userMessage] - User-friendly error message (optional, falls back to technical message)
 * @property {('INITIALIZATION_ERROR'|'NAVIGATION_ERROR'|'BACKUP_ERROR'|'SETTINGS_ERROR'|'DATABASE_ERROR'|'API_ERROR'|'AUTHORIZATION_ERROR'|'RENDER_ERROR'|'INPUT_ERROR'|'UNKNOWN_ERROR')} [errorCode='UNKNOWN_ERROR'] - Error classification code
 * @property {string} [displayTarget='page-msg'] - DOM element ID for error display
 * @property {boolean} [autoHandle=false] - Whether to automatically handle the error
 */

/**
 * Enhanced Error class for application-wide error handling
 * 
 * @example
 * // Basic usage
 * throw new AppError('Failed to load data');
 * 
 * @example
 * // Full configuration
 * const error = new AppError('Database query failed', {
 *     originalError: dbError,
 *     errorCode: AppError.Types.DATABASE_ERROR,
 *     userMessage: 'Unable to load your data',
 *     displayTarget: 'db-error',
 *     shouldLog: true,
 *     autoHandle: true
 * });
 */
export class AppError extends Error {
    static #messageCache = new Map();

    static get BaseMessages() {
        return {
            system: {
                generic: 'A system error occurred. Please refresh the page.',
                network: 'Network connection error. Please check your connection.',
                server: 'Server error occurred. Please try again later.',
                initialization: 'System initialization failed. Please refresh the page.',
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
                search: 'Search functionality is currently unavailable.'
            }
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
        } catch (err) {
            // Fallback to base messages
            return this.BaseMessages;
        }
    }

    /**
     * Creates a new AppError instance
     * @param {string} [message='An unexpected error occurred'] - Technical error message
     * @param {ErrorConfig} [config={}] - Error configuration options
     */
    constructor(message = 'An unexpected error occurred', config = {}) {
        super(message);
        this.name = 'AppError';
        this.originalError = config.originalError || null;
        this.shouldLog = config.shouldLog ?? true;
        this.userMessage = config.userMessage || message; // Use technical message if no user message
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
            'API_ERROR'
        ];

        if (criticalErrors.includes(this.errorCode)) {
            this.userMessage = `${this.userMessage} ${AppError.BaseMessages.system.helpDesk}`;
        }
    }

    // Static error types
    static get Types() {
        return {
            INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
            NAVIGATION_ERROR: 'NAVIGATION_ERROR',
            BACKUP_ERROR: 'BACKUP_ERROR',
            SETTINGS_ERROR: 'SETTINGS_ERROR',
            DATABASE_ERROR: 'DATABASE_ERROR',
            API_ERROR: 'API_ERROR',
            AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
            RENDER_ERROR: 'RENDER_ERROR',
            INPUT_ERROR: 'INPUT_ERROR'
        };
    }

    /**
     * Handles error with logging and display
     */
    async handle(shouldRethrow = false) {
        try {
            if (this.shouldLog && !this.logged) {
                await this.logError();
            }

            await this.displayError();

            if (shouldRethrow) {
                throw this;
            }
        }
        catch (handlingError) {
            console.error('Error handling failed:', handlingError);
            this.displayFallbackError();
            if (shouldRethrow) throw handlingError;
        }
    }

    /**
     * Logs error to server with dynamic imports
     * @private
     */
    async logServerSideError() {
        try {
            // Import dependencies
            const { fetchData } = await import('../../network/services/network.js');
            const { getValidationToken } = await import('../../auth/services/tokenUtils.js');

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

        } catch (loggingError) {
            console.error('Server logging failed:', loggingError);
            await this.queueForSync()
                .catch(err => console.warn('Failed to queue error:', err));
            throw loggingError;
        }
    }

    /**
     * Main error logging method
     */
    async logError() {
        try {
            await this.logServerSideError();
        } catch (loggingError) {
            console.error('Error logging failed:', loggingError);
            // Still attempt to queue even if server logging failed
            await this.queueForSync();
        }
    }

    /**
     * Displays error message to user
     */
    async displayError() {
        try {
            await safeDisplayMessage({
                elementId: this.displayTarget,
                message: this.userMessage,
                isSuccess: false
            });
        }
        catch (displayError) {
            console.error('Display error:', displayError);
            this.displayFallbackError();
        }
    }

    /**
     * Fallback error display
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
     * Queues error for sync when offline
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
     * Creates an AppError from an existing error
     */
    static from(error, config = {}) {
        return new AppError(error.message, {
            originalError: error,
            ...config
        });
    }
}
