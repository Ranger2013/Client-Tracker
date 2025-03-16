export const staticCacheName = 'static-cache-v1';
export const dynamicCacheName = 'dynamic-cache-v1';

// Do not cache these pages. Some are api pages, but most are the generated offline pages.
const noCache = [
	'AJAX',
	'sw',
	'API',
	'online',
];

export async function cacheFirst(evt){
	try{
		// Check cache first
		const cachedResponse = await caches.match(evt.request);
		if(cachedResponse) {
			 return cachedResponse;
		}

		// Try network if not in cache
		try{
			const networkResponse = await fetch(evt.request);
			if(networkResponse.ok){
				const cache = await caches.open(dynamicCacheName);
				cache.put(evt.request, networkResponse.clone());
				return networkResponse;
			}
		}
		catch(networrkErr){
			await handleFallback(evt);
		}
	}
	catch(err){
		// Cache operations failed
		return caches.match('/tracker/public/src/libs/trackerFallBackPage.php');
	}
}

/**
 * This function implements the network first strategy for service workers.
 * It tries to fetch the request from the network first. If the request is successful and the response is ok, it caches the response.
 * If the network request fails, it tries to fulfill the request from the cache.
 *
 * @async
 * @function
 * @param {FetchEvent} evt - The fetch event.
 * @returns {Promise<Response>} The response from either the network or the cache.
 * @throws Will throw an error if the network request fails and the request cannot be fulfilled from the cache.
 */
export async function networkFirst(evt) {
	try {
		const response = await fetch(evt.request);

		// Good request HTTP 200
		if (response.ok) {
			// Don't cache these pages, just return the response
			if (noCache.some(page => {
				return evt.request.url.includes(page)
			}
			)) {
				return response;
			}

			// Handle any errors that may be thrown from the caching process
			try {
				// Cache these pages and return the response;
				const cache = await caches.open(dynamicCacheName);
				cache.put(evt.request, response.clone());
			}
			catch (err) {
				console.warn('Caching Error:', err);
				// Send a fetch to the error logging api with this error.
			}

			// Return the response even if the page was not able to be cached. This way to don't break the user's experience.
			return response;
		}
		else {
			// For developement, just return the response to see all errors
			console.warn('In networkFirst: Bad Response: ', response);
			return response;

			// For production, handle the different status types
			// if (response.status >= 400 && response.status < 500) {
			// 	console.error('In networkFirst: Client Error: response.statusText: ', response.statusText);

			// 	// Return a new reponse with a custom error message, don't forget to add a link to go back to the home page.
			// 	return new Response(
			// 		`<div style="text-align: center"><span style="color: red">Oops, something went wrong</span></div>
			// 		<p>${response.text()}</p>`
			// 	);

			// 	// Send the log error to the error api and display a generic page for the user notifying them of the error
			// }
			// else if (response.status >= 500) {
			// 	console.error('Server Error:', response.statusText);

			// 	// Send the log error to the error api and display a generic page for the user notifying them of the error
			// }
			// else {
			// 	console.error('Unknown Error:', response.statusText);

			// 	// Send the log error to the error api and display a generic page for the user notifying them of the error
			// }
		}
	} catch (err) {
		await handleFallback(evt);
	}
}

async function handleFallback(evt) {
	const fallbackTrackerURL = '/tracker/public/src/libs/trackerFallBackPage.php';
	const req = await caches.match(evt.request);

	if (!req) {
		if (evt.request.destination === 'script') {
			// stub.js" is an empty file
			return caches.match('/includes/js/utils/stub.js"');
		}
		return caches.match(fallbackTrackerURL);
	}
	return req;
}
