/**
 * @fileoverview Main entry point for the home page tracker functionality.
 * Handles PWA installation prompts and user settings management.
 * @module trackerHomeJS
 */
import setupBackupNotice from "../../utils/backup-notice/backupNotice.js";
import handleInstallAppModal from "./helpers/handleInstallAppModal.js";
import { installPromptState } from "../../classes/InstallPromptManager.js";
import ManageUser from "../../classes/ManageUser.js";

// Initialize in order of importance
setupBackupNotice();

// Set the install app reminder duration for 3 days
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
// const THREE_DAYS = 3 * 60 * 1000; // 3 minutes in milliseconds
const manageUser = new ManageUser();

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (evt) => {
	evt.preventDefault();
	installPromptState.setPrompt(evt);
});

/**
 * Shows the install app modal based on user settings and installation status.
 * Checks if the app is already installed and manages the display of installation prompts
 * based on user preferences and timing.
 * 
 * @async
 * @function showModalOnLoad
 * @throws {Error} If there's an error accessing user settings or displaying the modal
 */
async function showModalOnLoad() {
	try {
		// Check if this user has any data in the user_settings store
		const userSettings = await manageUser.getSettings();
		const status = userSettings.installApp.status;
		const timestamp = userSettings.installApp.timestamp;

		// Check if the app is installed
		const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

		// User possibly viewing the app in the browser. return early.
		if (!isInstalled && status === 'installed') return;

		// User's initial page landing, media says not installed and install app says default.
		if (!isInstalled && status === 'default') {
			// Show the install app modal
			await handleInstallAppModal({ settings: userSettings});
		}
		// else if (!isInstalled && userDataStructure.installApp.status === 'no') {
		// 	// Check to see how much time has gone by
		// 	const userTimeStamp = userDataStructure.installApp.timestamp;
		// 	const currentTimestamp = new Date().getTime();

		// 	if(((userTimeStamp + THREE_DAYS) <= currentTimestamp) && userDataStructure.installApp.status !== 'never'){
		// 		await handleInstallAppModal(userDataStructure);
		// 	}
		// }
		// else if(isInstalled){
		// 	if(userDataStructure.installApp.status === 'no' || userDataStructure.installApp.status === 'default' || userDataStructure.installApp.status === 'never'){
		// 		await updateUserSettings('installed', 'installApp', userDataStructure);
		// 	}
		// }
	}
	catch (err) {
		const { default: errorLogs } = await import("../../utils/error-messages/errorLogs.js");
		await errorLogs('updateUserSettingsInstallAppError.txt', 'App install show modal error.', err);
	}
}

// Show the modal on load
showModalOnLoad();