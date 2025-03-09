import { sortByDateOnly } from '../../../../../utils/date/dateUtils.js';
import { buildEle, buildElementsFromConfig } from '../../../../../utils/dom/elements.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';

const PAGE_CONFIG = {
	infoBlock: {
		type: 'div',
		attributes: { id: 'personal-notes-icon'},
		myClass: ['w3-pointer', 'w3-hide'],
		text: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			  <circle cx="12" cy="12" r="10"></circle>
			  <line x1="12" y1="18" x2="12" y2="10"></line>
			  <line x1="12" y1="6" x2="12" y2="6"></line>
		 </svg>`,
	},
	notesBlock: {
		type: 'div',
		attributes: { id: 'personal-notes-block'},
		myClass: ['w3-border-left', 'w3-borer-top', 'w3-borer-right', 'w3-hide', 'collapsed', 'slide-down'],
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

export default async function buildPersonalNotesSection({manageUser}) {
	try{
		let userNotes = null;

		const fragment = document.createDocumentFragment();
		const notes = await manageUser.getUserPersonalNotes();

		// Build the page elements from the PAGE_CONFIG object
		const elements = buildElementsFromConfig(PAGE_CONFIG);
		
		// Check if we have any notes to display
		if(notes.length > 0){
			notes.sort((a,b) => sortByDateOnly(a.date, b.date, false));
			userNotes = buildNotesFromConfig(NOTES_CONFIG);
			elements.append(...userNotes);
		}

		fragment.append(elements.infoBlock, elements.notesBlock);
		return fragment;
	}
	catch(err){
		console.log(err);
	}
}

function buildNotesFromConfig( {config, notes }){
	return notes.map(note => {
		const row = buildEle(config.notesRow);
		const colOne = buildEle({
			...config.colOne,
			text: cleanUserOutput(note.date),
		});
		const colTwo = buildEle({
			...config.colTwo,
			text: cleanUserOutput(note.note),
		});
		row.append(colOne, colTwo);
		return row;
	});
}
