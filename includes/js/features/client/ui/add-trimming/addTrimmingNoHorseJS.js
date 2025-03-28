import { addListener } from '../../../../core/utils/dom/listeners.js';

const COMPONENT = 'Add Trimming No Horse';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function addTrimmingNoHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId }) {
	try{
		// Set the only event listener on the page
		addListener({
			elementOrId: 'add-horse-link',
			eventType: 'click',
			handler: async (evt) => {
				evt.preventDefault();
				debugLog('Click event to the add horse link: ', evt.target);
				// This only shows up if the client doesn't have a horse, so lazy load the navigation
				const { default: selectClientMenuPage } = await import("../../../../core/navigation/services/selectClientMenuPage.js");
				selectClientMenuPage({
					evt,
					page: 'add-horse',
					cID,
					primaryKey,
					manageClient,
					manageUser,
					mainContainer,
				});
			},
			componentId,
		});
	}
	catch(err){
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}