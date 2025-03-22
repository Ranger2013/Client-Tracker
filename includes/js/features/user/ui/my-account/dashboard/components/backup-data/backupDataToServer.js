import IndexedDBOperations from '../../../../../../../core/database/IndexedDBOperations.js';
import { dataAPI } from '../../../../../../../core/network/api/apiEndpoints.js';
import { fetchData } from '../../../../../../../core/network/services/network.js';
import { getValidationToken } from '../../../../../../../tracker.js';
import handleClearingStore from './handleClearingStore.js';

/**
 * Backs up data to the server.
 * @param {Object} params - The parameters for the function.
 * @param {HTMLElement} params.tabContainer - The container for the tab content.
 * @returns {Promise<void>}
 */
export default async function backupDataToServer({tabContainer}){
	try{
		// Get all stores that have data-hasdata set as true
		const elements = tabContainer.querySelectorAll('[data-hasdata="true"]');
		const storeNames = Array.from(elements).map(el => el.dataset.store);

		// Make sure we have stores to backup
		if(storeNames.length === 0) return;

		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		for(const element of elements){
			const store = element.dataset.store;
			const storeData = await indexed.getAllStorePromise(db, store);

			// Change the indicator to yellow during processing
			element.src = '/public/siteImages/indicator_yellow_light.webp';

			try {
				const res = await fetchData({
					api: dataAPI.backup,
					data: storeData,
					token: getValidationToken(),
				});

				const response = res[0];

				if(response.status === 'ok'){
					await handleClearingStore({indexed, db, response: res, store});

					// Change the indicator to green if successful
					element.src = '/public/siteImages/indicator_green_light.webp';
				}
				else if(response.status === 'no-update'){
					await handleClearingStore({indexed, db, response: res, store});

					// Change the indicator to green if successful
					element.src = '/public/siteImages/indicator_green_light.webp';
				}
				else {
					// Change the indicator to red if there is an error
					element.src = '/public/siteImages/indicator_red_light.png';
				}
				

			} catch (err) {
				// Change the indicator to red if there is an error
				element.src = '/public/siteImages/indicator_red_light.png';
				const { AppError } = await import("../../../../../../../core/errors/models/AppError.min.js");
				AppError.handleError(err, {
					errorCode: AppError.Types.API_ERROR,
					userMessage: AppError.BaseMessages.system.network,
				});
			}
		}
	}
	catch(err){
		// Handle the error
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.min.js");
		AppError.process(err, {
			errorCode: AppError.Types.BACKUP_ERROR,
			userMessage: AppError.BaseMessages.system.backup,
		}, true);
	}
}