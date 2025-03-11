import { addListener } from '../../utils/dom/listeners.js';
import selectPage from '../services/selectPage.js';

export default async function setupClientAnchorListener({ manageUser, manageClient, componentId }) {
	try{
		// Simplified anchor listener since selectPage handles its own errors. This is if we are editing a client
		const clientNav = document.querySelector('[data-component="client-navigation"]');

		if (clientNav) {
			addListener({
				elementOrId: clientNav,
				eventType: 'click',
				handler: evt => {
					evt.preventDefault();
					selectPage({
						evt,
						page: 'singleClient',
						cID: clientNav.dataset.clientid,
						primaryKey: clientNav.dataset.primarykey,
						manageUser,
						manageClient,
					});
				},
				componentId,
			});
		}
	}
	catch(err){
		const { AppError } = await import("../../errors/models/AppError.js");
		AppError.handle(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'Client name navigation failed to initialize.',
		});
	}
}