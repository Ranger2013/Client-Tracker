import ManageClient from "../../../classes/ManageClient.js";
import { myError, mySuccess } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import buildDuplicateClientList from "../../../utils/page-builders/pages/clients/delete-duplicate-client/helpers/buildDuplicateClientList.js";
import { getDuplicateClients, getUserDateTimeOptions } from "../../../utils/page-builders/pages/clients/delete-duplicate-client/helpers/getUserAndClientInfo.js";

export default async function deleteDuplicateClient() {
	try {
		const userSettings = await getUserDateTimeOptions();
		const clientListContainer = document.getElementById('client-list-container');

		// Use event delegation instead of multiple listeners
		addListener(clientListContainer, 'click', async (evt) => {
			const deleteButton = evt.target.closest('button[id^="delete-client-button-"]');
			if (!deleteButton) return;

			if (!confirm('Are you sure you want to delete this client?')) return;

			// Handle deletion
			const manageClient = new ManageClient();
			const clientInfo = await manageClient.getClientInfo({primaryKey: deleteButton.value});
			const clientName = clientInfo.client_name;

			const deleteParams = {
				delete_duplicate_client: true,
				primaryKey: deleteButton.value,
				client_name: clientName,
			};
			const primaryKey = deleteButton.value;

			const response = await manageClient.deleteDuplicateClient(deleteParams);
			
			if(response){
				const duplicates = await getDuplicateClients();

				mySuccess('form-msg', response.msg);
				const duplicateList = await buildDuplicateClientList(duplicates, userSettings);

				clientListContainer.innerHTML = '';
				clientListContainer.appendChild(duplicateList);
			}
			else {
				myError('form-msg', response.msg);
			}
		});
	}
	catch (err) {
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError(
			'deleteDuplicateClientError',
			'Delete duplicate client error: ',
			err);
	}
}