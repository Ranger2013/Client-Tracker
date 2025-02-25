
import { getValidationToken, validationToken } from "../../../../tracker.js";
import { clearMsg, mySuccess, setActiveTab } from "../../../../utils/dom/domUtils.js";
import errorLogs from "../../../../utils/error-messages/errorLogs.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import { getUnpaidInvoicesAPI } from "../../../../utils/network/apiEndpoints.js";
import { fetchData } from "../../../../utils/network/network.js";
import noAuthorizationPage from "../../../../utils/security/noAuthorizationPage.js";
import showUnpaidClientInvoiceModal from "./showUnpaidClientInvoiceModal.js";

export default async function displayUnpaidInvoices(evt, fm, tabContentContainer) {
	evt.preventDefault();

	try {
		setActiveTab(evt, tabs, fm);

		mySuccess(fm, 'Loading...', 'w3-text-blue');

		// Clear the tab content
		tabContentContainer.innerHTML = '';

		// Get the unpaid invoices page
		const req = await fetchData({ api: getUnpaidInvoicesAPI, token: getValidationToken() });

		if(req.status === 'auth-error'){
			await noAuthorizationPage();
			return;
		}
		// Show the page
		tabContentContainer.innerHTML = req.msg;

		const clients = document.querySelectorAll('span[id^="user-info-"]');

		if (clients && clients.length > 0) {
			clients.forEach(client => addListener(client, 'click', (evt) => showUnpaidClientInvoiceModal(evt, client.dataset.clientid, client.dataset.trimid, client.dataset.invoiceid, modal, modalContent)))
		}

		clearMsg({ container: fm });
	}
	catch (err) {
		await errorLogs('displayUnpaidInvoicesError', 'Error displaying the unpaid invoices: ', err);
		tabContentContainer.innerHTML = 'We cannot get the invoices while you are offline.';
	}
}
