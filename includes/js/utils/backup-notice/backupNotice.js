import IndexedDBOperations from "../../classes/IndexedDBOperations.js";

/** 
 * Constants 
 */
const TWO_HOURS = 60 * 60 * 2 * 1000; // 2 Hours in milliseconds
const REMINDER_PATTERNS = ['add', 'edit', 'delete', 'dateTime', 'farrierPrices', 'schedulingOptions', 'mileageCharges', 'colorOptions'];

/**
 * Sets up the backup notice by updating it and adding an event listener to close it.
 */
export default async function setupBackupNotice() {
	// Update the backup notice
	await updateBackupNotice();

	// Add the event listener to close the notice
	document.getElementById('backup-data-notice-close').addEventListener('click', closeBackupNotice);
}

/**
 * Updates the backup notice based on user settings and data in IndexedDB.
 */
async function updateBackupNotice() {
	const noticeDiv = document.getElementById('backup-data-notice');
	clearPreviousMessage(noticeDiv);

	const indexed = new IndexedDBOperations();

	try {
		const db = await indexed.openDBPromise();
		const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);

		if (shouldShowReminder(userSettings)) {
			const stores = filterStores(indexed.stores, REMINDER_PATTERNS);
			const hasDataToBackup = await checkStoresForData(db, stores, indexed);

			if (hasDataToBackup) {
				showBackupNotice(noticeDiv);
			} else {
				hideBackupNotice(noticeDiv);
			}
		}
	} catch (err) {
		handleError('updateBackupNoticeError', 'Update Backup Notice Error: ', err);
	}
}

/**
 * Clears any previous message from the notice div.
 * @param {HTMLElement} noticeDiv - The notice div element.
 */
function clearPreviousMessage(noticeDiv) {
	if (noticeDiv.lastChild && noticeDiv.lastChild.nodeType === Node.TEXT_NODE) {
		noticeDiv.removeChild(noticeDiv.lastChild);
	}
}

/**
 * Determines if the reminder should be shown based on user settings.
 * @param {Object} userSettings - The user settings from IndexedDB.
 * @returns {boolean} - True if the reminder should be shown, false otherwise.
 */
function shouldShowReminder(userSettings) {
	if (userSettings && Object.keys(userSettings).length > 0) {
		const backupReminder = userSettings[0].reminders.status;
		const timeSinceLastReminderClose = userSettings[0].reminders.timestamp;
		const now = new Date().getTime();

		return (backupReminder === 'default' || backupReminder === 'yes') &&
			(timeSinceLastReminderClose === 0 || now - timeSinceLastReminderClose >= TWO_HOURS);
	}
	return false;
}

/**
 * Filters the stores based on the given patterns.
 * @param {Object} stores - The stores from IndexedDB.
 * @param {Array<string>} patterns - The patterns to filter the stores.
 * @returns {Object} - The filtered stores.
 */
function filterStores(stores, patterns) {
	return Object.keys(stores)
		.filter(key => patterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase())))
		.reduce((acc, key) => {
			acc[key] = stores[key];
			return acc;
		}, {});
}

/**
 * Checks if there is any data to backup in the given stores.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {Object} stores - The filtered stores.
 * @param {IndexedDBOperations} indexed - The IndexedDB operations instance.
 * @returns {Promise<boolean>} - True if there is data to backup, false otherwise.
 */
async function checkStoresForData(db, stores, indexed) {
	for (let store in stores) {
		const objectStore = await indexed.getAllStorePromise(db, stores[store]);
		if (objectStore && objectStore.length > 0) {
			return true;
		}
	}
	return false;
}

/**
 * Shows the backup notice.
 * @param {HTMLElement} noticeDiv - The notice div element.
 */
function showBackupNotice(noticeDiv) {
	const newText = document.createTextNode('You currently have data that needs to be backed up to the server.');
	noticeDiv.append(newText);
	noticeDiv.classList.remove('w3-hide');
}

/**
 * Hides the backup notice.
 * @param {HTMLElement} noticeDiv - The notice div element.
 */
function hideBackupNotice(noticeDiv) {
	noticeDiv.classList.add('w3-hide');
}

/**
 * Closes the backup notice and updates the user settings in IndexedDB.
 */
async function closeBackupNotice() {
	const indexed = new IndexedDBOperations();
	try {
		const db = await indexed.openDBPromise();
		const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);

		userSettings[0].reminders.timestamp = new Date().getTime();

		await indexed.clearStorePromise(db, indexed.stores.USERSETTINGS);
		await indexed.putStorePromise(db, userSettings[0], indexed.stores.USERSETTINGS);

		hideBackupNotice(document.getElementById('backup-data-notice'));
	} catch (err) {
		handleError('closeBackupNoticeError', 'Close Backup Notice Error: ', err);
	}
}

/**
 * Handles errors by logging them.
 * @param {string} errorType - The type of error.
 * @param {string} message - The error message.
 * @param {Error} err - The error object.
 */
async function handleError(errorType, message, err) {
	const { default: errorLogs } = await import("../../utils/error-messages/errorLogs.js");
	await errorLogs(errorType, message, err);
}