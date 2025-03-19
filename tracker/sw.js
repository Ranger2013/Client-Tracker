import { cacheFirst, dynamicCacheName, networkFirst, staticCacheName } from "../includes/js/core/network/services/swFunctions.js";
 
// Our app shell assets to cache
const assets = [
	'/includes/css/w3-css.css',
	'/includes/js/core/errors/models/AppError.js',
	'/tracker/public/src/libs/trackerFallBackPage.php',
];

self.addEventListener('install', async (evt) => {
	try {
		// Have the install wait opening the cache
		const cache = await caches.open(staticCacheName);

		// Cache all the assets
		await cache.addAll(assets);
		self.skipWaiting();
	}
	catch (err) {
		console.warn('SW Install Error:', err);
		// Send an error log that the sw did not install
		const params = {
			'event': 'Service Worker Install',
			'error': err,
		};
	}
});

self.addEventListener('activate', async (evt) => {
	try {
		// Get the keys for the cache
		const keys = await caches.keys();

		// wait to resolve all the keys
		await Promise.all(
			keys.filter(key => key !== staticCacheName && key !== dynamicCacheName).map(key => caches.delete(key))
		);
	}
	catch (err) {
		console.warn('SW Activate Error:', err);
		// Send an error log that the sw did not install
	}
});

self.addEventListener('fetch', async (evt) => {
	try {
		// Get the request url
		const requestURL = evt.request.url;

		// Do not intercept the following pages
		const noCatch = [
			'/login/',
			'/logout/',
			'/tracker/online.php',
			'123checkout.io',
		];

		// Loop through the pages we do not want intercepted
		if (noCatch.some(page => requestURL.includes(page))) {
			try {
				evt.respondWith(
					fetch(evt.request).then(response => {
						return response;
					}).catch(err => {
						console.warn('Native fetch request error in sw: ', err);
						throw err;  // Re-throw the error to be caught by the outer catch block
					})
				);
				return; // Return here to prevent the second respondWith call for the other pages.
			} catch (err) {
				console.warn('Native fetch request error in sw:', err);
			}
		}

		// Get the SPA pages from the assets. If the request url includes any of the SPA pages, use the cache first strategy.
		if (assets.some(route => requestURL.includes(route))) {
			evt.respondWith(cacheFirst(evt));
		}
		else {
			evt.respondWith(networkFirst(evt));
		}
	}
	catch (err) {
		console.warn('SERVICE WORKER FETCH EVENT ERROR: ', err);
	}
});