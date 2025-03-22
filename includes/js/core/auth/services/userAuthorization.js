/**
 * @fileoverview Manages user authorization and access control.
 * Acts as the "security guard" for the application - handling authentication 
 * status, redirecting unauthorized users, and managing error scenarios.
 * 
 * Error Handling Strategy:
 * - Logs technical errors silently (no user display)
 * - Redirects to login with appropriate user messages
 * - Never throws errors to parent (handles everything internally)
 * - Uses non-technical messages for users
 * 
 * Security Flow:
 * 1. Skip auth for login/register pages
 * 2. Check for valid token
 * 3. Verify admin status
 * 4. Check account expiry
 * 5. Handle failures with redirect
 */

import ManageUser from '../../../features/user/models/ManageUser.min.js';
import { fetchData } from '../../network/services/network.min.js';

const SECURITY_MESSAGES = {
    systemError: 'System error validating credentials. Please contact support.',
    tokenMissing: 'Unable to verify your credentials. Please try logging in again.',
    accountExpired: 'Your account is expired. If this is in error, please contact support.',
};

/**
 * Validates user authorization and handles security responses
 * @param {string} urlPath - Current URL path to check against protected routes
 * @returns {Promise<string|null>} Valid token or null if unauthorized/redirected
 * 
 * @example
 * const token = await userAuthorization('/dashboard');
 * if (token) {
 *   // User is authorized
 * }
 * // If no token, user has already been redirected to login
 */
export async function userAuthorization() {
    try {
        const manageUser = new ManageUser();
        const userSettings = await manageUser.getSettings('user_status');
        const { userToken, status: userStatus, expiry: userExpiry } = userSettings.user_status ?? {};

        // No token - redirect to login
        if (!userToken) {
            redirectToLogin(SECURITY_MESSAGES.tokenMissing);
            return null;
        }

        // Check with the server to ensure the tokens match up.
        // const isValidServerToken = await verifyTokenWithServer(userToken);
        // if(!isValidServerToken) {
        //     redirectToLogin(SECURITY_MESSAGES.tokenMissing);
        //     return null;
        // }

        // Admin bypass expiry check
        if (userStatus === 'admin') {
            return userToken;
        }

        // Check account expiry
        const isExpired = checkAccountExpiry({ accountStatus: userStatus, expiry: userExpiry });
        if (isExpired) {
            redirectToLogin(SECURITY_MESSAGES.accountExpired);
            return null;
        }

        return userToken;
    }
    catch (error) {
        const { AppError } = await import('../../errors/models/AppError.js');
        AppError.handleError(error, {
            errorCode: AppError.Types.AUTHORIZATION_ERROR,
            userMessage: null,
        });

        redirectToLogin(SECURITY_MESSAGES.systemError);
        return null;
    }
}

/**
 * Validates if a user account has expired
 * Throws errors that will be caught and handled by parent
 * @private
 */
function checkAccountExpiry({ accountStatus, expiry }) {
    if (!expiry) {
        throw new Error('Expiry date is required');
    }

    const now = new Date();
    const expiryDate = new Date(expiry);

    if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid expiry date format');
    }

    if (accountStatus === 'member') {
        expiryDate.setDate(expiryDate.getDate() + 3);
    }

    return now > expiryDate;
}

async function verifyTokenWithServer(token){
    try{
        // const response = await fetchData({
        //     api: '',
        //     data: '',
        // })
    }
    catch(err){
        const { AppError } = await import('../../errors/models/AppError.js');
        AppError.handleError(err,{
            errorCode: AppError.Types.AUTHORIZATION_ERROR,
            userMessage: null,
        });
    }
}

/**
 * Redirects user to login page with appropriate message
 * @private
 */
function redirectToLogin(message) {
    window.location.href = `/login/?msg=${encodeURIComponent(message)}`;
}