import IndexedDBOperations from '../../../../../../../core/database/IndexedDBOperations.js';
import { dataAPI } from '../../../../../../../core/network/api/apiEndpoints.js';
import { fetchData } from '../../../../../../../core/network/services/network.js';
import setupBackupNotice from '../../../../../../../core/services/backup-notice/backupNotice.js';
import openModal from '../../../../../../../core/services/modal/openModal.js';
import { getValidElement } from '../../../../../../../core/utils/dom/elements.js';
import { getValidationToken } from '../../../../../../../tracker.js';
import handleClearingStore from './handleClearingStore.js';

const COMPONENT = 'Backup Data To Server';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};


/**
 * Backs up data to the server.
 * @param {Object} params - The parameters for the function.
 * @param {HTMLElement} params.tabContainer - The container for the tab content.
 * @returns {Promise<void>}
 */ 
export default async function backupDataToServer({ tabContainer, manageUser }) {
	try {
		debugLog('In backupDataToServer: manageUser', manageUser);
		debugLog('tabContainer: ', tabContainer);
		tabContainer = getValidElement(tabContainer);

		// Get all stores that have data-hasdata set as true
		const elements = tabContainer.querySelectorAll('img[data-hasdata="true"]');
		const storeNames = Array.from(elements).map(el => el.dataset.store);

		// Make sure we have stores to backup
		if (storeNames.length === 0) return; // May need to clear the button if we have no stores to backup

		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		let displayErrors = '';
		
		for (const element of elements) {
			const store = element.dataset.store;
			const storeData = await indexed.getAllStorePromise(db, store);
			let doWeHaveAnError = false;

			// Change the indicator to yellow during processing
			element.src = '/public/siteImages/indicator_yellow_light.webp';

			try {
				const response = await fetchData({
					api: dataAPI.backup,
					data: storeData,
					token: getValidationToken(),
				});
				debugLog('Server Response: ', response);

				for (const { status, msg, data } of response) {
					debugLog('Response: ', response);
					debugLog('status: ', status);
					debugLog('msg: ', msg);
					if (status === 'ok' || status === 'no-update') {
						await handleClearingStore({ indexed, db, response, store });

						// Change the indicator to green if successful
						// element.src = '/public/siteImages/indicator_green_light.webp';
						// element.dataset.hasdata = 'false';
					}
					else if( status === 'validation-error'){
						debugLog('Error Data: ', data);
						if (data) {
							for (const error in data) {
								debugLog('Error: ', error);
								displayErrors += `${msg}${data[error]}<br>`;
								doWeHaveAnError = true;
							}
						}
					}
					else if (status === 'error' || status === 'server-error') {
						displayErrors += msg + '<br>';
						// element.src = '/public/siteImages/indicator_red_light.png';
						doWeHaveAnError = true;
					}
					else {
						displayErrors += `No status provided from server while processing the ${store} store.<br>`;
						// element.src = '/public/siteImages/indicator_red_light.png';
						doWeHaveAnError = true;
					}
				}

				if(doWeHaveAnError) {
					element.src = '/public/siteImages/indicator_red_light.png';
					element.dataset.hasdata = 'true';
				}
				else {
					element.src = '/public/siteImages/indicator_green_light.webp';
					element.dataset.hasdata = 'false';
				}

				await setupBackupNotice({ errorEleID: 'backup-data-notice', manageUser });
			}
			catch (err) {
				// Change the indicator to red if there is an error
				element.src = '/public/siteImages/indicator_red_light.png';
				const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
				AppError.handleError(err, {
					errorCode: AppError.Types.API_ERROR,
					userMessage: AppError.BaseMessages.system.database,
				});
			}
		}

		if (displayErrors !== '') {
			openModal({
				content: displayErrors,
				title: 'Errors During Processing',
				configuration: [
					'w3-padding',
					'w3-round-large',
					'w3-white',
					'w3-margin',
					'w3-margin-center'
				],
			});
		}

		shouldHideBackupDataButton();
	}
	catch (err) {
			// Handle the error
			const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
			AppError.handleError(err, {
				errorCode: AppError.Types.BACKUP_ERROR,
				userMessage: AppError.BaseMessages.system.backup,
			}, true);
		}
	}

function shouldHideBackupDataButton() {
		const elements = document.querySelectorAll('img[data-hasdata="true"]');
		if (elements.length === 0) {
			const backupButton = getValidElement('backup-data-button-container');
			backupButton.classList.add('w3-hide');
		}
	}