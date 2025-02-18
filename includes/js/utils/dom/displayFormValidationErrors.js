
import { underscoreToHyphen, underscoreToHyphenPlusError } from "../string/stringUtils.js";
import { myError, top } from "./domUtils.js";

export default async function displayFormValidationErrors(errors) {
	try {
		// Loop through the array of objects
		for (const error of errors) { 
			const { input, msg } = error;

			// Get the error container
			const errorContainer = underscoreToHyphenPlusError(input);

			// Add the error to each input error container and add the border to the input element
			myError(errorContainer, msg, underscoreToHyphen(input));
		}

		myError(document.getElementById('form-msg'), 'Please fix the following errors');
		top();
	}
	catch (err) {
		const { default: errorLogs } = await import("../../utils/error-messages/errorLogs.js");
		await errorLogs('displayFormValidationErrorsError', 'Display Form Validation Errors Error: ', err);
		return false;
	}
}