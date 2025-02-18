import IndexedDBOperations from "../classes/IndexedDBOperations.js";
import {loginAPI } from "../utils/network/apiEndpoints.js";
import { fetchData } from "../utils/network/network.js";
import { myError, mySuccess } from "../utils/dom/domUtils.js";
import errorLogs from "../utils/error-messages/errorLogs.js";
import userDataStructureConfig from "../utils/configurations/user-settings-structure/userSettingsDataStructure.js";
import { DOM_IDS } from "../utils/dom/domConstants.js";

// Extract form validation to separate function
function validateForm(userData) {
    if (!userData.username || !userData.password) {
        myError(DOM_IDS.FORM_MSG, 'User Name and Password are required.');
        return false;
    }
    return true;
}

// Extract IndexedDB operations to separate function
async function updateUserData(token, req, index) {
    const db = await index.openDBPromise();
    let userSettings = await index.getAllStorePromise(db, index.stores.USERSETTINGS);

    if (!Array.isArray(userSettings) || userSettings.length === 0 || typeof userSettings[0] === 'undefined') {
        // New user flow
        await index.clearStorePromise(db, index.stores.USERSETTINGS);
        const userDataStructure = userDataStructureConfig({ validationToken: token, req });
        await index.putStorePromise(db, userDataStructure, index.stores.USERSETTINGS);
        return;
    }

    // Existing user flow
    userSettings[0].userToken = token;
    userSettings[0].user_status.status = req.member_status;
    userSettings[0].user_status.expiry = req.account_expiry;

    await index.clearStorePromise(db, index.stores.USERSETTINGS);
    await index.putStorePromise(db, userSettings[0], index.stores.USERSETTINGS);
}

async function handleLogIn(evt) {
    evt.preventDefault();
    
    try {
        mySuccess(DOM_IDS.FORM_MSG, 'Processing...', 'w3-text-blue');
        const userData = Object.fromEntries(new FormData(evt.target));

        if (!validateForm(userData)) return;

        const req = await fetchData({ 
            api: loginAPI, 
            data: userData,
            timeout: 10000 // Longer timeout for login
        });

        if (req.status !== 'ok') {
            myError(DOM_IDS.FORM_MSG, req.msg);
            return;
        }

        const token = req.msg;
        if (!token) {
            myError(DOM_IDS.FORM_MSG, 'Token validation issue. Please contact administrator.');
            return;
        }

        const index = new IndexedDBOperations();
        await updateUserData(token, req, index);
        window.location.href = '/tracker/';

    } catch (err) {
        await errorLogs('loginError', 'Login error: ', err);
        myError(DOM_IDS.FORM_MSG, 'Login failed. Please contact administrator.');
    }
}

// Only cache the form element since we need it for the event listener
document.getElementById(DOM_IDS.LOGIN_FORM).addEventListener('submit', handleLogIn);