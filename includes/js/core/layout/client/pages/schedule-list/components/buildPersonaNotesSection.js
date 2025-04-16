import { sortByDateOnly } from '../../../../../utils/date/dateUtils.js';
import { buildEle, buildElementsFromConfig } from '../../../../../utils/dom/elements.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';

// Set up debug mode
const COMPONENT = 'Build Personal Notes Section';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const PAGE_CONFIG = {
	infoBlock: {
		type: 'span',
		attributes: { style: 'display: inline-block; line-height: 0; vertical-align: top;' },
		myClass: ['w3-pointer', 'w3-hide'],
		text: `<svg id="info-icon" class="w3-pointer" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			  <circle cx="12" cy="12" r="10"></circle>
			  <line x1="12" y1="18" x2="12" y2="10"></line>
			  <line x1="12" y1="6" x2="12" y2="6"></line>
		 </svg>`,
	},
	notesBlock: {
		type: 'div',
		attributes: { id: 'personal-notes-block' },
		myClass: ['w3-border-left', 'w3-border-top', 'w3-border-right', 'w3-hide', 'collapsed', 'slide-down','w3-margin-top-small'],
	},
};

const NOTES_CONFIG = {
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

export default async function buildPersonalNotesSection({ manageUser }) {
	const fragment = document.createDocumentFragment();
	try {
		// Clear any page-msg
		clearMsg({ container: 'page-msg' });
		
		let userNotes = null;
		const notes = await manageUser.getUserPersonalNotes();
		debugLog('User Notes:', notes);

		// Build the page elements from the PAGE_CONFIG object
		const elements = buildElementsFromConfig(PAGE_CONFIG);
		const { infoBlock, notesBlock } = elements;

		// Check if we have any notes to display
		if (notes.length > 0) {
			// Show the notes icon and block
			infoBlock.classList.remove('w3-hide');

			notes.sort((a, b) => sortByDateOnly(a.date, b.date, false));
			debugLog('Sorted Notes:', notes);
			const userNotes = buildNotesFromConfig({ config: NOTES_CONFIG, notes });
			notesBlock.append(...userNotes);
		}

		fragment.append(infoBlock, notesBlock);
		return fragment;
	}
	catch (err) {
		// Log the error
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		});

		// Display an error message to the user
		const error = buildEle({
			type: 'div',
			myClass: ['w3-center', 'w3-text-red'],
			text: 'Error loading personal notes',
		});

		fragment.append(error);
		return fragment;
	}
}

function buildNotesFromConfig({ config, notes }) {
	return notes.map(note => {
		const row = buildEle(config.notesRow);
		const colOne = buildEle({
			...config.colOne,
			text: cleanUserOutput(note.date),
		});
		const colTwo = buildEle({
			...config.colTwo,
			text: cleanUserOutput(note.notes),
		});
		debugLog('Row:', row);
		debugLog('Col One:', colOne);
		debugLog('Col Two:', colTwo);
		row.append(colOne, colTwo);
		return row;
	});
}
