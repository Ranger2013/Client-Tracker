
import { getValidationToken, validationToken } from "../../../../tracker.js";
import { mySuccess } from "../../../../utils/dom/domUtils.js";
import { getSubscriptionAPI } from "../../../../utils/network/apiEndpoints.js";
import noAuthorizationPage from "../../../../utils/security/noAuthorizationPage.js";

export default async function displaySubscriptionPage(evt, fm, tabContentContainer) {
	evt.preventDefault();

	try {
		// Set the active tab
		setActiveTab(evt, tabs, fm);

		// Set the loading message
		mySuccess(fm, 'Loading...', 'w3-text-blue');

		// Clear the content
		tabContentContainer.innerHTML = '';

		// Get the subscriptions page
		// Returns the specific page based on the users member status (i.e. guest or member)
		const req = await fetchData({ api: getSubscriptionAPI, token: getValidationToken() });

		if(req.status === 'auth-error'){
			await noAuthorizationPage();
			return;
		}

		if (req.status === 'ok') {
			// Specific page from the server
			tabContentContainer.innerHTML = req.msg;

			// The subscription page for the guest user
			if (req.page === 'guest') {
				try {
					// Import
					const { default: handleSubscriptionGuestPage } = await import("./helpers/subscriptions/handleSubscriptionGuestPage.js");

					// Get everything pertaining to the guest page
					await setupGuestSubscriptionListeners();
				}
				catch (err) {
					console.warn('Error dealing with the guest subscription: ', err);
					myError(fm, 'There was an issue getting you subscribed.<br>Please submit a new Help Desk Ticket for this issue.');
					top();
				}
			}
			// Check if we have the cancel subscription button
			else if (req.page === 'member') {
				try {
					// Imports
					const { default: handleLinkToggles } = await import("./helpers/subscriptions/handleLinkToggles.js");
					const { default: handleSubscriptionUpgradeButtonListeners } = await import("./helpers/subscriptions/handleSubscriptionUpgradeButtonListeners.js");
					const { default: handleSubscriptionCancelationListener } = await import("./helpers/subscriptions/handleSubscriptionCancelationListener.js");
					
					// Handle the link toggles on the page
					handleLinkToggles();

					// Handle the subscription buttons on the page
					handleSubscriptionUpgradeButtonListeners();

					// Handle the cancelation button
					handleSubscriptionCancelationListener(fm);

					// Handle reactivation of subscription
					handleSubscriptionRactivationListener(fm);
				}
				catch (err) {
					console.warn('Error dealing with the member subscription page: ', err);
					myError(fm, err);
					top();
				}
			}
		}
	}
	catch (err) {
		console.warn('error fetching the subscription page from the server: ', err);

		if (err instanceof CustomError) {
			myError(modalMsg);
		}
	}

}
