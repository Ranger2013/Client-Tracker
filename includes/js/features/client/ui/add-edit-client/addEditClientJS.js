import checkAppointment from '../../../../core/services/appointment-block/checkAppointment.js';
import { disableEnableSubmitButton } from '../../../../core/utils/dom/elements.js';
import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils.js';
import getAllFormIdElements from '../../../../core/utils/dom/forms/getAllFormIDElements.js';
import { addListener, removeListeners } from '../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.js';
import { hyphenToSpaces, hyphenToUnderscore, ucwords } from '../../../../core/utils/string/stringUtils.js';
import { top } from '../../../../core/utils/window/scroll.js';

const COMPONENT_ID = 'add-edit-client';
const FORM_FIELDS = [
	'client-name', 'street', 'city', 'state',
	'zip', 'distance', 'phone', 'email', 'trim-cycle'
];

/**
 * Initializes the add/edit client functionality
 * @param {string|null} cID - Client ID for editing, null for new clients
 * @param {string|null} primaryKey - Database primary key for editing
 * @param {Object|null} clientInfo - Existing client information for editing
 * @returns {Promise<Function>} Cleanup function to remove event listeners
 */
export default async function addEditClient({ cID, primaryKey, clientInfo = null, manageClient, manageUser }) {
	try {
		const elements = getAllFormIdElements('client-form');

		// Simplified anchor listener since selectPage handles its own errors. This is if we are editing a client
		const clientNav = document.querySelector('[data-component="client-navigation"]');
		if (clientNav) {
			const { default: selectPage } = await import('../../../../core/navigation/services/selectPage.js');
			addListener({
				elementOrId: clientNav,
				eventType: 'click',
				handler: evt => {
					evt.preventDefault();
					selectPage({
						evt,
						page: 'singleClient',
						cID: clientNav.dataset.clientId,
						primaryKey: clientNav.dataset.primaryKey
					});
				},
				componentId: COMPONENT_ID
			});
		}

		initializeAppointmentCheck({ elements, clientInfo, manageClient, manageUser });
		initializeForm({ cID, primaryKey, clientInfo, manageClient, manageUser });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});

		const button = document.getElementById('submit-button');
		if (button) button.disabled = true;
	}

}

/**
 * Sets up appointment checking functionality
 * @param {Object} elements - Form elements object
 * @param {Object|null} clientInfo - Client information for existing clients
 * @param {Object} manageClient - Client management instance
 * @param {Object} manageUser - User management instance
 */
function initializeAppointmentCheck({ elements, clientInfo, manageClient, manageUser }) {
	const appointmentParams = {
		trimDate: elements['trim-date'],
		trimCycle: elements['trim-cycle'],
		appBlock: 'appointment-block',
		projAppBlock: 'projected-appointment-block',
		clientInfo,
		manageClient,
		manageUser,
	};

	checkAppointment(appointmentParams);

	// Watch trim date changes
	addListener({
		elementOrId: 'trim-date',
		eventType: 'change',
		handler: () => {
			checkAppointment(appointmentParams);
		},
		componentId: COMPONENT_ID,
	})
}

/**
 * Sets up form validation and submission handlers
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @param {Object|null} clientInfo - Client information
 */
function initializeForm({ cID, primaryKey, clientInfo, manageClient, manageUser }) {
	const form = document.getElementById('client-form');
	if (!form) return;

	// Delegate all input validation to form level
	addListener({
		elementOrId: form,
		eventType: 'input',
		handler: async (evt) => {
			const field = evt.target;
			if (FORM_FIELDS.includes(field.id)) {
				const debouncedValidation = createDebouncedHandler(
					() => handleFormValidation({ evt, field: field.id, cID, primaryKey, clientInfo, manageClient }),
					getOptimalDelay('validation')
				);
				debouncedValidation();
			}
		},
		componentId: COMPONENT_ID
	});

	// Handle the form submission
	addListener({
		elementOrId: form,
		eventType: 'submit',
		handler: (evt) => {
			evt.preventDefault();
			handleFormSubmission({evt, cID, primaryKey, clientInfo, manageClient, manageUser});
		},
		componentId: COMPONENT_ID
	});
}

/**
 * Handles individual form field validation
 * @param {Event} evt - Input event object
 * @param {string} field - Field ID being validated
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @returns {Promise<void>}
 * @throws {Error} If validation fails
 */
async function handleFormValidation({ evt, field, cID, primaryKey, clientInfo, manageClient }) {
	try {
		const error = await checkClientFormValidity({ evt, cID, primaryKey, manageClient });
		const errorContainer = `${field}-error`;

		if (error) {
			safeDisplayMessage({
				elementId: errorContainer,
				message: error,
				targetId: field,
			});
			addListener({
				elementOrId: field,
				eventType: 'focus',
				handler: () => clearMsg({ container: errorContainer, hide: true, input: field }),
				componentId: COMPONENT_ID,
			});
		} else {
			clearMsg({ container: errorContainer, hide: true, input: field });
		}

		await disableEnableSubmitButton('submit-button');
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
			displayTarget: 'form-msg',
		}, true);

		document.getElementById('submit-button').disabled = true;
	}
}

