/**
 * @fileoverview Manages date/time settings form functionality including validation,
 * form submission, and local data synchronization.
 * 
 * This is a server-rendered page that may override initial values with local IndexedDB data.
 * Event listeners are tracked for cleanup during SPA navigation.
 * 
 * @module dateTimeJS
 * @requires ManageUser
 * @requires addListener
 * @requires myError
 * @requires mySuccess
 */

import { addListener } from "../../../utils/event-listeners/listeners.js";
import { clearMsg, disableEnableSubmitButton, myError, mySuccess } from "../../../utils/dom/domUtils.js";
import ManageUser from "../../../classes/ManageUser.js";
import populateDateTimeForm from "./helpers/populateDateTimeForm.js";

/**
 * Component ID for event listener tracking
 * Used for cleanup during SPA navigation
 * @constant {string}
 */
const COMPONENT_ID = 'date-time';
const manageUser = new ManageUser();

// Set DOM Elements
const timeZone = document.getElementById('time-zone');
const dateFormat = document.getElementById('date-format');

// Populate the dateTime form
populateDateTimeForm(manageUser, { timeZone, dateFormat });

/**
 * Validates the selected date format against allowed patterns
 * @param {Event} evt - Change event from date format select
 * @param {HTMLElement} dateFormatError - Error container element
 * @returns {void}
 */
function validateDateFormat(evt, dateFormatError) {
	// Set the date formats
	const dateFormats = [
		'Y-m-d',
		'm-d-Y',
		'd-m-Y'
	];

	for (const format of dateFormats) {
		// We have a match from the form, return true
		if (format === evt.target.value) {
			// Clear any error messages
			clearMsg({ container: dateFormatError, input: evt.target });

			// Disable the submit button
			disableEnableSubmitButton('submit-button');
			return;
		}
	}

	// No match from the form, show error message;
	myError(dateFormatError, 'Please select a valid date format.', evt.target);

	// Disable the submit button
	disableEnableSubmitButton('submit-button');
}


/**
 * Validates timezone selection against US continental timezones
 * @param {Event} evt - Change event from timezone select
 * @param {HTMLElement} timeZoneError - Error container element
 * @returns {void}
 */
function validateTimeZone(evt, timeZoneError) {
	// Set all the time zones for the continental U.S.
	const timeZones = {
		'America/New_York': 'Eastern Time Zone',
		'America/Chicago': 'Central Time Zone',
		'America/Denver': 'Mountain Time Zone',
		'America/Phoenix': 'Mountain Time No DST',
		'America/Los_Angeles': 'Pacific Time Zone',
		'America/Anchorage': 'Alaska Time Zone'
	};

	// Check if the input matches any time zone
	let isMatch = false;

	// Loop through the time zones
	for (const timeZone in timeZones) {
		// If we have a match, it passes, return true;
		if (timeZone.toLowerCase() === evt.target.value.toLowerCase()) {
			isMatch = true;
			break;
		}
	}

	// If a match is found, clear any messages and enable the submit button
	if (isMatch) {
		clearMsg({ container: timeZoneError, input: evt.target });
		disableEnableSubmitButton('submit-button');
	}
	// No match was found, show the error message and disable the submit button
	else {
		myError(timeZoneError, 'Please select a valid time zone.', evt.target);
		disableEnableSubmitButton('submit-button');
	}
}

/**
 * Handles form submission, saves to IndexedDB and queues for server sync
 * @param {SubmitEvent} evt - Form submission event
 * @returns {Promise<void>}
 * @throws {Error} If settings update fails
 */
async function handleFormSubmission(evt) {
	// Prevent the form from submitting
	evt.preventDefault();
	try {
		// Add a processing message
		mySuccess('form-msg', 'Processing...', 'w3-text-blue');

		// Get the userData
		const userData = Object.fromEntries(new FormData(evt.target));
		const stores = manageUser.getStoreNames();

		// Update the user settings
		const updateSettings = await manageUser.updateLocalUserSettings({
			userData, 
			settingsProperty: 'date_time', 
			backupStore: stores.DATETIME,
			backupAPITag: 'add_date_time'
		});

		if (updateSettings) {
			mySuccess('form-msg', 'Date/Time Options have been saved.');
		}
		else {
			myError('form-msg', 'We were unable to save your Date/Time Options.');
		}
	}
	catch (err) {
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError({
			filename: 'dateTimeFormError',
			consoleMsg: 'Date/Time form submission error: ',
			err,
			userMsg: 'Unable to save date/time options',
			errorEle: 'form-msg'
		});
	}
}

// Add listeners with component tracking
addListener('date-format', 'change', 
    evt => validateDateFormat(evt, 'date-format-error'), 
    COMPONENT_ID
);

addListener('time-zone', 'change', 
    evt => validateTimeZone(evt, 'time-zone-error'), 
    COMPONENT_ID
);

addListener('date-time-form', 'submit', handleFormSubmission, COMPONENT_ID);