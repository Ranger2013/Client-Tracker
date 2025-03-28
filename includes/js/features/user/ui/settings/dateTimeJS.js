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

import { addListener, removeListeners } from "../../../../core/utils/dom/listeners.js";
import { clearMsg, safeDisplayMessage } from "../../../../core/utils/dom/messages.js";
import { disableEnableSubmitButton } from "../../../../core/utils/dom/elements.js";
import ManageUser from "../../models/ManageUser.js";
import populateDateTimeForm from "./components/date-time/populateDateTimeForm.js";

/**
 * Component ID for event listener tracking
 * Used for cleanup during SPA navigation
 * @constant {string}
 */
const COMPONENT_ID = 'date-time';
const COMPONENT_ERROR = 'date-time-error';
const manageUser = new ManageUser();

// Set DOM Elements
const timeZone = document.getElementById('time-zone');
const dateFormat = document.getElementById('date-format');

// Populate the dateTime form
populateDateTimeForm(manageUser, { timeZone, dateFormat });

async function handleFormSubmission(evt) {
	evt.preventDefault();
	try {
		// Show processing message
		safeDisplayMessage({
			elementId: 'form-msg',
			message: 'Processing...',
			isSuccess: true,
			color: 'w3-text-blue',
		});

		// Validate form
		const isValid = await validateFormFields(evt.target);
		if (!isValid) {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Please correct the form errors.',
			});
			return;
		}

		// Process valid form
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
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Date/Time Options have been saved.',
				isSuccess: true,
			});
		}
		else {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'We were unable to save your Date/Time Options.',
			});
		}
	} catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		await AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});

		// Disable the submit button
		document.getElementById('submit-button').disabled = true;
	}
}

/**
 * Centralized form validation handler
 * @param {HTMLFormElement} form
 * @returns {Promise<boolean>}
 * @throws {AppError} If validation fails
 */
async function validateFormFields(form) {
	try {
		// Run all validations synchronously
		const dateFormatValid = validateDateFormat({
			value: form.date_format.value,
			errorContainer: 'date-format-error',
			inputContainer: 'date-format'
		});

		const timeZoneValid = validateTimeZone({
			value: form.time_zone.value,
			errorContainer: 'time-zone-error',
			inputContainer: 'time-zone'
		});

		// Return true only if all validations pass
		return dateFormatValid && timeZoneValid;
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		await AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
			displayTarget: 'form-msg',
		}, true);
	}
}

/**
 * Validates the selected date format against allowed patterns
 * @param {Object} params Validation parameters
 * @param {string} params.value The date format value to validate
 * @param {HTMLElement|string} params.errorContainer Element or ID for error messages
 * @param {HTMLElement|string} params.inputContainer Input element for error styling
 * @returns {boolean} True if validation passes
 */
function validateDateFormat({ value, errorContainer, inputContainer }) {
	const dateFormats = ['Y-m-d', 'm-d-Y', 'd-m-Y'];
	const isValid = dateFormats.includes(value);

	if (isValid) {
		clearMsg({ container: errorContainer, input: inputContainer });
		return true;
	}

	safeDisplayMessage({
		elementId: errorContainer,
		message: 'Please select a valid date format.',
		targetId: inputContainer,
	});
	return false;
}

/**
 * Validates timezone selection against US continental timezones
 * @param {Object} params Validation parameters
 * @param {string} params.value The timezone value to validate
 * @param {HTMLElement|string} params.errorContainer Element or ID for error messages
 * @returns {boolean} True if validation passes
 */
function validateTimeZone({ value, errorContainer, inputContainer }) {
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
		if (timeZone.toLowerCase() === value.toLowerCase()) {
			isMatch = true;
			break;
		}
	}

	// If a match is found, clear any messages and enable the submit button
	if (isMatch) {
		clearMsg({ container: errorContainer, input: inputContainer });
		disableEnableSubmitButton('submit-button');
		removeListeners(COMPONENT_ERROR);
		return true;
	}
	// No match was found, show the error message and disable the submit button
	else {
		safeDisplayMessage({
			elementId: errorContainer,
			message: 'Please select a valid time zone.',
			targetId: inputContainer,
		});

		addListener({
			elementOrId: inputContainer,
			eventType: 'focus',
			handler: () => {
				clearMsg({ container: errorContainer, input: inputContainer });
				disableEnableSubmitButton('submit-button');
			},
			componentId: COMPONENT_ERROR
		});

		return false;
	}
}

// Add listeners with component tracking
addListener({
	elementOrId: 'date-time-form',
	eventType: 'submit',
	handler: handleFormSubmission,
	componentId: COMPONENT_ID
});