import { loginAPI } from "../utils/network/apiEndpoints.js";
import { fetchData } from "../utils/network/network.js";
import { myError, mySuccess } from "../utils/dom/domUtils.js";
import ManageUser from "../classes/ManageUser.js";
import { DOM_IDS } from "../utils/dom/domConstants.js";

// Extract form validation to separate function
function validateForm(userData) {
    if (!userData.username || !userData.password) {
        myError('form-msg', 'User Name and Password are required.');
        return false;
    }
    return true;
}

async function handleLogIn(evt) {
    evt.preventDefault();

    try {
        mySuccess('form-msg', 'Processing...', 'w3-text-blue');
        const userData = Object.fromEntries(new FormData(evt.target));

        if (!validateForm(userData)) return;

        const req = await fetchData({
            api: loginAPI,
            data: userData,
            timeout: 10000 // Longer timeout for login
        });

        if (req.status !== 'ok') {
            myError('form-msg', req.msg);
            return;
        }

        const token = req.msg;
        if (!token) {
            myError('form-msg', 'Token validation issue. Please contact the administrator.');
            return;
        }

        // Update the user settings in the idb user_settings store
        const manageUser = new ManageUser();
        await manageUser.updateLocalUserSettings({
            userData: {
                userToken: token,
                status: req.member_status,
                expiry: req.account_expiry,
                uID: req.uID,
            },
            settingsProperty: 'user_status'
        });

        window.location.href = '/tracker/';

    }
    catch (err) {
        const { handleError } = await import("../utils/error-messages/handleError.js");
        await handleError({
            fileName: 'handleLogInError',
            consoleMsg: 'Error in the handle login function.',
            error: err
        });
        myError('form-msg', 'Login failed. Please contact administrator.');
    }
}

// Only cache the form element since we need it for the event listener
document.getElementById('login-form').addEventListener('submit', handleLogIn);