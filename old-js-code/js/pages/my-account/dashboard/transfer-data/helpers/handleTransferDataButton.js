import IndexedDBOperations from '../../../../../classes/IndexedDBOperations';
import { getValidationToken } from '../../../../../tracker.js';
import { top } from '../../../../../utils/dom/domUtils.js';
import { transferDataAPI } from '../../../../../utils/network/apiEndpoints.js';
import { fetchData } from '../../../../../utils/network/network.js';
import noAuthorizationPage from '../../../../../utils/security/noAuthorizationPage.js';
import handleDisplayMsg from '../../backup-data/helpers/handleDisplayMsg.js';

const indexed = new IndexedDBOperations();

const handleUpdatingIDBOperations = async (response) => {
    try {
        const { data, property, store, maxID } = response;
        const db = await indexed.openDBPromise();

        // Handle user settings separately (this part remains unchanged)
        if (store === 'user_settings' && property) {
            const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);
				
            if (userSettings.length > 0) {
                const userSetting = userSettings[0];
                userSetting[property] = data;
                await indexed.putStorePromise(db, userSetting, indexed.stores.USERSETTINGS, true);
            }
            return true;
        }

        // Calculate all stores that need to be in the transaction
        const storesToUpdate = [store];
        if (maxID && Array.isArray(maxID)) {
            maxID.forEach(({ store: maxStore }) => {
                if (!storesToUpdate.includes(maxStore)) {
                    storesToUpdate.push(maxStore);
                }
            });
        }

        // Create single transaction for all stores
        const tx = db.transaction(storesToUpdate, 'readwrite');
        tx.onerror = () => { throw new Error('Transaction failed'); };

        try {
            // Clear and update main store
            await indexed.clearStorePromise(db, store, tx);

            // Add main data
            if (Array.isArray(data)) {
                await Promise.all(
                    data.map(record => indexed.addStorePromise(db, record, store, false, tx))
                );
            }
				else {
                await indexed.addStorePromise(db, data, store, false, tx);
            }

            // Update maxID stores if present
            if (maxID && Array.isArray(maxID)) {
                await Promise.all(
                    maxID.map(({ store: maxStore, keyPath, id }) => 
                        indexed.putStorePromise(db, { [keyPath]: id }, maxStore, true, tx)
                    )
                );
            }

            // Wait for transaction to complete
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });

            return true;

        }
		  catch (txError) {
            tx.abort();
            throw txError;
        }

    }
	 catch (err) {
        const { default: errorLogs } = await import('../../../../../utils/error-messages/errorLogs.js');
        await errorLogs('handleUpdatingIDBOperationsError', 'Error updating IDB operations: ', err);
        return false;
    }
};

export default async function handleTransferDataButton(buttonId) {
	const button = document.getElementById(buttonId);

	if (!button) return;

	button.addEventListener('click', async () => {
		try {
			const dataMap = [
				{
					table: 'clients',
					localStore: indexed.stores.CLIENTLIST,
					indicatorImgID: 'clients-indicator',
				},
				{
					table: 'trimmings',
					localStore: indexed.stores.TRIMMING,
					indicatorImgID: 'trimmings-indicator',
				},
				{
					table: 'personal_notes',
					localStore: indexed.stores.PERSONALNOTES,
					indicatorImgID: 'personal-notes-indicator',
				},
				{
					table: 'date_time',
					localStore: indexed.stores.DATETIME,
					indicatorImgID: 'date-time-indicator',
				},
				{
					table: 'farrier_prices',
					localStore: indexed.stores.FARRIERPRICES,
					indicatorImgID: 'farrier-prices-indicator',
				},
				{
					table: 'mileage_charges',
					localStore: indexed.stores.MILEAGECHARGES,
					indicatorImgID: 'mileage-charges-indicator',
				},
				{
					table: 'schedule_options',
					localStore: indexed.stores.SCHEDULINGOPTIONS,
					indicatorImgID: 'schedule-options-indicator',
				},
				{
					table: 'color_options',
					localStore: indexed.stores.COLOROPTIONS,
					indicatorImgID: 'color-options-indicator',
				},
			];

			const responses = [];

			const promises = dataMap.map(async (data) => {
				const { table, localStore, indicatorImgID } = data;

				// Turn the image indicator to yellow for processing
				const indicator = document.getElementById(indicatorImgID);
				indicator.src = '/public/siteImages/indicator_yellow_light.webp';

				const response = await fetchData({ 
					api: transferDataAPI, 
					data: { table }, 
					token: getValidationToken() 
				});

				if(response.status === 'auth-error'){
					await noAuthorizationPage();
					return;
				}
				
				// Update indicator and collect responses based on status
				if (response.status === 'error' || response.status === 'server-error') {
					indicator.src = '/public/siteImages/indicator_red_light.png';
					responses.push([response]);
				}
				else if (response.status === 'no-data') {
					indicator.src = '/public/siteImages/indicator_green_light.webp';
					responses.push([response]);
				}
				else {
					// Success case - just update indicator
					if (response.status === 'success' && response.data) {
						if(await handleUpdatingIDBOperations(response)){
							indicator.src = '/public/siteImages/indicator_green_light.webp';
						}
						else {
							indicator.src = '/public/siteImages/indicator_red_light.png';
							responses.push([{ status: 'error', 'msg': 'Error updating your device.' }]);
						}
					}
				}
			});

			await Promise.all(promises);
			
			// Only handle error and no-data messages
			if (responses.length > 0) {
				await handleDisplayMsg(responses, 'form-msg');
			}

		}
		catch (err) {
			const { handleError } = await import('../../../../../utils/error-messages/handleError.js');
			await handleError(
				'transferDataError',
				'Error transferring data:',
				err,
				`An error occurred while trying to transfer the data.`,
				'form-msg'
			);
			top();
		}
	});
}