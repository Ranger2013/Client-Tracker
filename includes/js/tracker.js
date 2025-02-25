import userAuthorization from "../../old-js-code/js/utils/security/userAuthorization.js";
import selectPage from "../../old-js-code/js/utils/navigation/selectPage.js";

/** @typedef {string} ValidationToken */
let validationToken = null;

// Initialize in order of importance
initializeTracker();

/**
 * Initializes the application, handling auth and navigation
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
        const { handleError } = await import('./core/errors/errorHandler.js');
        await handleError({
            filename: 'trackerError',
            consoleMsg: 'Init app error: ',
            err: err,
            userMsg: 'Failed to initialize application',
            errorEle: 'page-msg',
        });
    }
};

function setupErrorBoundaries() {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalPromiseError);
}

async function handlePageNavigation(evt) {
    try {
        const page = evt?.state?.page || null;
        await selectPage({ evt, page });
    } 
    catch (err) {
        const { handleError } = await import('./core/errors/errorHandler.js');
        await handleError({
            filename: 'handlePageNavigationError',
            consoleMsg: 'Navigation error: ',
            err: err,
            userMsg: 'Failed to navigate to page',
            errorEle: 'page-msg',
        });
    }
}

async function handleGlobalError(error) {
    console.error('Global error:', error);
    const { handleError } = await import('./core/errors/errorHandler.js');
    await handleError({
        filename: 'globalError',
        consoleMsg: 'Global error: ',
        err: error,
        userMsg: 'An unexpected error occurred',
        errorEle: 'page-msg',
    });
}

async function handleGlobalPromiseError(error) {
    console.error('Unhandled promise rejection:', error);
    const { handleError } = await import('./core/errors/errorHandler.js');
    await handleError({
        filename: 'promiseError',
        consoleMsg: 'Unhandled promise rejection: ',
        err: error,
        userMsg: 'An unexpected error occurred',
        errorEle: 'page-msg',
    });
}

export const getValidationToken = () => validationToken;

async function initializeTracker() {
    try {
        const { default: mainTrackerNavigation } = await import('./navigation/mainTrackerNavigation.js');
        await mainTrackerNavigation();

        try {
            const { default: setupBackupNotice } = await import('./features/backup/backupNotice.js');
            await setupBackupNotice();
        } catch (backupError) {
            const { AppError, ErrorTypes } = await import('./core/errors/AppError.js');
            throw new AppError('Backup notice initialization failed', {
                originalError: backupError,
                errorCode: ErrorTypes.BACKUP_ERROR,
                userMessage: 'Unable to check for pending backups',
                displayTarget: 'backup-data-notice'
            });
        }
    } catch (error) {
        const { handleError } = await import('./core/errors/errorHandler.js');
        await handleError(error);
    }
}

await initializeApp();
