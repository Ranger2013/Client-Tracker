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
		safeDisplayMessage({
			elementId: 'form-msg',
			message: 'Processing...',
			isSuccess: true,
			color: 'w3-text-blue',
		});

		const validate = validateForm(evt.target);  // Removed await

		// Validate the form
		if (!validate) {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Please correct the following errors.',
			});
			return;
		}

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
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		await AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: 'Unable to save Date/Time Options.',
			displayTarget: 'form-msg',
		});
	}
}

/**
 * Validates the entire form
 * @param {HTMLFormElement} form - The form element to validate
 * @returns {boolean} True if all validations pass
 */
function validateForm(form) {  // Removed async
	try {
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

		disableEnableSubmitButton('submit-button');
		return dateFormatValid && timeZoneValid;
	}
	catch (err) {
		return import("../../../../core/errors/models/AppError.js")
			.then(({ AppError }) => {
				const error = new AppError('Error validating the Date/Time form', {
					originalError: err,
					errorCode: AppError.Types.FORM_VALIDATION_ERROR,
					userMessage: 'Unable to validate the form.',
					displayTarget: 'form-msg',
					});
				throw error;  // This will be properly caught by handleFormSubmission
			});
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
	try {
		throw new Error("Test error thrown from validateDateFormat function.");
		// Set the date formats
		const dateFormats = [
			'Y-m-d',
			'm-d-Y',
			'd-m-Y'
		];

		for (const format of dateFormats) {
			// We have a match from the form, return true
			if (format === value) {
				// Clear any error messages
				clearMsg({ container: errorContainer, input: inputContainer });

				// Disable the submit button
				disableEnableSubmitButton('submit-button');

				// Remove the focuss event listener
				removeListeners(COMPONENT_ERROR);
				return true;
			}
		}

		// No match from the form, show error message;
		safeDisplayMessage({
			elementId: errorContainer,
			message: 'Please select a valid date format.',
			targetId: inputContainer,
		})

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
	catch (err) {
		return import("../../../../core/errors/models/AppError.js")
			.then(({ AppError }) => {
				const error = new AppError('Error validating the Date Format', {
					originalError: err,
					errorCode: AppError.Types.FORM_VALIDATION_ERROR,
					userMessage: null
				});
				throw error;  // This will be caught by validateForm's catch
			});
	}

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