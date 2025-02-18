import { buildEle, clearMsg } from "../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import buildPageContainer from "../../../helpers/buildPageContainer.js";
import buildDuplicateClientList from "./helpers/buildDuplicateClientList.js";
import { getDuplicateClients, getUserDateTimeOptions } from "./helpers/getUserAndClientInfo.js";

export default async function buildDeleteDuplicateClientPage({ mainContainer }) {
	try {
		// Clear any page msgs
		clearMsg({ container: 'page-msg' });

		const clientInfo = await getDuplicateClients();
		const userSettings = await getUserDateTimeOptions();

		const [[container, card], clientList] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Delete Duplicate Client Accounts',
			}),
			buildDuplicateClientList(clientInfo, userSettings),
		]);

		const clientListContainer = buildEle({
			type: 'div',
			attributes: { id: 'client-list-container' },
			myClass: ['w3-padding-small'],
		});

		container.appendChild(card);
		card.appendChild(clientListContainer);
		clientListContainer.appendChild(clientList);

		mainContainer.innerHTML = '';
		mainContainer.appendChild(container);

		// Get our file
		const { default: deleteDuplicateClient } = await import('../../../../../pages/clients/delete-duplicate-client/deleteDuplicateClientJS.js');
		await deleteDuplicateClient();

		return removeAllListeners;
	}
	catch (err) {
		const { handleError } = await import("../../../../error-messages/handleError.js");
		await handleError(
			'buildDeleteDuplicateClientPageError',
			'Error building delete duplicate client page: ',
			err,
			'Unable to build the delete duplicate client page. Please try again later.',
			'page-msg',
		);
	}
}