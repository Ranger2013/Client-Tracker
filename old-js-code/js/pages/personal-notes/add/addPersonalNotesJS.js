import ManagePersonalNotes from "../../../classes/ManagePersonalNotes.js";
import { getReadableCurrentFutureDate } from "../../../utils/date/dateUtils.js";
import { myError, mySuccess } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import handleFormValidation from "../../../utils/validation/handleFormValidation.js";
import validateAddPersonalNotesForm from "../../../utils/validation/validateAddPersonalNotesForm.js";

export default async function addPersonalNotes({ mainContainer }) {
	try {
		// Set the event listener for the form
		addListener('add-notes-form', 'submit', async (evt) => {
			evt.preventDefault();
			try {
				// Manage notes class
				const managePersonalNotes = new ManagePersonalNotes();

				// Get the form data
				const userData = Object.fromEntries(new FormData(evt.target));

				// Handle the form validation. It will show errors on the form. Return early
				const validate = handleFormValidation(userData, validateAddPersonalNotesForm);
				if(!validate) return;

				// Get the formatted date YYYY-MM-DD
				const today = getReadableCurrentFutureDate();
				userData.date = today;

				// Add the personal notes
				const response = await managePersonalNotes.addPersonalNotes(userData);
				
				// Show the responses
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
					'addPersonalNotesFormSubmissionError',
					'Error adding personal notes: ',
					err,
					'Unable to add personal notes at this time. Please try again later.',
					'form-msg');
			}
		});
	}
	catch (err) {
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError(
			'addPersonalNotesError',
			'Error adding personal notes: ',
			err,
			'Unable to add personal notes. Please try again later.',
			'form-msg');
	}
}