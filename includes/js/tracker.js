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

import { userAuthorization } from './core/auth/services/userAuthorization.min.js';
import selectPage from './core/navigation/services/selectPage.min.js';
import mainTrackerNavigation from './core/navigation/services/trackerAppMainNavigation.min.js';
import setupBackupNotice from './core/services/backup-notice/backupNotice.min.js';
import { setValidationToken, getValidationToken } from './core/auth/services/tokenUtils.min.js';
import ManageUser from './features/user/models/ManageUser.min.js';
import ManageClient from './features/client/models/ManageClient.min.js';

/** 
 * @typedef {string} ValidationToken - User's authentication token
 * @type {ValidationToken|null}
 */
let validationToken = null;

const COMPONENT = 'Tracker';
const DEBUG = false;

const debugLog = (...args) => {
    if (DEBUG) {
        console.log(`[${COMPONENT}]`, ...args);
    }
};

/**
 * Initializes the application, handling auth and navigation
 * @async
 * @throws {AuthorizationError} When authentication fails
 * @throws {AppError} When initialization fails
 * @returns {Promise<void>}
 */
const initializeApp = async () => {
    try {
        const manageUser = new ManageUser();
        const manageClient = new ManageClient();

        debugLog('Initializing ManageUser: ', manageUser);
        
        validationToken = await userAuthorization();
        setValidationToken(validationToken);

        await initializeTracker({ manageUser, manageClient });

        // Handle page navigation events
        window.addEventListener('popstate', handlePageNavigation);

        // Setup global error boundaries
        setupErrorBoundaries();
    }
    catch (err) {
        const { AppError } = await import("./core/errors/models/AppError.js");
        // Here we finally handle the error, regardless of type
        await AppError.handleError(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'Failed to initialize application',
            displayTarget: 'page-msg'  // This is indeed the default, could be omitted
        });
    }
};

/**
 * Initializes the tracker application components
 * Sets up main navigation and backup notice functionality
 * @async
 * @throws {AppError} When initialization of components fails
 * @returns {Promise<void>}
 */
async function initializeTracker({ manageUser, manageClient }) {
    try {
        // Main navigation is critical - must work
        await mainTrackerNavigation({ manageUser, manageClient });

        // Backup notice is self-contained, handles its own errors
        // If it fails, it will display in its own element ('backup-data-notice')
        await setupBackupNotice({ errorEleID: 'backup-data-notice', manageUser });
    } 
    catch (error) {
        const { AppError } = await import("./core/errors/models/AppError.js");
        await AppError.process(error, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'Failed to initialize the application.'
        }, true);
    }
}

/**
 * Handles page navigation events, back and forward
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
        const { AppError } = await import("./core/errors/models/AppError.js");

        // This function shouldn't throw any errors. selectPage handles its own errors.
        await AppError.handleError(err, {
            errorCode: AppError.Types.NAVIGATION_ERROR,
            userMessage: 'Navigation system failed.',
            displayTarget: 'page-msg'
        });
    }
}

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
 * Global error handler for uncaught exceptions
 * @async
 * @param {Error} error - The uncaught error
 * @returns {Promise<void>}
 */
async function handleGlobalError(error) {
    // Prevent recursive error handling
    if (error.isBeingHandled) return;

    try {
        const { AppError } = await import("./core/errors/models/AppError.js");
        await AppError.handleError(error, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'An unexpected error occurred',
            shouldLog: true
        });
    } catch (handlingError) {
        // Last resort - avoid infinite loops
        console.error('Failed to handle global error:', error);
    }
}

/**
 * Handler for unhandled promise rejections
 * @async
 * @param {PromiseRejectionEvent} event - The unhandled promise rejection
 * @returns {Promise<void>}
 */
async function handleGlobalPromiseError(event) {
    // Prevent recursive error handling
    if (event.reason?.isBeingHandled) return;

    try {
        const { AppError } = await import("./core/errors/models/AppError.js");
        await AppError.handleError(event.reason, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'An unexpected error occurred',
            shouldLog: true
        });
    } catch (handlingError) {
        // Last resort - avoid infinite loops
        console.error('Failed to handle promise rejection:', event.reason);
    }
}

/**
 * Gets the current validation token
 * @returns {ValidationToken|null} Current validation token or null if not authenticated
 */
export { getValidationToken };

// Initialize application
await initializeApp();
