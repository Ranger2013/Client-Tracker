
import ManageUser from "../../../../classes/ManageUser.js";
import buildCalendar from "../../../../utils/calendar/buildCalendar.js";
import { myError, top } from "../../../../utils/dom/domUtils.js";
import setClearDatesButtonListener from "./helpers/setClearDatesButtonListener.js";
import setSubmitButtonListener from "./helpers/setSubmitButtonListener.js";

export default async function displayBlockDatesPage(evt, fm, tabContentContainer) {
	evt.preventDefault();

	try {
		// Manage the current month and year
		const manageUser = new ManageUser();
		let storedDates = await manageUser.getUserBlockedDates() ?? [];

		const onUpdate = (updatedDates) => {
			return storedDates;
		};

		// Set up the calendar container and navigation buttons
		const calendar = await buildCalendar(storedDates, fm, onUpdate);

		// Clear the container
		tabContentContainer.innerHTML = '';
		tabContentContainer.appendChild(calendar);

		// DOM Elements for the dynamically created page
		const submitButton = document.getElementById('submit-button');
		const clearDatesButton = document.getElementById('clear-dates-button');

		await setSubmitButtonListener(submitButton, fm, storedDates);
		await setClearDatesButtonListener(clearDatesButton, fm, calendar, storedDates, onUpdate);
	}
	catch (err) {
		console.warn('Error with the display block dates page: ', err);
		myError(fm, 'We encountered an error. Please submit a new Help Desk Ticket for this issue.');
		top();
	}
}
