import ManageUser from "../../classes/ManageUser.js";
import TokenValidation from "../../classes/TokenValidation.js";
import { commonErrors } from "../error-messages/errorMessages.js";

const PROTECTED_ROUTES = ['/login/', '/register/'];
const ADMIN_EMAIL = 'farriers.clienttracker@gmail.com';
const PAGE_MSG = 'page-msg';

/**
 * Validates user authorization and handles token management
 * @param {string} urlPath - Current URL path to check against protected routes
 * @returns {Promise<string|null>} Valid token or null if unauthorized
 * @throws {Error} When token validation fails
 */
export default async function userAuthorization(urlPath) {
    
    // Skip auth for login/register pages
    if (PROTECTED_ROUTES.some(route => urlPath.includes(route))) {
        return null;
    }
    
    try {
        // 1. Get stored token
        const tokenValidation = new TokenValidation();
        const userToken = await tokenValidation.getUserToken();
        
        if (!userToken) {
            redirectToLogin(commonErrors.sessionExpired);
            return null;
        }

        // 2. Validate token
        await tokenValidation.setToken(userToken);
        const token = await tokenValidation.getToken();
        
        // 3. Check account status/expiry
        const isValid = await validateUserAccount(token);
        return isValid ? token : null;
    } 
    catch (err) {
        const { handleError } = await import("../error-messages/handleError.js");
        await handleError({
            filename: 'userAuthorizationError',
            consoleMsg: 'Authorization failed: ',
            err: err,
            userMsg: commonErrors.unauthorized,
            errorEle: PAGE_MSG
        });
        redirectToLogin(commonErrors.unauthorized);
        return null;
    }
}

/**
 * Validates user account status and handles expiration
 * @param {string} token - User's authentication token
 * @returns {Promise<boolean>} True if account is valid and not expired
 * @throws {Error} When account validation fails
 */
async function validateUserAccount(token) {
    if (!token) {
        redirectToLogin(commonErrors.sessionExpired);
        return false;
    }

    try {
        const manageUser = new ManageUser();
        const { user_status } = await manageUser.getSettings('user_status') ?? {};

        if (!user_status) {
            redirectToLogin(commonErrors.unauthorized);
            return false;
        }

        if (user_status.status === 'admin') {
            return true;
        }

        const isExpired = checkAccountExpiry(user_status);
        if (isExpired) {
            redirectToLogin(
                `Your account has expired. Please contact ${ADMIN_EMAIL} for assistance.`
            );
            return false;
        }

        return true;
    } 
    catch (err) {
        const { handleError } = await import("../error-messages/handleError.js");
        await handleError({
            filename: 'validateUserAccountError',
            consoleMsg: 'Account validation error: ',
            err,
            userMsg: 'Unable to validate account',
            errorEle: PAGE_MSG
        });
        return false;
    }
}

/**
 * Checks if a user account has expired
 * @param {Object} userStatus - User status object from database
 * @param {string} userStatus.status - Account type ('member' or 'admin')
 * @param {string} userStatus.expiry - Expiration date string
 * @returns {boolean} True if account is expired
 */
function checkAccountExpiry(userStatus) {
    const now = new Date();
    let expiryDate = new Date(userStatus.expiry);

    if (userStatus.status === 'member') {
        expiryDate.setDate(expiryDate.getDate() + 3); // 3-day grace period
    }

    return now > expiryDate;
}

/**
 * Redirects user to login page with error message
 * @param {string} message - Error message to display on login page
 * @returns {void}
 */
function redirectToLogin(message) {
    window.location.href = `/login/?msg=${encodeURIComponent(message)}`;
}