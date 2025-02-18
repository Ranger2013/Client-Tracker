/**
 * Displays a message indicating that no client is available.
 * 
 * @param {HTMLElement} main - The main container element where the message will be displayed.
 * @returns {Promise<void>}
 */
export default async function buildNoClientAvailablePage(main) {
	try {
		[container, card] = await buildPageContainer({ pageTitle: 'No Client Selected' });

		container.appendChild(card);
		main.appendChild(container);
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('noClientAvailableError', 'No client available error: ', err);
		throw err;
	}
}
