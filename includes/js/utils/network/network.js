/**
 * Fetches data from the specified API endpoint using either GET or POST method based on the presence of data.
 * Includes authorization headers if a token is provided and handles both JSON and non-JSON data formats.
 * 
 * @param {Object} params - The parameters for the fetch request.
 * @param {string} params.api - The API endpoint to fetch data from.
 * @param {Object|null} params.data - The data to send in the request body (for POST requests).
 * @param {boolean} [params.json=true] - Indicates whether the data should be sent as JSON.
 * @param {string|null} [params.token=null] - The authorization token to include in the headers.
 * @param {number} [params.timeout=5000] - Request timeout in milliseconds.
 * 
 * @returns {Promise<Object>} The JSON response from the server.
 * @throws {Error} Throws 'REQUEST_TIMEOUT' if request times out, 'NETWORK_ERROR' for network issues,
 *                 or the original error for other failures.
 */
export async function fetchData({ api, data, json = true, token = null, timeout = 5000 }) {
	const options = {
		method: data ? 'POST' : 'GET',
		credentials: 'include',
		headers: {},
		// Add timeout to fetch
		signal: AbortSignal.timeout(timeout)
	};

	if (token) {
		options.headers['Authorization'] = `Bearer ${token}`;
	}

	if (data) {
		options.body = json ? JSON.stringify(data) : data;
	}

	if (json && data) {
		options.headers['Content-Type'] = 'application/json';
	}

	try {
		const res = await fetch(api, options);
		const contentType = res.headers.get("content-type");

		if (contentType?.indexOf("application/json") !== -1) {
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Server error: ${errorText}`);
			}
			return await res.json();
		}

		throw new Error(`Invalid content type: ${contentType}`);
	} catch (err) {
		if (err.name === 'TimeoutError') {
			throw new Error('REQUEST_TIMEOUT');
		} else if (err.name === 'TypeError') {
			throw new Error('NETWORK_ERROR');
		}
		throw err;
	}
}

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
		const { getValidationToken } = await import("../../tracker.js");
		const validationToken = getValidationToken();
console.log('In logServerSideError: err:', err);

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
			} catch (fetchErr) {
				// Store error for later sync if it's a network error
				if (fetchErr.message === 'NETWORK_ERROR') {
					await storeErrorForSync(params);
				}
				console.warn('Error logging failed:', fetchErr.message);
			}
		}
	} catch (err) {
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
		const { default: IndexedDBOperations } = await import("../../classes/IndexedDBOperations.js");
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();
		await indexed.putStorePromise(db, errorData, indexed.stores.ERRORQUEUE);
	} catch (err) {
		console.warn('Failed to store error for sync:', err);
	}
}

/**
 * Checks if there is a working connection to the server.
 * Note: This is kept for backward compatibility but not recommended for primary connection checks.
 * 
 * @returns {Promise<boolean>} True if online, false otherwise.
 */
export async function isOnline() {
	try {
		const res = await fetch("/tracker/online.php");

		if (res.ok) {
			return true;
		}
		else {
			throw new Error('Network response was not ok.');
		}
	}
	catch (err) {
		return false;
	}
}
