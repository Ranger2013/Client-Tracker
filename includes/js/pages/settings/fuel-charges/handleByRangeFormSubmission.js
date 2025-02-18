import ManageFuelCharges from "../../../classes/ManageFuelCharges.js";
import displayFormValidationErrors from "../../../utils/dom/displayFormValidationErrors.js";
import { clearMsg, myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { isNumeric, validateRange } from "../../../utils/validation/validationUtils.js";

export default async function handleByRangeFormSubmission(evt) {
	evt.preventDefault();

		// DOM Elements
		const fm = document.getElementById('form-msg');

	try {
		// Clear any messages
		clearMsg({ container: fm });

		// Get the user data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Validate the form
		const validate = validateForm(userData);

		if(!validate) return;

		// Manage User class
		const manageFuelCharges = new ManageFuelCharges();

		// Add the fuel charges
		if(manageFuelCharges.addFuelChargesByRange(userData)){
			mySuccess(fm, 'Fuel Charges have been added');
			top();
		}
	}
	catch (err) {
		const {default: errorLogs} = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleByRangeFormSubmissionError', 'Handle by range form submission error: ', err);

		const { helpDeskTicket } = await import("../../../utils/error-messages/errorMessages.js");
		myError(fm, `Unable to add mileage charges at this time.<br>${helpDeskTicket}`);
	}
}

function validateForm(userData) {
	let validationError = [];

	// Loop through the userData for form validation
	for (const data in userData) {
		if (data.includes('ranges') || data.includes('cost')) {
			const validate = isNumeric(userData[data]);

			if (!validate) {
				validationError.push({ input: data, msg: 'Input must be numeric.' });
			}
		}
		else if (data.includes('mileage')) {
			const validate = validateRange(userData[data]);

			if (!validate) {
				validationError.push({ input: data, msg: 'Improper range format.' })
			}
		}
	}


	if (validationError.length > 0) {
		displayFormValidationErrors(validationError);
		return false;
	}

	return true;
}