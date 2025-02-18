import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
import { closeModal } from "../../../utils/modal/openModal.js";

export default async function updateUserSettings(status, type, settings) {
	try {
		const timestamp = new Date().getTime();
		console.log('status: ', status);
		console.log('type: ', type);
		console.log('settings: ', settings);
		console.log('settings[type]: ', settings[type]);
		
		settings[type] = {
			...settings[type],
			status,
			timestamp
		};

		const indexed = new IndexedDBOperations();		
		await indexed.addIndexDBPromise(settings, indexed.stores.USERSETTINGS, true);

		closeModal();
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('updateSettingsError.txt', 'Update settings error.', err);
	}
}