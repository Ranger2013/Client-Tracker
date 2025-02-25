import ManagePersonalNotes from "../../../../../../classes/ManagePersonalNotes.js";
import { sortByDateOnly } from "../../../../../date/dateUtils.js";
import { buildEle } from "../../../../../dom/domUtils.js";
import { cleanUserOutput } from "../../../../../string/stringUtils.js";

/**
 * Configuration for personal notes display elements
 * @typedef {Object} NotesConfig
 * @property {Object} notesRow - Row container configuration
 * @property {Object} colOne - Date column configuration
 * @property {Object} colTwo - Notes content column configuration
 */
const PAGE_CONFIG = {
	notesRow: {
		type: 'div',
		myClass: ['w3-row', 'w3-border-bottom']
	},
	colOne: {
		type: 'div',
		myClass: ['w3-col', 'm3', 'w3-padding-small']
	},
	colTwo: {
		type: 'div',
		myClass: ['w3-col', 'm9', 'w3-padding-small']
	},
};

/**
 * Builds personal notes section with sorted notes
 * @param {void}
 * @returns {Promise<DocumentFragment|null>} Fragment with notes or null if no notes
 * @throws {Error} If notes retrieval or building fails
 */
export default async function buildPersonalNotesSection() {
	try {
		const manageNotes = new ManagePersonalNotes();
		const personalNotes = await manageNotes.getPersonalNotes();
		
		if (!personalNotes?.length) return null;

		// Sort notes by date descending
		personalNotes.sort((a, b) => sortByDateOnly(a.date, b.date, false));
		
		const fragment = document.createDocumentFragment();
		const elements = buildElementsFromConfig({ 
			pageConfig: PAGE_CONFIG, 
			notes: personalNotes 
		});
		fragment.append(...elements);

		return fragment;
	}
	catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError({
			filename: 'buildPersonalNotesSectionError',
			consoleMsg: 'Build personal notes section error: ',
			err,
			userMsg: 'Unable to get your personal notes at this time. Please try again later.',
			errorEle: 'page-msg',
		});
		return null;
	}
}

/**
 * Creates row elements for each note with date and content columns
 * @private
 * @param {Object} params - Function parameters
 * @param {NotesConfig} params.pageConfig - Element configuration object
 * @param {Object} params.pageConfig.notesRow - Row element configuration
 * @param {Object} params.pageConfig.colOne - Date column configuration
 * @param {Object} params.pageConfig.colTwo - Content column configuration
 * @param {Array<Object>} params.notes - Array of note objects
 * @param {string} params.notes[].date - Note's date
 * @param {string} params.notes[].notes - Note's content
 * @returns {Array<HTMLElement>} Array of row elements containing note data
 */function buildElementsFromConfig({ pageConfig, notes }) {
	return notes.map(note => {
		 const row = buildEle(pageConfig.notesRow);
		 
		 const colOne = buildEle({
			  ...pageConfig.colOne,
			  text: cleanUserOutput(note.date)
		 });
		 
		 const colTwo = buildEle({
			  ...pageConfig.colTwo,
			  text: cleanUserOutput(note.notes)
		 });

		 row.append(colOne, colTwo);
		 return row;
	});
}