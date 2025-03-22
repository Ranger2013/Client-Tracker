import { getValidElement } from '../../../../../core/utils/dom/elements.js';
import { cleanUserOutput } from '../../../../../core/utils/string/stringUtils.js';

// Set up debug mode
const COMPONENT = 'Delete Duplicate Client';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function deleteTheDuplicate({ evt, duplicateClients, manageClient, manageUser, index }) {
	try {
		if (!confirm("Are you sure you want to remove this client?")) {
			return;
		}
		// debugLog("Deleting the duplicate client...");
		const primaryKey = parseInt(evt.target.dataset.primarykey);
		// debugLog("primaryKey: ", primaryKey);
		const cID = parseInt(evt.target.dataset.cid);
		// debugLog("cID: ", cID);
		const section = `client-section-${evt.target.id.split('-').pop()}`
		// debugLog("section: ", section);

		debugLog("duplicateClients: ", duplicateClients);
		const duplicateClientsCopy = [...duplicateClients];
		const isDeleted = await manageClient.deleteDuplicateClient(primaryKey);
		// const isDeleted = true; // For testing purposes

		if (isDeleted) {
			// Need to filter out the deleted client from the duplicateClients array
			const updateDuplicateClients = duplicateClients.filter(client => {
				debugLog(`Client primaryKey: ${client.primaryKey} !== primaryKey: ${primaryKey}`);
				return client.primaryKey !== primaryKey
			});
			debugLog("updatedClients After deletion: ", updateDuplicateClients);

			// Update the current duplicateClients array
			duplicateClients.length = 0;
			duplicateClients.push(...updateDuplicateClients);

			const newDuplicateClientList = processDuplicateClientList(updateDuplicateClients);
			debugLog("Processed remaining clients: ", newDuplicateClientList);

			await clearFormOrRemoveRow({ newDuplicateClientList, cID, primaryKey, clientRowId: section });
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: "An error occurred while deleting the duplicate client.",
			displayTarget: "form-msg",
		});
	}
}

function processDuplicateClientList(duplicateClients) {
	const duplicates = new Map();

	// Count how many times each client appears in the duplicateClients array
	duplicateClients.forEach(client => {
		const { cID } = client;
		duplicates.set(cID, (duplicates.get(cID) || 0) + 1);
	});

	// debugLog("duplicates: ", Object.fromEntries(duplicates));

	// Filter to keep the duplicate clients
	return duplicateClients.filter(client => {
		const hasDuplicates = duplicates.get(client.cID) > 1;
		return hasDuplicates;
	});
}

async function clearFormOrRemoveRow({ newDuplicateClientList, cID, primaryKey, clientRowId }) {
	debugLog("clearFormOrRemoveRow: newDuplicateClientList: ", newDuplicateClientList);
	// debugLog("clearFormOrRemoveRow: cID: ", cID);

	const stillHasDuplicates = newDuplicateClientList.some(client => client.cID === cID);
	// debugLog("clearFormOrRemoveRow: stillHasDuplicates: ", stillHasDuplicates);
	const clientList = getValidElement('client-list');

	// Clear the client-container and reset the form and update the select list
	if (!stillHasDuplicates) {
		const clientContainer = getValidElement('client-container');

		// clear the container and reset the form
		clientContainer.innerHTML = '';

		// Update the select list
		await updateClientListSelect({ clientList: newDuplicateClientList, selectElement: clientList });
		return;
	}

	// Remove the client row and update the select list select element
	const clientRow = getValidElement(clientRowId);
	clientRow.remove();

	// Update the select list
	await updateClientListSelect({ clientList: newDuplicateClientList, selectElement: clientList });
}

async function updateClientListSelect({ clientList, selectElement }) {
	try {
		debugLog('Updating client list with the following client list: ', clientList);
		// Get the client count
		const clientCount = clientList.reduce((acc, client) => {
			acc[client.cID] = (acc[client.cID] || 0) + 1;
			return acc;
		}, {});

		debugLog("clientCount: ", clientCount);

		const clientOptionData = Array.from(new Set(clientList.map(client => client.cID)))
			.map(cID => {
				const client = clientList.find(c => c.cID === cID);
				return {
					...client,
					duplicateCount: clientCount[cID],
				};
			});

		debugLog("clientOptionData: ", clientOptionData);

		// Clear the select element list except for the first option
		selectElement.options.length = 1;

		// debugLog("selectElement: ", selectElement);

		// Add the new options to the select element
		clientOptionData.forEach(client => {
			const option = new Option(
				`${cleanUserOutput(client?.client_name)}${client?.duplicateCount ? ` (${client?.duplicateCount} duplicates)` : ''}`,
				client.cID
			);
			selectElement.add(option);
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: "An error occurred while updating the client list.",
		});
	}
}