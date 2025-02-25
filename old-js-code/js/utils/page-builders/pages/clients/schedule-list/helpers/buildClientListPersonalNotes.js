import { buildEle } from "../../../../../dom/domUtils.js";
import buildPersonalNotesSection from "./buildPersonalNotesSection.js";

/**
 * Configuration for personal notes UI elements
 * @typedef {Object} NotesConfig
 * @property {Object} notesSection - Container for notes content
 * @property {Object} infoBlock - Icon button configuration
 */
const PAGE_CONFIG = {
	infoBlock: {
		type: 'div',
		attributes: { id: 'personal-notes-icon' },
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
		myClass: ['w3-border-left', 'w3-border-top', 'w3-border-right', 'w3-hide', 'collapsed', 'slide-down'],
	},
};

/**
 * Builds the personal notes section for the client list
 * @param {HTMLElement} container - Container element
 * @returns {Promise<HTMLElement|null>} Notes container or null on error
 */
export default async function buildClientListPersonalNotes() {
	try {
		const fragment = document.createDocumentFragment();

		// Build elements from config
		const elements = buildElementsFromConfig(PAGE_CONFIG);
		
		const notesContent = await buildPersonalNotesSection();
		
		// // Assembly
		if(notesContent) elements.notesBlock.appendChild(notesContent);
		fragment.append(elements.infoBlock, elements.notesBlock);

		return fragment;
	}
	catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError({
			filename: 'buildClientListPersonalNotesError',
			consoleMsg: 'Build client list personal notes error: ',
			err,
			userMsg: 'Unable to get your personal notes at this time. Please try again later.',
			errorEle: 'page-msg',
		});
	}
}

/**
 * Builds DOM elements from configuration
 * @private
 * @param {NotesConfig} config - Element configurations
 * @returns {Object.<string, HTMLElement>} Map of built elements
 */
function buildElementsFromConfig(config) {
	return Object.entries(config).reduce((elements, [key, value]) => {
		elements[key] = buildEle(value);
		return elements;
	}, {});
}