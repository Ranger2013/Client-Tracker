
import ManageUser from "../../../../../classes/ManageUser.js";
import updateCalendar from "../../../../../utils/calendar/helpers/updateCalendar.js";
import { myError, mySuccess, top } from "../../../../../utils/dom/domUtils.js";
import errorLogs from "../../../../../utils/error-messages/errorLogs.js";
import { helpDeskTicket } from "../../../../../utils/error-messages/errorMessages.js";

export default async function handleClearBlockDatesFormSubmission(evt, fm, calendar, storedDates, onUpdate) {
	try {
		const manageUser = new ManageUser();
		
		// Clear the block dates
		storedDates.length = 0;

		if (await manageUser.updateLocalUserSettings({
			userData: storedDates,
			settingsProperty: 'blocked_dates',
		})) {
			mySuccess(fm, 'All Dates Removed.');
			top();

			let currentMonth = new Date().getMonth();
			let currentYear = new Date().getFullYear();

			// Update the calender
			await updateCalendar({
				currentMonth,
				currentYear,
				storedDates,
				calendar,
				onUpdate,
			})

			return;
		}

		myError(fm, `Unable to remove all the dates.<br>${helpDeskTicket}`);
		top();
		return;
	}
	catch (err) {
		await errorLogs('handleClearBlockDatesFormSubmissionError', 'Handle clear block dates form submission error: ', err);
		myError(fm, `There was a problem removing all the dates.<br>${helpDeskTicket}`);
		top();
	}
}