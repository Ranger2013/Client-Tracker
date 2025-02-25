const main = document.getElementById('main');

/**
 * Display a backup error page when a page is not available
 * @returns {void}
 */
export default function backupErrorPage() {
	main.innerHTML = `
		<div class="w3-center">
			<h4 class="w3-text-red">Page Not Available</h4>
			<p>Sorry, the page you're trying to access is not available at this time. Please try again later</p>
		</div>`;
}