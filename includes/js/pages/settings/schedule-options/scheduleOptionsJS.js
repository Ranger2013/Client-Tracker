import ManageUser from "../../../classes/ManageUser.js";
import setupBackupNotice from "../../../utils/backup-notice/backupNotice.js";
import displayFormValidationErrors from "../../../utils/dom/displayFormValidationErrors.js";
import { clearMsg, myError, mySuccess } from "../../../utils/dom/domUtils.js";
import { helpDeskTicket } from "../../../utils/error-messages/errorMessages.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import { isNumeric } from "../../../utils/validation/validationUtils.js";
import listenersToClearErrors from "./helpers/listenersToClearErrors.js";
import populateScheduleOptionsForm from "./helpers/populateScheduleOptionsForm.js";

// DOM Elements
const fm = document.getElementById('form-msg');
const scheduleOptionsForm = document.getElementById('schedule-options-form');

// Set the back-up data reminder
setupBackupNotice();

// Set event listeners to clear any messages
listenersToClearErrors(scheduleOptionsForm);

// Populate the form
await populateScheduleOptionsForm(scheduleOptionsForm);

// Handle the form submission
async function handleScheduleFormSubmission(evt){
	evt.preventDefault();

	try{
		// Clear any messages
		clearMsg({container: fm});

		const userData = Object.fromEntries(new FormData(evt.target));

		// Validate the fields to ensure they are not empty and they are numeric
		const validate = validateForm(userData);

		// Check for errors
		if(validate && validate.length > 0){
			await displayFormValidationErrors(validate);
			return;
		}

		const manageUser = new ManageUser();

		if(await manageUser.updateLocalUserSettings({
			userData,
			settingsProperty: 'schedule_options',
			backupStore: manageUser.indexed.stores.SCHEDULINGOPTIONS,
			backupAPITag: 'add_scheduleOptions'
		})){
			mySuccess(fm, 'Schedule Options have been saved.');
			return;
		};

		myError(fm, `Unable to save your Schedule Options at this time.<br>${helpDeskTicket}`);
		return;
	}
	catch(err){
		myError(fm, `Unable to save your Schedule Options at this time.<br>${helpDeskTicket}`);
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleScheduleFormSubmissionError', 'Handle Schedule Form Submission Error: ', err);
	}
}

// Validate the form
function validateForm(userData){
	const errors = [];

	for(const data in userData){
		if(userData[data] === '' || !isNumeric(userData[data])){
			errors.push({input: data, msg: 'Field cannot be empty or non-numeric.'});
		}
	}

	if(errors.length > 0) return errors;
	return false;
}

// Add the event listener for the form submission
addListener(scheduleOptionsForm, 'submit', handleScheduleFormSubmission);