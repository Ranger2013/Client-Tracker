import IndexedDBOperations from "../../classes/IndexedDBOperations.js";
import setupBackupNotice from "../../utils/backup-notice/backupNotice.js";
import updateUserSettings from "./helpers/updateUserSettings.js";
import handleNotifications from "./helpers/handleNotifications.js";
import handleInstallAppModal from "./helpers/handleInstallAppModal.js";
import { installPromptState } from "../../classes/InstallPromptManager.js";

// Implement module preloading for critical paths
const preloadModules = () => {
    const criticalModules = [
        '/includes/js/utils/validation/userAuthorization.js',
        '/includes/js/utils/navigation/trackerAppMainNavigation.js'
    ];
    
    criticalModules.forEach(module => {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = module;
        document.head.appendChild(link);
    });
};

// Progressive enhancement
const enhanceUI = async () => {
    // Load non-critical features after main content
    const { default: setupNotifications } = await import('./helpers/handleNotifications.js');
    await setupNotifications();
};

// Initialize in order of importance
preloadModules();
setupBackupNotice();
enhanceUI().catch(console.error);

// Set the install app reminder duration for 3 days
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
// const THREE_DAYS = 3 * 60 * 1000; // 3 minutes in milliseconds
const indexed = new IndexedDBOperations();

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (evt) => {
	evt.preventDefault();
	installPromptState.setPrompt(evt);
});

async function showModalOnLoad() {
	try {
		const db = await indexed.openDBPromise();

		// Check if this user has any data in the user_settings store
		const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);
		const userDataStructure = userSettings[0];

		// Check if the app is installed
		const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

		// User possibly viewing the app in the browser. return early.
		if (!isInstalled && userDataStructure.installApp.status === 'installed') return;

		// User's initial page landing, media says not installed and install app says default.
		if (!isInstalled && userDataStructure.installApp.status === 'default') {
			// Show the install app modal
			await handleInstallAppModal(userDataStructure);
		}
		else if (!isInstalled && userDataStructure.installApp.status === 'no') {
			// Check to see how much time has gone by
			const userTimeStamp = userDataStructure.installApp.timestamp;
			const currentTimestamp = new Date().getTime();

			if(((userTimeStamp + THREE_DAYS) <= currentTimestamp) && userDataStructure.installApp.status !== 'never'){
				await handleInstallAppModal(userDataStructure);
			}
		}
		else if(isInstalled){
			if(userDataStructure.installApp.status === 'no' || userDataStructure.installApp.status === 'default' || userDataStructure.installApp.status === 'never'){
				await updateUserSettings('installed', 'installApp', userDataStructure);
			}
		}
	}
	catch (err) {
		const { default: errorLogs } = await import("../../utils/error-messages/errorLogs.js");
		await errorLogs('updateUserSettingsInstallAppError.txt', 'App install show modal error.', err);
	}
}

// Show the modal on load
showModalOnLoad();