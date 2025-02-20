import ManageUser from "../../../classes/ManageUser.js";
import setupBackupNotice from "../../../utils/backup-notice/backupNotice.js";
import { myError, mySuccess } from "../../../utils/dom/domUtils.js";
import { validateDateFormat, validateTimeZone } from "../../../utils/validation/validationUtils.js";
import populateDateTimeForm from "./helpers/populateDateTimeForm.js";

// Get the manage user class
const manageUser = new ManageUser();

// Set the back-up data reminder
setupBackupNotice();

// Set DOM Elements
const dateTimeForm = document.getElementById('date-time-form');
const timeZone = document.getElementById('time-zone');
const timeZoneError = document.getElementById('time-zone-error');
const dateFormat = document.getElementById('date-format');
const dateFormatError = document.getElementById('date-format-error');
const fm = document.getElementById('form-msg');

// Populate the dateTime form
populateDateTimeForm(manageUser, { timeZone, dateFormat });

async function handleFormSubmission(evt) {
	// Prevent the form from submitting
	evt.preventDefault();
	try {
		// Add a processing message
		mySuccess(fm, 'Processing...', 'w3-text-blue');

		// Get the userData
		const userData = Object.fromEntries(new FormData(evt.target));

		const stores = manageUser.getStoreNames();
		
		// Update the user settings
		const updateSettings = await manageUser.updateLocalUserSettings({
			userData, 
			settingsProperty: 'date_time', 
			backupStore: stores.DATETIME,  // Using the store names getter
			backupAPITag: 'add_date_time'
		});

		if (updateSettings) {
			mySuccess(fm, 'Date/Time Options have been saved.');
		}
		else {
			myError(fm, 'We were unable to save your Date/Time Options.<br>Please submit a new Help Desk Ticket for this issue.');
		}
	}
	catch (err) {
		console.warn('Error adding date time options for user: ', err);
		myError(fm, 'Something went wrong.');

		// Log the error to the server
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('dateTimeFormSubmissionError', 'Date/Time Form Submission Error:', err);
	}
}

// Set the event listeners for the form
dateFormat.addEventListener('change', (evt) => validateDateFormat(evt, dateFormatError));
timeZone.addEventListener('change', (evt) => validateTimeZone(evt, timeZoneError));
dateTimeForm.addEventListener('submit', handleFormSubmission);