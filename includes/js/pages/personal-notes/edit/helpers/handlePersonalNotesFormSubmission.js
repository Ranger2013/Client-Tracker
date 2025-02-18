import ManagePersonalNotes from "../../../../classes/ManagePersonalNotes.js";
import { mySuccess } from "../../../../utils/dom/domUtils.js";
import { setFormListeners, setNoteListeners } from "../editPersonalNotesJS.js";

export default async function handlePersonalNotesFormSubmission(evt) {
	evt.preventDefault();

	try {
		// Get the manage personal notes class
		const manageNotes = new ManagePersonalNotes();
		const response = await manageNotes.handleEditingPersonalnotes(evt);
		const index = evt.target.id.split('-').pop();

		// If we have an error show it and return early
		if (!response.status) {
			myError(`notes-msg-${index}`, response.msg);
			return;
		}

		switch (response.type) {
			case 'edit': {
				mySuccess('form-msg', response.msg);
				const notesContainer = document.getElementById('notes-container');
				notesContainer.innerHTML = '';

				// Rebuild the notes page
				const { default: buildPersonalNotesListBlock } = await import("../../../../utils/page-builders/pages/personal-notes/edit-notes/helpers/buildPersonalNotesListBlock.js");
				notesContainer.append(await buildPersonalNotesListBlock());

				// Set event listeners for newly created elements
				setNoteListeners();
				setFormListeners();
				return;
			}
			case 'delete': {
				mySuccess('form-msg', response.msg);
				// Remove the note block
				document.getElementById(`notes-block-${index}`).remove();
				return;
			}
			default: {
				myError(`notes-msg-${index}`, `Unknown response type.<br>${helpDeskTicket}`);
				return;
			}

		}
	}
	catch (err) {
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError(
			'editPersonalNotesFormSubmissionError',
			'Error submitting the personal notes form: ',
			err,
			'Unable to submit the personal notes form. Please try again later.',
			'form-msg',
		);
	}
}