import IndexedDBOperations from "../../../../../classes/IndexedDBOperations.js";
import { getValidationToken } from "../../../../../tracker.js";
import errorLogs from "../../../../../utils/error-messages/errorLogs.js";
import { backupDataAPI } from "../../../../../utils/network/apiEndpoints.js";
import { fetchData } from "../../../../../utils/network/network.js";
import noAuthorizationPage from "../../../../../utils/security/noAuthorizationPage.js";
import handleClearingStore from "./handleClearingStore.js";
import handleDisplayMsg from "./handleDisplayMsg.js";
import setIndicatorLights from "./setIndicatorLights.js";

/**
 * Backs up data from IndexedDB to server in sequential order to maintain referential integrity
 * @param {Event} evt - Click event from backup button
 * @param {Object} objectStores - Object containing store configurations
 * @param {Array} needsUpdating - Array of stores that need backing up
 * @returns {Promise<boolean>} True if backup successful, false if any errors occurred
 * @throws {Error} If backup process fails
 */
export default async function backUpDataToServer(evt, objectStores, needsUpdating) {
	evt.preventDefault();

	try {
		// DOM Elements for status messages
		const backupMsgError = document.getElementById('backup-msg-error');
		const backupMsgSuccess = document.getElementById('backup-msg-success');

		// Initialize IndexedDB connection
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		const responseArray = [];

		// Process stores sequentially to maintain referential integrity
		for (const update of needsUpdating) {
			// Update indicator to show processing
			const indicatorLight = document.getElementById(update.indicatorID);
			indicatorLight.src = "/public/siteImages/indicator_yellow_light.webp";

			// Get all records from current store
			const myStore = await indexed.getAllStorePromise(db, update.store);

			// Send store data to server
			const serverResponse = await fetchData({
				api: backupDataAPI,
				data: myStore,
				token: await getValidationToken()
			});

			// Handle auth error
			if (serverResponse.status === 'auth-error') {
				await noAuthorizationPage();
				return;
			}

			// Collect server responses for error handling
			responseArray.push(serverResponse);

			// Handle clearing the store
			await handleClearingStore(indexed, db, serverResponse, update.store);

			// Update indicator to show success/error
			await setIndicatorLights(serverResponse, indicatorLight);
		}

		// Handle success/error messages
		await handleDisplayMsg(responseArray, backupMsgSuccess, backupMsgError);

		return !responseArray.flat().some(response =>
			['error', 'server-error', 'validation-error'].includes(response.status)
		);
	}
	catch (err) {
		await errorLogs('backupDataToServerError', 'Backup data to server error: ', err);
		throw err;
	}
}