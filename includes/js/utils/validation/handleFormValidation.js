import { clearMsg, myError } from "../dom/domUtils.js";
import { addListener } from "../event-listeners/listeners.js";

export default async function handleFormValidation(userData, customFunction) {
	try {
		// Validate the form
		const { isValid, errors } = await customFunction(userData);

		if (!isValid) {
			Object.entries(errors).forEach(([key, value]) => {
				myError(key, value, key.replace('-error', ''));

				addListener(key.replace('-error', ''), 'focus', () => clearMsg({ container: key, hide: true, input: key.replace('-error', '') }));
			});

			myError('form-msg', 'Please fix the following errors.');
			return false;
		}
		return true;
	}
	catch (err) {
		const { handleError } = await import("../../utils/error-messages/handleError.js");
		await handleError(
			'addExpensesFormValidationError',
			'Error validating the form: ',
			err,
			'Unable to validate the form. Please try again later.',
			'form-msg',
		);
		return false;
	}
}