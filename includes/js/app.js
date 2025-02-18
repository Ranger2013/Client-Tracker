(async () => {
	// Register our service worker if the browser supports it
	if ('serviceWorker' in navigator) {
		try {
			await navigator.serviceWorker.register('/tracker/sw.js', { 'type': 'module' });

			await navigator.serviceWorker.ready;
		} catch (err) {
			console.warn('SERVICE WORKER NOT REGISTERED:', err);
		}
	} else {
		console.warn('Service worker not available');
	}
})();