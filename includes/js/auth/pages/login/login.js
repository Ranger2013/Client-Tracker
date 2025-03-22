import { authAPI } from "../../../core/network/api/apiEndpoints.min.js";
import { fetchData } from "../../../core/network/services/network.min.js";
import { safeDisplayMessage } from "../../../core/utils/dom/messages.min.js";
import ManageUser from "../../../features/user/models/ManageUser.min.js";

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

        const req = await fetchData({
            api: authAPI.login,
            data: userData,
            timeout: 10000 // Longer timeout for login
        });

        if (req.status !== 'ok') {
            safeDisplayMessage({elementId: 'form-msg', message: req.msg});
            return;
        }

        const token = req.msg;
        if (!token) {
            safeDisplayMessage({elementId: 'form-msg', message: 'Token validation issue. Please contact the administrator.'});
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
        const { AppError } = await import("../../../core/errors/models/AppError.min.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.AUTHORIZATION_ERROR,
            userMessage: AppError.BaseMessages.system.authorization,
        });
        safeDisplayMessage({elementId: 'form-msg', message: 'Login failed. Please contact administrator.'});
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