
import ManageUser from "../../../../../classes/ManageUser.js";
import { myError, mySuccess, top } from "../../../../../utils/dom/domUtils.js";
import errorLogs from "../../../../../utils/error-messages/errorLogs.js";
import { helpDeskTicket } from "../../../../../utils/error-messages/errorMessages.js";

export default async function handleBlockDatesFormSubmission(evt, fm, dates) {
	try {
		const manageUser = new ManageUser();

		// Update the user settings
		if (await manageUser.updateLocalUserSettings({
			userData: dates,
			settingsProperty: 'blocked_dates',
		})) {
			mySuccess(fm, 'Blocked dates have been updated.');
			top();
			return;
		}
		
		myError(fm, `Unable to update your blocked dates.<br>${helpDeskTicket}`);
		top();
		return;
	}
	catch (err) {
		await errorLogs('handleBlockDatesFormSubmissionError', 'Handle block dates form submission error: ', err);
		myError(fm, `There was a problem updating your blocked dates.<br>${helpDeskTicket}`);
		top();
	}
}