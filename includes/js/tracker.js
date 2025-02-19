import userAuthorization from "./utils/security/userAuthorization.js";
import mainTrackerNavigation from "./utils/navigation/trackerAppMainNavigation.js";
import selectPage from "./utils/navigation/selectPage.js";

// Token stored in memory for security - cleared on page refresh
let validationToken = null;

/**
 * Initializes the application, handling auth, navigation, and error boundaries
 * Ensures proper cleanup of event listeners on errors
*/
const initializeApp = async () => {
    try {
        
        // Get current URL path
        const path = window.location.pathname;
        
        // This handles entire auth flow
        validationToken = await userAuthorization(path);

        if (validationToken) {
            // Continue app initialization
            await mainTrackerNavigation();
            // Handle browser back/forward navigation
            window.addEventListener('popstate', handlePageNavigation);
            // Set up global error catching for unhandled errors
            setupErrorBoundaries();
        }
    } 
    catch (err) {
        const { handleError } = await import("./utils/error-messages/handleError.js");
        await handleError({
            filename: 'trackerError',
            consoleMsg: 'Init app error: ',
            err: err,
            userMsg: 'Failed to initialize application',
            errorEle: 'appErrorContainer'
        });
    } 
    finally {
        document.body.classList.remove('app-initializing');
    }
};

// Sets up global error boundaries to catch unhandled errors and rejections
function setupErrorBoundaries() {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalPromiseError);
}

// Handles browser navigation events (back/forward) and updates content
async function handlePageNavigation(evt) {
    try {
        const page = evt?.state?.page || null;
        await selectPage({ evt, page });
    } 
    catch (err) {
        const { handleError } = await import("./utils/error-messages/handleError.js");
        await handleError({
            filename: 'handlePaegNavigationError',
            consoleMsg: 'Navigation error: ',
            err: err,
            userMsg: 'Failed to navigate to page',
            errorEle: 'navigationError'
        });
    }
}

// Global error handlers with recovery mechanisms
function handleGlobalError(error) {
    console.error('Global error:', error);
    errorRecovery();
}

function handleGlobalPromiseError(error) {
    console.error('Unhandled promise rejection:', error);
    errorRecovery();
}

function errorRecovery() {
    document.body.classList.remove('app-initializing');
    // Add any other cleanup needed
}

// Initialize the app
await initializeApp();

// Provide controlled access to token
export const getValidationToken = () => validationToken;
