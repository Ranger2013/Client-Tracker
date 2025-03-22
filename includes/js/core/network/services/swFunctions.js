export const staticCacheName = 'static-cache-v2';
export const dynamicCacheName = 'dynamic-cache-v2';

// Do not cache these pages. Some are api pages, but most are the generated offline pages.
const noCache = [
	'AJAX',
	'sw',
	'API',
	'online',
    'login',
    'logout',
];

export async function cacheFirst(evt){
    try{
        // Special case for navigation requests
        if(evt.request.mode === 'navigate'){
            const response = await fetch(evt.request, { redirect: 'follow', credentials: 'include'});
            if(response.redirected){
                return Response.redirect(response.url, 303);
            }
            return response;
        }

        const cachedResponse = await caches.match(evt.request);
        if(cachedResponse) {
            return cachedResponse;
        }

        try{
            const networkResponse = await fetch(evt.request);
            if(networkResponse.ok){
                const cache = await caches.open(dynamicCacheName);
                await cache.put(evt.request, networkResponse.clone());
                return networkResponse;
            }
            return handleFallback(evt); // Add return here for non-ok responses
        }
        catch(networkErr){
            return handleFallback(evt); // Add return here
        }
    }
    catch(err){
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
        // Special handling for server page navigation requests
        if(evt.request.mode === "navigate"){
            // Use redirect: 'follow' for navigation requests
            const response = await fetch(evt.request, { redirect: 'follow', credentials: 'include'});

            // If the response was redirected, creae a NEW redirect response
            if(response.redirected){
                return Response.redirect(response.url, 303);
            }
            return response;
        }

        const response = await fetch(evt.request);

        // Check for redirects
        if(response.redirected || response.status >= 300 && response.status < 400) {
            return Response.redirect(response.url, 303);
        }

        if (response.ok) {
            if (noCache.some(page => evt.request.url.includes(page))) {
                return response;
            }

            try {
                const cache = await caches.open(dynamicCacheName);
                await cache.put(evt.request, response.clone());
            } catch (err) {
                console.warn('Caching Error:', err);
            }

            return response;
        }

        // Bad response, try cache
        const cachedResponse = await caches.match(evt.request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // No cache, return fallback
        return handleFallback(evt);

    } catch (networkError) {
        console.warn('Network Error:', networkError);
        
        // Network failed, try cache
        const cachedResponse = await caches.match(evt.request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Cache failed, return fallback
        return handleFallback(evt);
    }
}

async function handleFallback(evt) {
    const fallbackTrackerURL = '/tracker/public/src/libs/trackerFallBackPage.php';
    
    try {
        // First try to get from cache
        const cachedResponse = await caches.match(evt.request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If not in cache, return appropriate fallback
        if (evt.request.destination === 'script') {
            return new Response('// Empty script fallback', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }

        // Return generic fallback page
        return caches.match(fallbackTrackerURL);
    } catch (err) {
        console.warn('Fallback Error:', err);
        // Return minimal response if everything fails
        return new Response('Service Unavailable', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}
