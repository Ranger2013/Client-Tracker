// import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
// import errorLogs from "../../error-messages/errorLogs.js";
// import { ucwords } from "../../string/stringUtils.js";

import { ucwords } from '../../../../../core/utils/string/stringUtils';

/**
 * Validates client name field
 * @param {Object} params - Validation parameters
 * @param {Event} params.evt - The event object
 * @param {string|null} params.cID - Client ID
 * @param {string|null} params.primaryKey - Database primary key
 * @returns {Promise<string|false>} Error message or false if valid
 * @throws {Error} If validation fails
 */
export default async function validateClientName({ evt, cID, primaryKey, manageClient }) {
	try {
		// Empty value
		if(evt.target.value === '') return 'Client Name cannot be empty.';
		
		const clientList = await manageClient.getClientScheduleList();

		// Check for a duplicate
		if (clientList?.length > 0) {
			const duplicate = clientList.some(client => {
				if (client.primaryKey === parseInt(primaryKey, 10) || client.cID === parseInt(cID, 10)) return false; // continue in case we are editing the client
				return client.client_name.trim().toUpperCase() === evt.target.value.trim().toUpperCase();
			});

			if(duplicate) return 'Client Name already in use.';
		}

		// Format the client name here
		evt.target.value = ucwords(evt.target.value);
		return false;
	}
	catch (err) {
		throw err;
	}
}