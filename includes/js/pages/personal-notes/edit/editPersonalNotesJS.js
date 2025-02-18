import { addListener } from "../../../utils/event-listeners/listeners.js";
import handlePersonalNotesFormSubmission from "./helpers/handlePersonalNotesFormSubmission.js";

export const setNoteListeners = () => {
	const noteTitles = document.querySelectorAll('[id^="notes-title-"]');

	[...noteTitles].map(title => {
		addListener(title, 'click', () => {
			const index = title.id.split('-').pop();

			const form = document.getElementById(`notes-form-${index}`);
			form.classList.toggle('w3-hide');
		});
	});
};

export const setFormListeners = () => {
	const forms = document.querySelectorAll('form[id^="notes-form-"]');
	[...forms].map(form => addListener(form, 'submit', handlePersonalNotesFormSubmission));
};

export default async function editPersonalNotes({ mainContainer }){
	try{
		// Set the event listeners for each note title
		setNoteListeners();

		// Set event listeners for the forms
		setFormListeners();
	}
	catch(err){
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError(
			'editPersonalNotesError',
			'Error editing personal notes: ',
			err,
			'Unable to edit the personal notes. Please try again later.',
			'page-msg',
		);
	}
}

