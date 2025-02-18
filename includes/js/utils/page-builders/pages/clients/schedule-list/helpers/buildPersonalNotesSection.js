import ManagePersonalNotes from "../../../../../../classes/ManagePersonalNotes.js";
import { sortByDateOnly } from "../../../../../date/dateUtils.js";
import { buildEle } from "../../../../../dom/domUtils.js";
import { cleanUserOutput } from "../../../../../string/stringUtils.js";

/**
 * Builds the personal notes section.
 * @returns {Promise<DocumentFragment|null>} The document fragment containing personal notes or null if no notes are found.
 */
export default async function buildPersonalNotesSection() {
	try {
		 // Get the ManagePersonalNotes class
		 const manageNotes = new ManagePersonalNotes();

		 // Fetch the personal notes
		 const personalNotes = await manageNotes.getPersonalNotes();

		 // Sort the personal notes by date in descending order
		 personalNotes.sort((a, b) => sortByDateOnly(a.date, b.date, false));

		 // Create a document fragment to hold the notes
		 const fragment = document.createDocumentFragment();

		 // Check if there are any personal notes
		 if (personalNotes && personalNotes.length > 0) {
			  // Loop through each note and create the necessary HTML elements
			  personalNotes.forEach(notes => {
					const notesRow = buildEle({
						 type: 'div',
						 myClass: ['w3-row', 'w3-border-bottom']
					});

					const colOne = buildEle({
						 type: 'div',
						 myClass: ['w3-col', 'm3', 'w3-padding-small'],
						 text: cleanUserOutput(notes.date),
					});

					const colTwo = buildEle({
						 type: 'div',
						 myClass: ['w3-col', 'm9', 'w3-padding-small'],
						 text: cleanUserOutput(notes.notes),
					});

					notesRow.appendChild(colOne);
					notesRow.appendChild(colTwo);
					fragment.appendChild(notesRow);
			  });

			  return fragment;
		 } else {
			  return null;
		 }
	} catch (err) {
		 // Log the error using the errorLogs utility
		 const { default: errorLogs } = await import("../../../../../../utils/error-messages/errorLogs.js");
		 await errorLogs('buildPersonalNotesSectionError', 'Build personal notes section error: ', err);
		 throw err;
	}
}