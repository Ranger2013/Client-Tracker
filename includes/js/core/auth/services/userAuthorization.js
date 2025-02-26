import TokenValidation from './TokenValidation.js';
import ManageUser from '../../../features/user/models/ManageUser.js';

const PROTECTED_ROUTES = ['/login/', '/register/'];
const ADMIN_EMAIL = 'farriers.clienttracker@gmail.com';

/**
 * Validates user authorization and handles token management
 * @param {string} urlPath - Current URL path to check against protected routes
 * @returns {Promise<string|null>} Valid token or null if unauthorized
 * @throws {Error} When token validation fails
 */
export async function userAuthorization(urlPath) {
	// Skip auth for login/register pages
	if (PROTECTED_ROUTES.some(route => urlPath.includes(route))) {
		return null;
	}

	try {
		// 1. Get stored token
		const tokenValidation = new TokenValidation();
		const userToken = await tokenValidation.getUserToken();

		if (!userToken) {
			const { commonErrors } = await import('../../errors/constants/errorMessages.js');
			redirectToLogin(commonErrors.tokenValidationError);
		}

		// 2. Validate token
		await tokenValidation.setToken(userToken);
		const token = tokenValidation.getToken();

		// 3. Check account status/expiry
		const isValid = await validateUserAccount(token);
		return isValid ? token : null;
	}
	catch (err) {
		const { commonErrors } = await import('../../errors/constants/errorMessages.js');
		const { errorLogs } = await import('../../errors/services/errorLogs.js');

		await errorLogs('userAuthorizationError', 'User authorization error: ', err);

		const msg = err instanceof AuthorizationError ? err.userMessage : commonErrors.serverError;
		redirectToLogin(msg);
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
		const { commonErrors } = await import('../../errors/constants/errorMessages.js');
		const { AuthorizationError } = await import('../../errors/models/AuthorizationError.js');

		throw new AuthorizationError('No token provided', {
			userMessage: commonErrors.sessionExpired
		});
	}

	try {
		const manageUser = new ManageUser();
		const { user_status } = await manageUser.getSettings('user_status') ?? {};

		if (!user_status) {
			const { commonErrors } = await import('../../errors/constants/errorMessages.js');
			const { AuthorizationError } = await import('../../errors/models/AuthorizationError.js');
			throw new AuthorizationError('No user status found', {
				userMessage: commonErrors.unauthorized
			});
		}

		if (user_status.status === 'admin') {
			return true;
		}

		const isExpired = checkAccountExpiry(user_status);
		if (isExpired) {
			const { AuthorizationError } = await import('../../errors/models/AuthorizationError.js');
			throw new AuthorizationError('Account expired', {
				userMessage: `Your account has expired. Please contact ${ADMIN_EMAIL} for assistance.`
			});
		}

		return true;
	}
	catch (err) {
		if (err instanceof AuthorizationError) {
			throw err;
		}
		const { AuthorizationError } = await import('../../errors/models/AuthorizationError.js');
		throw new AuthorizationError('Account validation failed', {
			originalError: err,
			userMessage: 'Unable to validate account'
		});
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