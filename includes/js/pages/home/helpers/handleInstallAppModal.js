/**
 * @fileoverview Helper module for managing the install app modal dialog.
 * @module handleInstallAppModal
 */

import { getValidationToken } from "../../../tracker.js";
import { getInstallAppAPI } from "../../../utils/network/apiEndpoints.js";
import { fetchData } from "../../../utils/network/network.js";
import { addListener, removeListeners } from "../../../utils/event-listeners/listeners.js";
import { closeModal } from "../../../utils/modal/openModal.js";

// Component ID for managing listeners
const INSTALL_MODAL_ID = 'install-app-modal';

/**
 * Handles the display and setup of the PWA installation modal.
 * Fetches modal content from the server and sets up event listeners.
 * 
 * @async
 * @function handleInstallAppModal
 * @param {Object} options - The options object
 * @param {Object} options.settings - The current user settings
 * @throws {Error} If there's an error fetching modal content or setting up listeners
 * @returns {Promise<void>}
 * 
 * @example
 * await handleInstallAppModal({ settings: userSettings });
 */
export default async function handleInstallAppModal({ settings }) {
    try {
        const response = await fetchData({ api: getInstallAppAPI, token: getValidationToken() });

        if (response.status === 'auth-error') {
            const { default: noAuthorizationPage } = await import("../../../utils/security/noAuthorizationPage.js");
            await noAuthorizationPage();
            return;
        }

        if (response.status === 'ok') {
            const { default: openModal } = await import("../../../utils/modal/openModal.js");
                        openModal({ content: response.msg });

            // Setup listeners with proper management
            getListenersForInstallApp({ settings });
        }
    }
    catch (err) {
        const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
        await errorLogs('handleInstallAppModalError.txt', 'App install modal error.', err);
    }
}

/**
 * Sets up event listeners for the install app modal buttons using the listener utility.
 * 
 * @private
 * @function setupModalListeners
 * @param {Object} options - The options object
 * @param {Object} options.settings - The current user settings
 */
async function getListenersForInstallApp({ settings }) {
    const { default: ManageUser } = await import("../../../classes/ManageUser.js");
    const manageUser = new ManageUser();

    // Install button handler
    addListener('install-yes', 'click', async (evt) => {
        removeListeners(INSTALL_MODAL_ID); // Clean up first
        const { default: installApp } = await import("./installApp.js");
        await installApp(manageUser);
        closeModal(); // Then close modal
    }, INSTALL_MODAL_ID);

    // No button handler
    addListener('install-no', 'click', async () => {
        removeListeners(INSTALL_MODAL_ID); // Clean up first
        await manageUser.updateLocalUserSettings({
            userData: { status: 'no', timestamp: Date.now() },
            settingsProperty: 'installApp'
        });
        closeModal(); // Then close modal
    }, INSTALL_MODAL_ID);

    // Never button handler
    addListener('install-never', 'click', async () => {
        removeListeners(INSTALL_MODAL_ID); // Clean up first
        await manageUser.updateLocalUserSettings({
            userData: { status: 'never', timestamp: Date.now() },
            settingsProperty: 'installApp'
        });
        closeModal(); // Then close modal
    }, INSTALL_MODAL_ID);
}