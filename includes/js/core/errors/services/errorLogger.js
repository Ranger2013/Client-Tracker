import { fetchData } from "../../network/services/network.js";
import { getValidationToken } from "../../../tracker.js";
/**
 * Logs errors to the server with retry capability and offline queue support.
 * 
 * @param {string} API - The API endpoint for error logging.
 * @param {Error} err - The error object to log.
 * @param {string} page - The page where the error occurred.
 * @param {boolean} [shouldLog=true] - Whether the error should be logged.
 * @returns {Promise<void>}
 */
export async function logServerSideError(API, err, page, shouldLog = true) {
    try {
        const validationToken = getValidationToken();

        const params = {
            page,
            error: {
                name: err.name,
                message: err.message,
                stack: err.stack?.split('\n') || ['No stack trace'],
            }
        };

        if (shouldLog) {
            try {
                await fetchData({
                    api: API,
                    data: params,
                    token: validationToken,
                });
            }
            catch (fetchErr) {
                // Store error for later sync if it's a network error
                if (fetchErr.message === 'NETWORK_ERROR') {
                    await storeErrorForSync(params);
                }
                console.warn('Error logging failed:', fetchErr.message);
            }
        }
    }
    catch (err) {
        console.warn('Error logging process failed:', err);
    }
}

/**
 * Stores error data for later synchronization when online connectivity is restored.
 * 
 * @param {Object} errorData - The error data to store.
 * @returns {Promise<void>}
 */
async function storeErrorForSync(errorData) {
    try {
        const { default: IndexedDBOperations } = await import("../../../../../old-js-code/js/classes/IndexedDBOperations.js");
        const indexed = new IndexedDBOperations();
        const db = await indexed.openDBPromise();
        await indexed.putStorePromise(db, errorData, indexed.stores.ERRORQUEUE);
    }
    catch (err) {
        console.warn('Failed to store error for sync:', err);
    }
}