import { authAPI } from "../../../core/network/api/apiEndpoints.js";
import { fetchData } from "../../../core/network/services/network.js";
import { safeDisplayMessage } from "../../../core/utils/dom/messages.js";
import ManageUser from "../../../features/user/models/ManageUser.js";

// Setup debug mode
const COMPONENT = 'login';
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(`[${COMPONENT}]`, ...args);
    }
};

async function handleLogIn(evt) {
    evt.preventDefault();

    try {
        safeDisplayMessage({
            elementId: 'form-msg',
            message: 'Processing...',
            color: 'w3-text-blue',
            isSuccess: true,
        })
        const userData = Object.fromEntries(new FormData(evt.target));

        if (!validateForm(userData)) return;

        const response = await fetchData({
            api: authAPI.login,
            data: userData,
            timeout: 10000 // Longer timeout for login
        });

        debugLog('Login response:', response);

        if (response.status !== 'ok') {
            let msg = response.msg;
            msg += response.attempts && response.loginAttempts ? `<br>Current Attempts: ${response.attempts}<br>Attempts Remaining: ${response.loginAttempts}` : '';
            safeDisplayMessage({elementId: 'form-msg', message: msg, color: 'w3-text-yellow'});
            return;
        }

        const token = response.msg;
        if (!token) {
            safeDisplayMessage({elementId: 'form-msg', message: 'Token validation issue. Please contact the administrator.', color: 'w3-text-yellow'});
            return;
        }

        // Update the user settings in the idb user_settings store
        const manageUser = new ManageUser();

        await manageUser.updateLocalUserSettings({
            userData: {
                userToken: token,
                status: response.member_status,
                expiry: response.account_expiry,
                uID: response.uID,
            },
            settingsProperty: 'user_status'
        });

        window.location.href = '/tracker/';

    }
    catch (err) {
        console.log('Log In Error: ', err);
        // const { AppError } = await import("../../../core/errors/models/AppError.js");
        // AppError.handleError(err, {
        //     errorCode: AppError.Types.AUTHORIZATION_ERROR,
        //     userMessage: AppError.BaseMessages.system.authorization,
        // });
        // safeDisplayMessage({elementId: 'form-msg', message: 'Login failed. Please contact administrator.'});
    }
}

// Extract form validation to separate function
function validateForm(userData) {
    if (!userData.username || !userData.password) {
        safeDisplayMessage({ elementId: 'form-msg', message: 'Usr Name and Password are required.'});
        return false;
    }
    return true;
}

// Only cache the form element since we need it for the event listener
document.getElementById('login-form').addEventListener('submit', handleLogIn);