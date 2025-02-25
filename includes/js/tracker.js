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
import mainTrackerNavigation from './core/navigation/services/trackerAppMainNavigation.js';
import setupBackupNotice from './core/services/backup-notice/backupNotice.js';

/** 
 * @typedef {string} ValidationToken - User's authentication token
 * @type {ValidationToken|null}
 */
let validationToken = null;

// Initialize in order of importance
initializeTracker();

/**
 * Initializes the tracker application components
 * Sets up main navigation and backup notice functionality
 * @async
 * @throws {AppError} When initialization of components fails
 * @returns {Promise<void>}
 */
async function initializeTracker() {
    try {
        await mainTrackerNavigation();

        try {
            await setupBackupNotice({errorEleID: 'backup-data-notice'});
        }
        catch (backupError) {
            throw new AppError('Backup notice initialization failed', {
                originalError: backupError,
                errorCode: ErrorTypes.BACKUP_ERROR,
                userMessage: 'Unable to check for pending backups',
                displayTarget: 'backup-data-notice'
            });
        }
    } 
    catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw AppErrors to be handled by initializeApp
        }
        throw new AppError('Tracker initialization failed', {
            originalError: error,
            errorCode: ErrorTypes.INITIALIZATION_ERROR,
            userMessage: 'Failed to initialize application'
        });
    }
}

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
        const { processError } = await import('./core/errors/services/errorProcessor.js');
        
        await processError(err, {
            context: 'initialization',
            defaultMessage: 'Failed to initialize application',
            handlers: {
                AuthorizationError: (error) => redirectToLogin(error.userMessage)
            },
            errorElement: 'page-msg'
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
        if (err instanceof AppError) {
            await handleError({
                filename: 'navigationError',
                consoleMsg: 'Navigation error:',
                err: err,
                userMsg: err.userMessage,
                errorEle: 'page-msg',
            });
            return;
        }
        await handleError({
            filename: 'navigationError',
            consoleMsg: 'Unexpected navigation error:',
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
    const errorToHandle = error instanceof AppError ? error : 
        new AppError('Unhandled global error', {
            originalError: error,
            errorCode: ErrorTypes.INITIALIZATION_ERROR,
            userMessage: 'An unexpected error occurred'
        });
    
    await handleError({
        filename: 'globalError',
        consoleMsg: 'Global error:',
        err: errorToHandle,
        userMsg: errorToHandle.userMessage,
        errorEle: 'page-msg',
    });
}

/**
 * Handler for unhandled promise rejections
 * @async
 * @param {PromiseRejectionEvent} error - The unhandled promise rejection
 * @returns {Promise<void>}
 */
async function handleGlobalPromiseError(event) {
    console.error('Unhandled promise rejection:', event.reason);
    const error = event.reason instanceof AppError ? event.reason :
        new AppError('Unhandled promise rejection', {
            originalError: event.reason,
            errorCode: ErrorTypes.INITIALIZATION_ERROR,
            userMessage: 'An unexpected error occurred'
        });
    
    await handleError({
        filename: 'promiseError',
        consoleMsg: 'Unhandled promise rejection:',
        err: error,
        userMsg: error.userMessage,
        errorEle: 'page-msg',
    });
}

/**
 * Gets the current validation token
 * @returns {ValidationToken|null} Current validation token or null if not authenticated
 */
export const getValidationToken = () => validationToken;

// Initialize application
await initializeApp();
