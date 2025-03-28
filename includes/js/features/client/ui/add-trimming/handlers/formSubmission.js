import { disableEnableSubmitButton } from '../../../../../core/utils/dom/elements.js';
import { clearMsg, safeDisplayMessage } from '../../../../../core/utils/dom/messages.js';
import { top } from '../../../../../core/utils/window/scroll.js';
import ManageTrimming from '../../../models/ManageTrimming.js';

const COMPONENT = 'Form Submission';
const DEBUG = true;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function handleAddTrimmingFormSubmission({ evt, cID, primaryKey, mainContainer, manageClient }) {
	try {
		// Clear any previous messages
		clearMsg({ container: 'form-msg' });

		// Process the data from the form due to select elements having multiple selections
		const userData = processFormData(new FormData(evt.target));
		debugLog('User Data: after form submission:', userData);
		// Validate the form data
		const isValidated = await validateTrimmingForm({ userData });
		debugLog('Validation:', isValidated);
		const { status, message, target, targetError } = isValidated;

		// Return early if we have errors
		if (!status) {
			// Show general error message
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Please fix the following errors:',
			});

			// Show specific error message
			safeDisplayMessage({
				elementId: targetError,
				message: message,
				targetId: target,
			});

			top();
			disableEnableSubmitButton('submit-button');
			return;
		}

		const manageTrimming = new ManageTrimming({debug: false});
		const result = await manageTrimming.handleAddTrimmingSession({ cID, primaryKey, userData });

		debugLog('Form Submission result:', result);

		// Handle success
		safeDisplayMessage({
			elementId: 'form-msg',
			message: result.message,
			isSuccess: result.status === 'ok' ? true : false,
		});

		handleFormReset({ evt, numberHorseContainer: 'number-horse-container', userData });
	}
	catch (err) {
		console.warn('Error submitting form:', err);
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});
	}
}

/**
 * Processes form data into a structured object
 * @param {FormData} formData - The form data to process
 * @returns {Object} Processed form data object
 */
function processFormData(formData) {
	try {
		const entries = Array.from(formData.entries());
		debugLog('Form Entries:', entries);

		const processedData = entries.reduce((accumulator, [key, value]) => {
			debugLog('Processing:', { key, value });

			return {
				...accumulator,
				...processFormField(key, value, accumulator)
			};
		}, {});

		debugLog('Processed Data:', processedData);
		return processedData;
	} catch (err) {
		console.error('Error processing form data:', err);
		throw err;
	}
}

/**
 * Process individual form field based on field type
 * @param {string} key - Field key
 * @param {string} value - Field value
 * @param {Object} accumulator - Current accumulated data
 * @returns {Object} Processed field data
 */
function processFormField(key, value, accumulator) {
	if (key === 'number-horses') {
		return { number_horses: value };
	}

	if (key.startsWith('horse_list_')) {
		return { [key]: value ?? "null" };
	}

	if (key.startsWith('accessories_')) {
		const existingAccessories = accumulator[key] ?? [];
		return value.trim() ? { [key]: [...existingAccessories, value] } : { [key]: existingAccessories };
	}

	return (value.trim() || value === '0') ? { [key]: value } : {};
}

async function validateTrimmingForm({ userData }) {
	try {
		// We only need to verify number_horses exists since the UI prevents invalid states
		if (!userData.number_horses || userData.number_horses === '0' || userData.number_horses === '') {
			return { status: false, message: 'Please enter the number of horses.', targetError: 'number-horses-error', target: 'number-horses' };
		}

		return { status: true };
	}
	catch (err) {
		throw err;
	}
}

function getReceiptMessage(status) {
	const messages = {
		'success': 'Receipt sent successfully',
		'auth-error': 'Authorization error sending receipt',
		'error': 'Server error sending receipt - will retry during backup',
		'offline': 'Receipt will be sent when online'
	};
	return messages[status] || null;
}

function handleFormReset({ evt, numberHorseContainer, userData }) {
	debugLog('userData: ', userData);
	const { trim_date: trimDate, next_trim_date: nextTrimDate, app_time: appTime } = userData;
	debugLog('trimDate: ', trimDate);
	debugLog('nextTrimDate: ', nextTrimDate);
	debugLog('appTime: ', appTime);
	// Reset the form
	evt.target.reset();

	// Put default values back
	document.getElementById('trim-date').value = trimDate;
	document.getElementById('next-trim-date').value = nextTrimDate;
	document.getElementById('app-time').value = appTime;

	// Clear the number horse container
	document.getElementById(numberHorseContainer).innerHTML = '';

	// Scroll to top
	top();
}