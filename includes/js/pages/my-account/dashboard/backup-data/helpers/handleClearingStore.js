export default async function handleClearingStore(indexed, db, response, store) {
	// Handle the removal of data from the object store
	try {
		console.log('In handleClearingStore: response: ', response);
		
		for (const { key, clearStore } of response) {
			if (key) {
				await indexed.deleteRecordPromise(key, store);
			}

			if (clearStore) {
				await indexed.clearStorePromise(db, store);
			}
		}
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleClearingStoreError', 'Handle Clearing Store Error: ', err);
		throw err;
	}
}