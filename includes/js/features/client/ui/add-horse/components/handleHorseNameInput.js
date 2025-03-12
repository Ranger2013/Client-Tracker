import { disableEnableSubmitButton } from '../../../../../core/utils/dom/elements';
import { addListener } from '../../../../../core/utils/dom/listeners';
import { clearMsg, safeDisplayMessage } from '../../../../../core/utils/dom/messages';
import { ucwords } from '../../../../../core/utils/string/stringUtils';

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
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
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
		// Short cut to get the form element. Only a single input, no sense in using a form object
		const horseName = evt.target.elements['horse-name'].value.trim();
		cID = parseInt(cID, 10);
		primaryKey = parseInt(primaryKey, 10);

		// If horse name is empty, show error message and return early
		if (!horseName) {
			safeDisplayMessage({
				elementId: `${evt.target.id}-error`,
				message: 'Please enter the horse\'s name.',
				targetId: 'horse-name',
			});

			// Add the focus event listener
			addListener({
				elementOrId: evt.target,
				eventType: 'focus',
				handler: () => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
				componentId
			});
			return;
		}

		// Add the new horse
		const response = await manageClient.addNewHorse({horseName, cID, primaryKey});

		if(response){
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
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});
	}
}