import { clearMsg, myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import handleFormValidation from "../../../utils/validation/handleFormValidation.js";
import validateAddExpensesForm from "../../../utils/validation/validateAddExpensesForm.js";
import addExpensesFormSubmission from "./helpers/addExpensesFormSubmission.js";

export default async function addExpenses() {
	try {
		// Listen for form submission
		addListener('expense-form', 'submit', async (evt) => {
			evt.preventDefault();
			try {
				// Clear any messages
				clearMsg({ container: 'form-msg' });
				top();

				// Get the form values
				const userData = Object.fromEntries(new FormData(evt.target));

				// Handle the form validation
				const validate = await handleFormValidation(userData, validateAddExpensesForm);

				if(!validate) return;

				// Handle the form submission
				const response = await addExpensesFormSubmission(userData);

				if(response.status){
					mySuccess('form-msg', response.msg);
					evt.target.reset();
					return;
				}
				else {
					myError('form-msg', response.msg);
					return;
				}
			}
			catch (err) {
				const { handleError } = await import("../../../utils/error-messages/handleError.js");
				await handleError(
					'addExpensesFormSubmissionError',
					'Error adding expenses: ',
					err,
					'Unable to add expenses. Please try again later.',
					'form-msg',
				);
			}
		});
	}
	catch (err) {
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError(
			'addExpensesError',
			'Error adding expenses: ',
			err,
			'Unable to add expenses. Please try again later.',
			'page-msg',
		);
		throw err;
	}
}