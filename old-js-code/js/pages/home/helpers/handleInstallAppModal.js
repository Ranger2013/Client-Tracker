/**
 * @fileoverview Helper module for managing the install app modal dialog.
 * @module handleInstallAppModal
 */

import { getValidationToken } from "../../../tracker.js";
import { getInstallAppAPI } from "../../../utils/network/apiEndpoints.js";
import { fetchData } from "../../../utils/network/network.js";
import updateUserSettings from "./updateUserSettings.js";
import { addListener, removeListeners } from "../../../utils/event-listeners/listeners.js";

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

			// Get the event listeners for the modal content
			getListenersForInstall({ settings });
		}
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleInstallAppModalError.txt', 'App install modal error.', err);
	}
}

const INSTALL_MODAL_ID = 'install-app-modal';

function getListenersForInstall({ settings }) {
    // Add listeners with proper tracking
    addListener('install-yes', 'click', async (evt) => {
        removeListeners(INSTALL_MODAL_ID);  // Clean up first
        const { default: installApp } = await import("./installApp.js");
        await installApp(evt, updateUserSettings, settings);
    }, INSTALL_MODAL_ID);

    addListener('install-no', 'click', async () => {
        removeListeners(INSTALL_MODAL_ID);  // Clean up first
        await updateUserSettings('no', 'installApp', settings);
    }, INSTALL_MODAL_ID);

    addListener('install-never', 'click', async () => {
        removeListeners(INSTALL_MODAL_ID);  // Clean up first
        await updateUserSettings('never', 'installApp', settings);
    }, INSTALL_MODAL_ID);
}