/**
 * Validates a client form field
 * @param {Object} params - Validation parameters
 * @param {Event} params.evt - The event object
 * @param {string|null} params.cID - Client ID
 * @param {string|null} params.primaryKey - Database primary key
 * @returns {Promise<string|boolean>} Error message or false if valid
 * @throws {Error} If validation fails
 */
async function checkClientFormValidity({ evt, cID, primaryKey, manageClient }) {
	try {
		// Return if the event is the form itself
		if (evt.target.id === 'client-form') return true;

		const fnName = `validate${ucwords(hyphenToSpaces(evt.target.id)).replace(' ', '')}`;
		const module = await import(`./components/${fnName}.js`);
		const validate = module.default;

		if (typeof validate === 'function') {
			return validate({ evt, cID, primaryKey, manageClient });
		}
		else {
			throw new Error('Invalid function name.');
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
			displayTarget: 'form-msg',
		}, true);
	}
}

/**
 * Validates all form fields before submission
 * @param {Object} userData - Form elements object
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @returns {Promise<boolean>} True if all fields are valid, false otherwise
 */
async function validateAllFormFields({userData, cID, primaryKey, manageClient}) {
	let hasErrors = false;

	for (const fieldId of FORM_FIELDS) {
		const fieldName = hyphenToUnderscore(fieldId);
		
		const fieldValue = userData[fieldName];
		const field = document.getElementById(fieldId);

		if (!field) continue;

		const evt = { target: field };
		const error = await checkClientFormValidity({ evt, cID, primaryKey, manageClient });

		if (error) {
			safeDisplayMessage({
				elementId: `${fieldId}-error`,
				message: error,
				targetId: fieldId,
			})
			hasErrors = true;
		}
	}

	return !hasErrors;
}

/**
 * Handles the form submission process
 * @param {Event} evt - Form submission event
 * @param {Object} elements - Form elements object use in the validation process
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Client primary key
 * @param {Object|null} clientInfo - Client information used in the check appointment process
 * @returns {Promise<void>}
 */
async function handleFormSubmission({evt, cID, primaryKey, clientInfo, manageClient, manageUser}) {
	try {
		const userData = Object.fromEntries(new FormData(evt.target));

		const [ isValid, trimCycleCheck ] = await Promise.all([
			validateAllFormFields({userData, cID, primaryKey, manageClient}),
			handleTrimCycleCheck(userData)
		]);

		// Validate all form fields before submission. In the case the user found a loop hole. 
		if (!isValid) {
			top();
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Please correct all errors before submitting.'
			})
			disableEnableSubmitButton('submit-button');
			return;
		}

		// Checks for trim cycle in case it is null
		if (!trimCycleCheck) return;

		const { default: formSubmission } = await import("./components/addEditFormSubmission.js");
		const response = await formSubmission({ evt, cID, primaryKey, manageClient });
		const { status, message, delete: isDelete } = handleIDBResponse(response);

		// Handle the response
		if (status === 'success') {
			top();

			safeDisplayMessage({
				elementId: 'form-msg',
				message,
				isSuccess: true,
			});

			if (isDelete) {
				evt.target.remove();
				return;
			}

			// Reset the check appointments
			checkAppointment({
				trimDate: 'trim-date',
				trimCycle: 'trim-cycle',
				appBlock: 'appointment-block',
				projAppBlock: 'projected-appointment-block',
				clientInfo,
				manageClient,
				manageUser,
			});
			
			// Reset the form
			evt.target.reset();
			return;
		}
	}
	catch (err) {
		top();
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});
	}
}

async function handleTrimCycleCheck(userData) {
	try {
		if (userData.trim_cycle === 'null') {
			top();

			// Show the error message
			safeDisplayMessage({
				elementId: 'trim-cycle-error',
				message: 'Please select a trim cycle',
				targetId: 'trim-cycle',
			});

			// Add a focus listener to clear the error message
			addListener({
				elementOrId: 'trim-cycle',
				eventType: 'focus',
				handler: () => clearMsg({ container: 'trim-cycle-error', hide: true, input: 'trim-cycle' }),
				componentId: COMPONENT_ID,
			});

			disableEnableSubmitButton('submit-button');
			return false;
		}

		return true;
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
			displayTarget: 'form-msg',
		}, true);
	}
}

function handleIDBResponse(response) {
	try {
		if (!response || !response.status) throw new Error('No response data found.');

		if (response.status === 'success' && response.type === 'delete') {
			return { status: 'success', message: response.msg, delete: true }
		}
		else if (response.status === 'success') {
			return { status: 'success', message: response.msg, delete: false }
		}
		else {
			throw new Error('Unknown error occurred during form submission.')
		}
	}
	catch (err) {
		throw err;
	}
}