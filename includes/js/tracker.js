/**
 * @fileoverview Main application entry point that handles initialization, 
 * authentication, navigation, and global error boundaries.
 * 
 * Application Flow:
 * 1. Initialize authentication
 * 2. Setup error boundaries
 * 3. Initialize navigation
 * 4. Setup backup checks
 * 
 * Error Handling:
 * - Global error boundary for uncaught errors
 * - Specific handlers for different types of errors
 * - Proper error logging and user feedback
 * 
 * @requires ./core/auth/services/userAuthorization
 * @requires ./core/navigation/services/selectPage
 */

import { userAuthorization } from './core/auth/services/userAuthorization.js';
import selectPage from './core/navigation/services/selectPage.js';

/** 
 * @typedef {string} ValidationToken - User's authentication token
 * @type {ValidationToken|null}
 */
let validationToken = null;

// Initialize in order of importance
initializeTracker();

/**
 * Initializes the application, handling auth and navigation
 * @async
 * @throws {AuthorizationError} When authentication fails
 * @throws {AppError} When initialization fails
 * @returns {Promise<void>}
 */
const initializeApp = async () => {
    try {
        const path = window.location.pathname;
        validationToken = await userAuthorization(path);

        if (validationToken) {
            await initializeTracker();
            window.addEventListener('popstate', handlePageNavigation);
            setupErrorBoundaries();
        }
    } 
    catch (err) {
        if (err instanceof AuthorizationError) {
            redirectToLogin(err.userMessage);
            return;
        }
        const { handleError } = await import('./core/errors/services/errorHandler.js');
        await handleError({
            filename: 'trackerError',
            consoleMsg: 'Init app error: ',
            err: err,
            userMsg: 'Failed to initialize application',
            errorEle: 'page-msg',
        });
    }
};

/**
 * Sets up global error boundaries for the application
 * Captures unhandled errors and promise rejections
 * @returns {void}
 */
function setupErrorBoundaries() {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalPromiseError);
}

/**
 * Handles page navigation events
 * @async
 * @param {PopStateEvent} evt - Navigation event
 * @returns {Promise<void>}
 */
async function handlePageNavigation(evt) {
    try {
        const page = evt?.state?.page || null;
        await selectPage({ evt, page });
    } 
    catch (err) {
        const { handleError } = await import('./core/errors/services/errorHandler.js');
        await handleError({
            filename: 'handlePageNavigationError',
            consoleMsg: 'Navigation error: ',
            err: err,
            userMsg: 'Failed to navigate to page',
            errorEle: 'page-msg',
        });
    }
}

/**
 * Global error handler for uncaught exceptions
 * @async
 * @param {Error} error - The uncaught error
 * @returns {Promise<void>}
 */
async function handleGlobalError(error) {
    console.error('Global error:', error);
    const { handleError } = await import('./core/errors/services/errorHandler.js');
    await handleError({
        filename: 'globalError',
        consoleMsg: 'Global error: ',
        err: error,
        userMsg: 'An unexpected error occurred',
        errorEle: 'page-msg',
    });
}

/**
 * Handler for unhandled promise rejections
 * @async
 * @param {PromiseRejectionEvent} error - The unhandled promise rejection
 * @returns {Promise<void>}
 */
async function handleGlobalPromiseError(error) {
    console.error('Unhandled promise rejection:', error);
    const { handleError } = await import('./core/errors/services/errorHandler.js');
    await handleError({
        filename: 'promiseError',
        consoleMsg: 'Unhandled promise rejection: ',
        err: error,
        userMsg: 'An unexpected error occurred',
        errorEle: 'page-msg',
    });
}

/**
 * Gets the current validation token
 * @returns {ValidationToken|null} Current validation token or null if not authenticated
 */
export const getValidationToken = () => validationToken;

/**
 * Initializes the tracker application components
 * Sets up main navigation and backup notice functionality
 * @async
 * @throws {AppError} When initialization of components fails
 * @returns {Promise<void>}
 */
async function initializeTracker() {
    try {
        const { default: mainTrackerNavigation } = await import('./navigation/mainTrackerNavigation.js');
        await mainTrackerNavigation();

        try {
            const { default: setupBackupNotice } = await import('./features/backup/backupNotice.js');
            await setupBackupNotice();
        } catch (backupError) {
            const { AppError, ErrorTypes } = await import('./core/errors/models/AppError.js');
            throw new AppError('Backup notice initialization failed', {
                originalError: backupError,
                errorCode: ErrorTypes.BACKUP_ERROR,
                userMessage: 'Unable to check for pending backups',
                displayTarget: 'backup-data-notice'
            });
        }
    } catch (error) {
        const { handleError } = await import('./core/errors/services/errorHandler.js');
        await handleError(error);
    }
}

// Initialize application
await initializeApp();
