import setupBackupNotice from '../../../../../core/services/backup-notice/backupNotice.min';

const COMPONENT = 'Add Edit Form Submission';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
}

export default async function addEditFormSubmission({ evt, cID, primaryKey, manageClient, manageUser }) {
	try {
		// Get the submitter to determine if we are adding/editing a client or deleting a client
		const submitter = evt.submitter;
		debugLog('Submitter: ', submitter);
		// If we are deleting the client, handle the deletion process
		if (submitter.name === 'delete') {
			const deleteClient = await manageClient.deleteClient(parseInt(cID, 10), parseInt(primaryKey, 10));

			if (deleteClient) {
				return { status: 'success', type: 'delete', msg: 'Client deleted successfully.' };
			}
		}

		// Get the form data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Add the horses array to the userData object
		userData.horses = [];

		// If we have the primaryKey, then we are editing a client.
		debugLog('PrimaryKey: Editing a client if not undefined: ', primaryKey);
		if (primaryKey) {
			const editClient = await manageClient.editClient(userData, cID, primaryKey);

			if (editClient) {
				await setupBackupNotice({ errorEleID: 'backup-data-notice', manageUser });
				return { status: 'success', type: 'edit', msg: `${userData.client_name} has been edited successfully.` };
			}
			return { status: 'error', type: 'edit', msg: `An error occurred while editing ${userData.client_name}.` };
		}
		// Adding a new client
		else {
			debugLog('Adding a new client: ', userData);
			const addClient = await manageClient.addNewClient(userData);
			debugLog('Client Added: ', addClient);
			if (addClient) {
				await setupBackupNotice({ errorEleID: 'backup-data-notice', manageUser });
				return { status: 'success', type: 'add', msg: `${userData.client_name} has been added successfully` };
			};
			return { status: 'error', type: 'add', msg: `An error occurred while adding ${userData.client_name}.` };
		}
	}
	catch (err) {
		throw err;
	}
}