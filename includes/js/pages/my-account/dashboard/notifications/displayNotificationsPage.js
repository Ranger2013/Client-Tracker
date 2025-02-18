
import ManageUser from "../../../../classes/ManageUser.js";
import listenForSlider from "../helpers/listenForSlider.js";
import buildNotificationsPage from "./helpers/buildNotificationsPage.js";

export default async function displayNotificationsRemindersPage(evt, fm, tabContentContainer) {
	// Prevent default in case
	evt.preventDefault();

	try {
		// Build the notifications page
		await buildNotificationsPage(tabContentContainer);

		// Now that the page is built, set the mapping of the slider
		const sliderStatus = {
			yes: true,
			no: false,
			default: true
		};

		// Manage User Class
		const manageUser = new ManageUser();
		const userSettings = await manageUser.getUserSettings();
		const notifications = userSettings.notifications;

		// Set status of the slider
		const notificationInput = document.getElementById('notification-checkbox');
		const notificationSlider = document.getElementById('slider');
		notificationInput.checked = sliderStatus[notifications.status];

		// Listen for the slider
		listenForSlider(notificationSlider, notificationInput, manageUser, 'notifications');
	}
	catch (err) {
		console.warn('Could not get the user\'s settings: ', err);
		tabContentContainer.innerHTML = '<div class="w3-center"><h5 class="w3-text-red">Could not get your settings</h5></div>';
	}
}

