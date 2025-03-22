/**
 * Handles the clearing of data from the object store.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.indexed - The IndexedDB operations instance.
 * @param {IDBDatabase} params.db - The IndexedDB database instance.
 * @param {Array} params.response - The response data.
 * @param {string} params.store - The name of the object store.
 * @returns {Promise<void>}
 */
export default async function handleClearingStore({indexed, db, response, store}) {
	// Handle the removal of data from the object store
	try {
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
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.min.js");
		AppError.process(err, {
			errorCode: AppError.Types.DATABASE_ERROR,
			userMessage: AppError.BaseMessages.system.generic,
			displayTarget: 'page-msg',
		}, true);
	}
}