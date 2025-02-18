import ManageUser from "../../classes/ManageUser.js";
import TokenValidation from "../../classes/TokenValidation.js";

const PROTECTED_ROUTES = ['/login/', '/register/'];
const ADMIN_EMAIL = 'farriers.clienttracker@gmail.com';

/**
 * Handles user authorization and token validation
 * @param {string} urlPath - Current URL path
 * @returns {Promise<string|null>} - Returns token if valid, null otherwise
 */
export default async function userAuthorization(urlPath) {
    if (PROTECTED_ROUTES.some(route => urlPath.includes(route))) {
        return null;
    }

    try {
        const tokenValidation = new TokenValidation();
        const userToken = await tokenValidation.getUserToken();
        
        if (!userToken) {
            redirectToLogin("We could not locate your credentials.");
            return null;
        }

        await tokenValidation.setToken(userToken);
        const token = await tokenValidation.getToken();
        
        const isValid = await validateUserAccount(token);
        return isValid ? token : null;

    } catch (err) {
        await logAuthError(err);
        redirectToLogin("We were unable to validate your credentials.");
        return null;
    }
}

/**
 * Validates user account status and expiration
 * @param {string} token - User's validation token
 * @returns {Promise<boolean>} - Returns true if account is valid
 */
async function validateUserAccount(token) {
    if (!token) {
        redirectToLogin("Invalid token detected.");
    }

    try {
        const manageUser = new ManageUser();
        const userSettings = await manageUser.getUserSettings();

        if (!userSettings || !userSettings.user_status) {
            redirectToLogin("There was a problem validating your credentials.");
        }

        // Early return for admin users
        if (userSettings.user_status.status === 'admin') {
            return true;
        }

        // Check expiration based on user status
        const now = new Date();
        let expiryDate = new Date(userSettings.user_status.expiry);

        // Add 3-day grace period for members
        if (userSettings.user_status.status === 'member') {
            expiryDate.setDate(expiryDate.getDate() + 3);
        }

        if (now > expiryDate) {
            redirectToLogin(
                `It appears that your account has expired.<br>` +
                `If this is incorrect, please email the administrator at '${ADMIN_EMAIL}'`
            );
        }

        return true;

    } catch (err) {
        const { default: errorLogs } = await import("../error-messages/errorLogs.js");
        await errorLogs('isUserAccountExpiredError', 'Account validation error: ', err);
        throw err;
    }
}

/**
 * Redirects to login page with error message
 * @param {string} message - Error message to display
 */
function redirectToLogin(message) {
    window.location.href = `/login/?msg=${encodeURIComponent(message)}`;
}

async function logAuthError(error) {
    const { default: errorLogs } = await import("../error-messages/errorLogs.js");
    await errorLogs('userAuthorizationError', 'User Authorization Error: ', error);
}