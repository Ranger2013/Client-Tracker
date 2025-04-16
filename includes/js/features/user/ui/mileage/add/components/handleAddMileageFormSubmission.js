import setupBackupNotice from '../../../../../../core/services/backup-notice/backupNotice.js';
import { getValidElement } from '../../../../../../core/utils/dom/elements.js';
import { clearMsg, safeDisplayMessage } from '../../../../../../core/utils/dom/messages.js';
import ManageMileage from '../../../../models/ManageMileage.js';

// Set up debug
const COMPONENT = 'Handle Add Mileage Form Submission';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function handleAddMileageFormSubmission({ evt, manageClient, manageUser }) {
	try {
		// Clear any messages
		clearMsg({ container: 'form-msg' });

		// Get the form data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Validate the form data
		const errors = validateMileageForm(userData);

		if (errors.length > 0) {
			renderErrors(errors);
			return;
		}

		// Handle form submission
		const isSubmitted = await handleFormSubmission({ userData, manageUser });

		// Show success message
		if (isSubmitted) {
			showSuccessMessage({evt, manageUser});
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			message: AppError.BaseMessages.forms.submissionFailed,
		});
	}
}

function validateMileageForm(userData) {
	// Set up a mapping for the form elements
	const FORM_FIELDS_MAPPING = {
		selectDestination: {
			inputId: 'select-destination',
			inputName: 'destination',
			isValid: () => {
				return userData?.destination !== 'null';
			},
			errorMsg: 'Please select a destination',
			errorContainer: 'destination-error',
		},
		inputDestination: {
			inputId: 'input-destination',
			inputName: 'destination',
			isValid: () => {
				return userData?.destination?.trim() !== '';
			},
			errorMsg: 'Please enter a destination',
			errorContainer: 'destination-error',
		},
		startingMiles: {
			inputId: 'starting-mileage',
			inputName: 'starting_mileage',
			isValid: () => {
				debugLog('Starting mileage > Ending mileage: ', Number(userData?.starting_mileage) < Number(userData?.ending_mileage));
				return Number(userData?.starting_mileage) < Number(userData?.ending_mileage);
			},
			errorMsg: 'Starting mileage cannot be more than ending mileage',
			errorContainer: 'starting-mileage-error',
		},
		endingMiles: {
			inputId: 'ending-mileage',
			inputName: 'ending_mileage',
			isValid: () => {
				return Number(userData?.ending_mileage) > Number(userData?.starting_mileage);
			},
			errorMsg: 'Ending mileage cannot be less than starting mileage',
			errorContainer: 'ending-mileage-error',
		},
	};

	// Handle missing destination field first
	const missingFieldErrors = !userData.hasOwnProperty('destination')
		? [{
			inputId: null,
			inputError: 'destination-error',
			msg: 'Please enter a destination'
		}]
		: [];

	// Field validation errors using functional approach
	const validationErrors = Object.entries(FORM_FIELDS_MAPPING)
		.filter(([_, config]) => !config.isValid())
		.map(([_, config]) => ({
			inputId: config.inputId,
			inputError: config.errorContainer,
			msg: config.errorMsg,
		}));

	// Combine both types of errors
	return [...missingFieldErrors, ...validationErrors];
}

function renderErrors(errors) {
	// Set the main form-msg error
	safeDisplayMessage({
		elementId: 'form-msg',
		message: 'Please correct the errors below',
	});

	// Set the individual input errors
	errors.forEach(({ inputId, inputError, msg }) => {
		safeDisplayMessage({
			elementId: inputError,
			message: msg,
			targetId: inputId,
		})
	});
}

async function handleFormSubmission({ userData, manageUser }) {
	const manageMileage = new ManageMileage({ debug: false });

	const mileageData = {
		add_mileage: true,
		difference: Number(userData.ending_mileage) - Number(userData.starting_mileage),
		date: new Date().toISOString().slice(0, 10),
		...userData,
	};

	debugLog('Mileage data:', mileageData);
	const result = await manageMileage.addMileage(mileageData);
	return result ? true : false;
}

function showSuccessMessage({evt, manageUser}) {
	safeDisplayMessage({
		elementId: 'form-msg',
		message: 'Mileage added successfully',
		isSuccess: true,
	});

	// Clear the form
	evt.target.reset();

	closeAndDisableInputAndSelectFields();

	setupBackupNotice({ manageUser });
}

function closeAndDisableInputAndSelectFields() {
	const destinationSelect = getValidElement('select-destination');
	const destinationInput = getValidElement('input-destination');
	const clientListDisplayContainer = getValidElement('client-list-display-container');
	const destinationDisplayContainer = getValidElement('destination-display-container');

	destinationDisplayContainer.classList.add('w3-hide');
	clientListDisplayContainer.classList.add('w3-hide');
	destinationSelect.disabled = true;
	destinationInput.disabled = true;
}