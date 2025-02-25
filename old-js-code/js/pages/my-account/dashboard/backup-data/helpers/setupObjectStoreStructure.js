
import IndexedDBOperations from "../../../../../classes/IndexedDBOperations.js";
import { ucwords, underscoreToHyphen, underscoreToSpaces } from "../../../../../utils/string/stringUtils.js";

export default async function setupObjectStoreStructure(objectStores) {
	try {
		const indexed = new IndexedDBOperations();

		const stores = indexed.stores;

		for (const list in stores) {
			// backup_scheduling_options
			const storeName = stores[list];
			
			if(!storeName.includes('backup_')) {
				continue;
			}
			
			// Set the property name
			const propertyName = ucwords(underscoreToSpaces(storeName.replace('backup_', '')).replace(/_/g, ' '), false).replace(/ /g, '');
			// Set the msg
			const msg = ucwords(underscoreToSpaces(storeName.replace('backup_', '')));

			// Remove the 'backup-' from the string
			const id = `${underscoreToHyphen(storeName.replace('backup_', ''))}-indicator`;

			objectStores[propertyName] = {
				indicatorID: id,
				store: storeName,
				message: `${msg} is in sync:`
			};
		}

		return objectStores;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('setupObjectStoreStructureError', 'Setup Object Store Structure Error: ', err);
		throw err;
	}
}