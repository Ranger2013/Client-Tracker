import ManagePersonalNotes from "../../../../../../classes/ManagePersonalNotes.js";
import { buildEle } from "../../../../../dom/domUtils.js";
import { cleanUserOutput } from "../../../../../string/stringUtils.js";
import buildSubmitDeleteButtonSection from "../../../../helpers/buildSubmitDeleteButtonSection.js";
import buildTwoColumnTextareaSection from "../../../../helpers/buildTwoColumnTextareaSection.js";

const buildNoteElements = (note, index) => ({
	block: buildEle({
		type: 'div',
		myClass: ['w3-padding', 'w3-border-bottom'],
		attributes: { id: `notes-block-${index + 1}` }
	}),
	titleBlock: buildEle({
		type: 'div',
		myClass: ['w3-padding-small', 'w3-pointer', 'w3-light-grey'],
		attributes: { id: `notes-title-${index + 1}` }
	}),
	form: buildEle({
		type: 'form',
		myClass: ['w3-hide'],
		attributes: { id: `notes-form-${index + 1}` }
	}),
	hiddenFields: [
		buildEle({
			type: 'input',
			attributes: { type: 'hidden', name: 'notesID', value: note.notesID }
		}),
		buildEle({
			type: 'input',
			attributes: { type: 'hidden', name: 'date', value: note.date }
		})
	],
	message: buildEle({
		type: 'div',
		myClass: ['w3-center'],
		attributes: { id: `notes-msg-${index + 1}` }
	}),
	spans: [
		buildEle({
			type: 'span',
			myClass: ['w3-bold'],
			text: 'Notes: '
		}),
		buildEle({
			type: 'span',
			text: note.notes.length > 20 ? `${note.notes.substring(0, 20)}...` : note.notes
		})
	]
});

export default async function buildPersonalNotesList() {
	try {
		const notesList = await new ManagePersonalNotes().getPersonalNotes();

		if (!notesList?.length) return noPersonalNotes();

		const fragment = document.createDocumentFragment();

		await Promise.all(notesList.map(async (note, index) => {
			const elements = buildNoteElements(note, index);
			
			const [textarea, submitButton] = await Promise.all([
				buildTwoColumnTextareaSection({
					labelText: 'Notes: ',
					textareaID: `notes-${index + 1}`,
					textareaName: 'notes',
					textareaTitle: 'Personal Notes',
					required: true,
					textareaValue: cleanUserOutput(note.notes)
				}),
				buildSubmitDeleteButtonSection({submitButtonText: 'Edit Notes', deleteButtonText: 'Delete Notes'})
			]);

			elements.titleBlock.append(...elements.spans);
			elements.form.append(
				elements.message,
				...elements.hiddenFields,
				textarea,
				submitButton
			);
			elements.block.append(elements.titleBlock, elements.form);
			fragment.append(elements.block);
		}));

		return fragment;
	}
	 catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError(
			'getPersonalNotesListError',
			'Error getting personal notes list: ',
			err,
			'Unable to get the personal notes list. Please try again later.',
			'page-msg'
		);
	}
}
function noPersonalNotes() {
	const noNotes = buildEle({
		type: 'div',
		myClass: ['w3-padding-small', 'w3-center'],
		text: 'You do not have any notes.'
	});

	return noNotes;
}