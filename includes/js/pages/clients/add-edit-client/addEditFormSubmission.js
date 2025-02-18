
import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
import ManageClient from "../../../classes/ManageClient.js";
import errorLogs from "../../../utils/error-messages/errorLogs.js";

export default async function addEditFormSubmission({ evt, cID, primaryKey }) {
	try {
		// Include the classes
		const manageClient = new ManageClient();

		// Get the submitter to find out if we are adding/editing or deleting a client
		const submitter = evt.submitter;

		// If we are deleting a client, we need to confirm the deletion
		if (submitter.name === 'delete') {
			if (!confirm('Are you sure you want to delete this client?')) return;

			return await manageClient.deleteClient(parseInt(cID, 10), parseInt(primaryKey, 10));
		}

		// Set up the user data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Add the horses array to the userData object
		userData.horses = [];

		// If we have the primaryKey, we are editing the client.
		if (primaryKey) {
			return await manageClient.editClient(userData, cID, primaryKey);
		}
		// Adding a new client
		else {
			return await manageClient.addNewClient(userData);
		}
	}
	catch (err) {
		await errorLogs('addEditFormSubmissionError', 'Add/Edit form submission error: ', err);
		throw err;
	}
}