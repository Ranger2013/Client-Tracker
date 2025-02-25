import { setActiveTab } from "../dom/domUtils.js";
import { addListener } from "./listeners.js";

// Set event listener cleanup
let cleanup = null;

export default async function setupPageTabListeners(tabs, fm, tabContentContainer) {
	try {
		// Loop through the tabs to set the event listeners
		for (let tab in tabs) {
			const tabElement = document.getElementById(tabs[tab].eleId);

			if (tabElement) {
				addListener(tabElement, 'click', async (evt) => {
					// Set the active tab
					setActiveTab(evt, tabs, fm);

					// Call the cleanup function
					if (cleanup) {
						cleanup();
						cleanup = null; // reset cleanup function
					}

					// set up the new tab
					const { default: action } = await tabs[tab].action();
					cleanup = await action(evt, fm, tabContentContainer); // cleanup is the return from the build page functions
				});
			}
		}
	}
	catch (err) {
		const { handleError } = await import('../../utils/error-messages/handleError.js');
		await handleError(
			'setupPageTabListenersError',
			'Setup page tab listeners error: ',
			err,
			'An error occured while trying to set up the page tabs.',
			'form-msg'
		)
	}
}
