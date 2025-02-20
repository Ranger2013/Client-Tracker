/**
 * @fileoverview Main entry point for the home page tracker functionality.
 * Handles PWA installation prompts and user settings management.
 * @module trackerHomeJS
 */
import setupBackupNotice from "../../utils/backup-notice/backupNotice.js";

// Initialize in order of importance
setupBackupNotice();

// Set the install app reminder duration for 3 days
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

/**
 * Checks if the device/browser supports PWA installation
 * @returns {boolean} True if PWA installation is supported
 */
function isPWASupported() {
	const userAgent = navigator.userAgent.toLowerCase();

	// Check for iOS devices
	const isIOS = /iphone|ipad|ipod/.test(userAgent);

	// Check for Safari or iOS browsers
	const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

	// Some iOS browsers might use different engines but still be iOS
	const isIOSBrowser = userAgent.includes('iphone os') || userAgent.includes('ipad');

	// Check if it's a standalone PWA already
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

	// Return false if it's iOS, Safari, or already installed
	return !(isIOS || isSafari || isIOSBrowser || isStandalone);
}

// Only proceed with PWA features if supported
if (isPWASupported()) {
	const { installPromptState } = await import("../../classes/InstallPromptManager.js");
	// Listen for the beforeinstallprompt event
	window.addEventListener('beforeinstallprompt', (evt) => {
		evt.preventDefault();
		installPromptState.setPrompt(evt);
	});

	// Show the modal on load only if PWA is supported
	showModalOnLoad();
} else {
	console.debug('PWA installation not supported on this device/browser');
}

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
		const { default: ManageUser } = await import("../../classes/ManageUser.js");
		const manageUser = new ManageUser();

		// Check if this user has any data in the user_settings store
		const userSettings = await manageUser.getSettings();
		const { status, timestamp } = userSettings.installApp;
		const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
		const currentTimestamp = Date.now();

		// Early returns for cases where we don't need to show the modal
		if (isInstalled) return; // Already installed as PWA
		if (status === 'installed') return; // User prefers browser version
		if (status === 'never') return; // User explicitly declined installation

		// Only import handleInstallAppModal if we actually need to show the modal
		if (status === 'default' ||
			(status === 'no' && (timestamp + THREE_DAYS) <= currentTimestamp)) {
			const { default: handleInstallAppModal } = await import("./helpers/handleInstallAppModal.js");
			await handleInstallAppModal({ settings: userSettings });
		}
	}
	catch (err) {
		const { handleError } = await import("../../utils/error-messages/handleError.js");
		await handleError({
			filename: 'showModalOnLoadError',
			consoleMsg: 'Error showing install modal: ',
			err,
			userMsg: 'Unable to show installation prompt',
			errorEle: 'page-msg'
		});
	}
}