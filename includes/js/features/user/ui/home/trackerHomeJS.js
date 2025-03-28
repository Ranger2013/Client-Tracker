import IndexedDBOperations from '../../../../core/database/IndexedDBOperations.js';
import { getValidElement } from '../../../../core/utils/dom/elements.js';
import ManageTrackerInstallApp from '../../models/ManageTrackerInstallApp.js';
import ManageUser from '../../models/ManageUser.js';

// Set up debug mode
const COMPONENT = 'Tracker Home';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Global Constants
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

// Class management
const indexed = new IndexedDBOperations({ debug: DEBUG });
const manageUser = new ManageUser({ debug: DEBUG });
const manageInstallApp = new ManageTrackerInstallApp({ debug: DEBUG });

// Initialize installation manager
const installManager = ManageTrackerInstallApp.getInstance({ debug: DEBUG });

// Main initialization function - run on page load
initalizeApp();

/**
 * Main Initialization function
 */
async function initalizeApp() {
	try {
		const userSettings = await manageUser.getSettings();
		const timestamp = Date.now();
		const { isIOS, isStandalone } = installManager.getPlatformInfo();

		debugLog('App initialization: ', { userSettings, isIOS, isStandalone });

		if (isStandalone) {
			await handleInstallApp({ userSettings, timestamp });
		}
		else {
			await handleBrowserApp({ userSettings, timestamp, isIOS, isStandalone });
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'Failed to set up appplication for download. Please download directly from your browser.',
		});
	}
}

/**
 * Handle app when running in standalone mode
 * @param {Object} userSettings - The user settings
 * @param {number} timestamp - The current timestamp
 */
async function handleInstallApp({ userSettings, timestamp }) {
	if (userSettings.installApp.status !== 'installed') {
		await manageUser.updateLocalUserSettings({
			userData: {
				status: 'installed',
				timestamp,
			},
			settingsProperty: 'installApp',
		});
		debugLog('Updated install status to installed');
	}
}

/**
 * Handle app when running in browser mode
 * @param {Object} userSettings - The user settings
 * @param {number} timestamp - The current timestamp
 */
async function handleBrowserApp({ userSettings, timestamp, isIOS }) {
	// Check if we should show the install prompt
	const shouldPrompt = shouldShowInstallPrompt({ userSettings, timestamp });

	if (shouldPrompt) {
		debugLog('Should show install prompt');
		const { default: showInstallPrompt } = await import('./components/showInstallPrompt.js');
		await showInstallPrompt({ isIOS, manageUser, manageInstallApp });
	}
	else {
		debugLog('Should not show install prompt');
	}
}

/**
 * Determine if install prompt should be shown
 * @param {Object} userSettings - The user settings
 * @param {number} timestamp - The current timestamp
 * @returns {boolean}
 */
function shouldShowInstallPrompt({ userSettings, timestamp }) {
	const installStatus = userSettings?.installApp?.status;

	// Don't show if user selected "never" or if already installed
	if (installStatus === 'never' || installStatus === 'installed') return false;

	// Show on first visit (default) or if 3 days have passed
	if (!userSettings?.installApp || installStatus === 'default') return true;

	// Show if "no" was selected but 3 days have passed
	if (installStatus === 'no') {
		return (userSettings.installApp.timestamp + THREE_DAYS) < timestamp;
	}

	return false;
}