import userAuthorization from "./utils/security/userAuthorization.js";
import mainTrackerNavigation from "./utils/navigation/trackerAppMainNavigation.js";
import selectPage from "./utils/navigation/selectPage.js";

let validationToken = null;

/**
 * Initializes the application, handling auth, navigation, and error boundaries
 * Ensures proper cleanup of event listeners on errors
 */
const initializeApp = async () => {
    try {
        // Visual feedback for app initialization
        document.body.classList.add('app-initializing');
        
        const path = window.location.pathname;
        
        // Validate user's subscription and token
        validationToken = await userAuthorization(path);

        // Initialize navigation only after successful authorization
        if (validationToken) {
            await mainTrackerNavigation();
            
            // Handle browser navigation events
            window.addEventListener('popstate', handlePageNavigation);
            
            // Global error boundaries
            setupErrorBoundaries();
        }
    } catch (err) {
        const { handleError } = await import("./utils/error-messages/handleError.js");
        await handleError('initAppError', 'Init app error: ', err);
    } finally {
        document.body.classList.remove('app-initializing');
    }
};

function setupErrorBoundaries() {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalPromiseError);
}

async function handlePageNavigation(evt) {
    const page = evt?.state?.page || null;
    await selectPage({ evt, page });
}

// Global error handlers
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

// Export token getter for API calls
export const getValidationToken = () => validationToken;
