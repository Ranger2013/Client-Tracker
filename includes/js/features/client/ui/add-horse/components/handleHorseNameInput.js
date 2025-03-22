import { disableEnableSubmitButton } from '../../../../../core/utils/dom/elements.min.js';
import { trimCycleRange } from '../../../../../core/utils/dom/forms/trimCycleConfigurations.min.js';
import { addListener } from '../../../../../core/utils/dom/listeners.min.js';
import { clearMsg, safeDisplayMessage } from '../../../../../core/utils/dom/messages.min.js';
import { ucwords, underscoreToHyphen, underscoreToHyphenPlusError } from '../../../../../core/utils/string/stringUtils.min.js';

// Set up debugging log
const COMPONENT = 'Add Horse Page';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export async function handleHorseNameInput({ evt, cID, primaryKey, manageClient, componentId }) {
	try {
		const horseNameValue = evt.target.value;
		const errorEle = `${evt.target.id}-error`;

		// Clear any existing error messages
		if (!horseNameValue) {
			clearMsg({ container: errorEle, hide: true, input: evt.target });
			return;
		}

		const duplicate = await isDuplicateHorseName({ horseName: horseNameValue, cID, primaryKey, manageClient });

		if (duplicate) {
			safeDisplayMessage({
				elementId: errorEle,
				message: `${horseNameValue} is already listed.`,
				targetId: evt.target.id,
			});

			// Disable the submit button
			disableEnableSubmitButton('submit-button');
			clearMsg({ container: 'form-msg' });

			return;
		}

		// Format the horse name
		evt.target.value = ucwords(horseNameValue);

		// Clear the error message
		clearMsg({ container: errorEle, hide: true, input: evt.target });
		clearMsg({ container: 'form-msg' });
		document.getElementById('submit-button').disabled = false;
		disableEnableSubmitButton('submit-button');

		return;
	}
	catch (err) {
		// Handles it's own errors
		const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}

export async function isDuplicateHorseName({ horseName, cID, primaryKey, manageClient }) {
	try {
		const clientHorses = await manageClient.getClientHorses({ primaryKey });

		// Return early if no horses
		if (!clientHorses?.length) return false;


		return clientHorses.some(horse => horse.horse_name.toLowerCase() === horseName.trim().toLowerCase());

	}
	catch (err) {
		throw err;
	}
}

export async function handleAddHorseFormSubmission({ evt, cID, primaryKey, manageClient, componentId }) {
	try {
		const userData = Object.fromEntries(new FormData(evt.target));
		// Short cut to get the form element. Only a single input, no sense in using a form object
		const horseName = userData.horse_name.trim();
		cID = parseInt(cID, 10);
		primaryKey = parseInt(primaryKey, 10);

		// Validate the form
		const isValidated = await validateAddHorseForm(userData);
		if (!isValidated) return;

		debugLog('Validation:', isValidated);
		// Add the new horse
		const response = await manageClient.addNewHorse({userData, cID, primaryKey });

		if (response) {
			// Clear the form
			evt.target.reset();

			// Display success message
			safeDisplayMessage({
				elementId: 'form-msg',
				message: `${horseName} has been added.`,
				isSuccess: true,
			});
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});
	}
}

async function validateAddHorseForm(userData) {
	try {
		const validations = [
			{
				test: () => !!userData.horse_name?.trim(),
				error: {
					message: 'Please enter a horse name.',
					targetError: 'horse-name-error',
					target: 'horse-name'
				}
			},
			{
				test: () => trimCycleRange.includes(parseInt(userData.trim_cycle, 10)),
				error: {
					message: 'Please select a valid trim cycle.',
					targetError: 'trim-cycle-error',
					target: 'trim-cycle'
				}
			},
			{
				test: () => userData.horse_type !== 'null',
				error: {
					message: 'Please select a horse type.',
					targetError: 'horse-type-error',
					target: 'horse-type'
				}
			},
		];

		const errors = validations.filter(validation => !validation.test()).map(validation => validation.error);

		if (errors.length > 0) {
			errors.forEach(error => {
				safeDisplayMessage({
					elementId: error.targetError,
					message: error.message,
					targetId: error.target
				});
			});

			return false;
		}
		return true;
	}
	catch(err){
		const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
		AppError.process(err, {
			errorCode: AppError.Types.VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
		}, true);
	}
}