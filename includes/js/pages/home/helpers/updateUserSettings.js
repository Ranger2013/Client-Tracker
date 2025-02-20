import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
import { closeModal } from "../../../utils/modal/openModal.js";

/**
 * @fileoverview Helper module for updating user settings in IndexedDB.
 * @module updateUserSettings
 */

/**
 * Updates user settings in IndexedDB with new values and timestamp.
 * 
 * @async
 * @function updateUserSettings
 * @param {string} status - The new status to set ('installed', 'no', 'never')
 * @param {string} type - The settings type to update (e.g., 'installApp')
 * @param {Object} settings - The current user settings object
 * @param {Object} settings[type] - The specific settings section to update
 * @throws {Error} If there's an error updating the settings in IndexedDB
 * @returns {Promise<void>}
 * 
 * @example
 * await updateUserSettings('installed', 'installApp', currentSettings);
 */
export default async function updateUserSettings(status, type, settings) {
	try {
		const timestamp = new Date().getTime();

		settings[type] = {
			...settings[type],
			status,
			timestamp
		};

		const indexed = new IndexedDBOperations();		
		await indexed.addIndexDBPromise({data: settings, storeName: indexed.stores.USERSETTINGS, clearStore: true});

		closeModal();
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('updateSettingsError.txt', 'Update settings error.', err);
	}
}