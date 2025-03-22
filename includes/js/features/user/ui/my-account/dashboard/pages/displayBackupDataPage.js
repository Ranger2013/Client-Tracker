import { addListener } from '../../../../../../core/utils/dom/listeners.js';
import { clearMsg } from '../../../../../../core/utils/dom/messages.js';
import buildObjectStoreRows from '../components/backup-data/buildObjectStoreRows.js';
import buildBackupDataPageComponents from '../components/backup-data/buildPageComponents.js';

const COMPONENT_ID = 'backup-data-tab';

/**
 * Displays the backup data page.
 * @param {Object} params - The parameters for the function.
 * @param {Event} params.evt - The event object.
 * @param {HTMLElement} params.messageContainer - The container for displaying messages.
 * @param {HTMLElement} params.tabContainer - The container for the tab content.
 * @param {Object} params.manageUser - The manageUser instance.
 * @returns {Promise<void>}
 */
export default async function displayBackupDataPage({evt, messageContainer, tabContainer, manageUser}){
	try{
		// Operational flow
		// 1. Clear any messages that may have been displayed
		clearMsg({container: 'form-msg'});
		clearMsg({container: 'page-msg'});

		// 2. Build the page title and content container, get the object stores and stores that need updating
		const objectStoreRows = await buildObjectStoreRows({manageUser});
		
		// 3. Build the Object store rows and indicators
		const pageComponents = buildBackupDataPageComponents({manageUser, objectStoreRows});
		
		// 4. Append the object store rows to the display container
		const displayContainer = pageComponents.querySelector('#display-container');
		
		displayContainer.appendChild(objectStoreRows);

		tabContainer.innerHTML = '';
		tabContainer.appendChild(pageComponents);

		// Check if we have a submit button, if not, just return, we are done
		const submitButton = tabContainer.querySelector('#submit-button');
		if(!submitButton) return;

		// Only import the backupDataToServer file if we have the submit button
		const { default: backupDataToServer } = await import('../components/backup-data/backupDataToServer');
		
		// 5. Attach event listener to the submit button
		addListener({
			elementOrId: submitButton,
			eventType: 'click',
			handler: async (evt) => {
				try{
					await backupDataToServer({tabContainer});
				}
				catch(err){
					const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
					AppError.handleError(err, {
						errorCode: AppError.Types.DATABASE_ERROR,
						userMessage: AppError.BaseMessages.system.network,
					});
				}
			},
			componentId: COMPONENT_ID,
		});

		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		try {
			await indexed.addStorePromise(db, data, store);
		} catch (err) {
			// Error handling is already done in #handleError
			console.error('Failed to add data:', err);
		}
		
	}
	catch(err){
		const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}