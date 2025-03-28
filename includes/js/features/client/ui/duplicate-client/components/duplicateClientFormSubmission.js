import { getValidElement } from '../../../../../core/utils/dom/elements.js';
import { trimCycleRange } from '../../../../../core/utils/dom/forms/trimCycleConfigurations.js';
import { clearMsg, safeDisplayMessage } from '../../../../../core/utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../core/utils/string/stringUtils.js';

// Set up debugging
const COMPONENT = 'Duplicate Client Form Submission';
const DEBUG = false;

const debugLog = (...args) => {
	if(DEBUG){
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function duplicateClientFormSubmission({evt, manageClient, manageUser }){
	try{
		clearMsg({container: 'form-msg'});

		// Get the form data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Run the check for the trim cycle. multiples of 7 up to 70
		const isValidTrimCycle = trimCycleRange.includes(parseInt(userData?.trim_cycle));

		// Trim cycle is not selected or is not valid. return early
		if(!isValidTrimCycle){
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Please fix the following errors.'
			});

			safeDisplayMessage({
				elementId: 'trim-cycle-error',
				message: 'Please select a trim/shoeing cycle.',
				targetId: 'trim-cycle',
			});

			return;
		}

		// The select-client option value is cID:primaryKey
		const duplicatedClient = await manageClient.addDuplicateClient(userData);
		const clientName = userData?.select_client.split(':')[1];
		const clientContainer = getValidElement('client-container');

		if(duplicatedClient){
			safeDisplayMessage({
				elementId: 'form-msg',
				message: `The client "<span class="w3-underline">${cleanUserOutput(clientName)}</span>" has been successfully duplicated.`,
				isSuccess: true,
			});

			// Clear the container and reset the form
			clientContainer.innerHTML = '';
			evt.target.reset();
		}
		else{
			safeDisplayMessage({
				elementId: 'form-msg',
				message: `Unable to duplicate ${cleanUserOutput(clientName)} at this time.`,
			});
		}
	}
	catch(err){
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: 'Unable to process the form submission at this time.',
			displayTarget: 'form-msg',
		}, true);
	}
}