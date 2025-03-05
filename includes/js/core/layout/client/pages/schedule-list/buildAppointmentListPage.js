import { clearMsg } from '../../../../utils/dom/messages.js';
import { top } from '../../../../utils/window/scroll.js';
import buildPageElements from './components/buildPageElements.js';

export default async function buildAppointmentListPage({ active, cID = null, primaryKey = null, mainContainer, manageClient, manageUser }) {
	try{
		// Initialize the page
		await initializePage(mainContainer);

		// Build the appointment page components
		const pageElements = await buildPageElements({ active, cID, primaryKey, manageClient, manageUser });

		// Clear the main container then append the new page contents
		mainContainer.innerHTML = '';
		mainContainer.appendChild(pageElements);
	}
	catch(err){
		console.log('Error: ', err);
		
	}	
}

/**
 * Initializes the page by clearing messages and scrolling to top
 * @param {HTMLElement} mainContainer - Main container element
 * @throws {Error} If mainContainer is missing
 */
async function initializePage(mainContainer) {
	try {
		 clearMsg({ container: 'page-msg' });
		 top();
		 if (!mainContainer) {
			  throw new Error('mainContainer is required');
		 }
	}
	catch (err) {
		 const { AppError } = await import("../../../../errors/models/AppError.js");
		 AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		 }, true);
	}
}
