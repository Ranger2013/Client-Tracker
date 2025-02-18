
import ManageUser from "../../../../classes/ManageUser.js";
import { helpDeskTicket } from "../../../../utils/error-messages/errorMessages.js";
import listenForSlider from "../helpers/listenForSlider.js";
import buildRemindersPage from "./helpers/buildRemindersPage.js";

export default async function displayRemindersPage(evt, fm, tabContentContainer) {
	// Prevent default in case
	evt.preventDefault();

	try {
		await buildRemindersPage(tabContentContainer);

		// Now that the page is built, set the mapping of the slider
		const sliderStatus = {
			yes: true,
			no: false,
			default: true
		};

		// Get the Manage User class
		const manageUser = new ManageUser();
		const userSettings = await manageUser.getUserSettings();
		const reminders = userSettings.reminders;

		// Set status of the slider
		const reminderInput = document.getElementById('reminder-checkbox');
		const reminderSlider = document.getElementById('slider');
		reminderInput.checked = sliderStatus[reminders.status];

		// Listen for the slider
		listenForSlider(reminderSlider, reminderInput, manageUser, 'reminders');
	}
	catch (err) {
		console.warn('Display Reminders page error: ', err);
		tabContentContainer.innerHTML = `<div class="w3-center"><h5 class="w3-text-red">There was an error with this page.</h5>${helpDeskTicket}</div>`;
	}
}