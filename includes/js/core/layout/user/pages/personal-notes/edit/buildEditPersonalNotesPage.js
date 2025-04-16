import { buildElementsFromConfig } from '../../../../../utils/dom/elements.js';
import { buildPageContainer, buildSubmitDeleteButtonSection, buildTwoColumnTextareaSection } from '../../../../../utils/dom/forms/buildUtils.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';

// Set up debug  mode
const COMPONENT = 'Build edit personal notes page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Garbage clean up for events
const COMPONENT_ID = 'edit-personal-notes-page';

export default async function buildPersonalNotesPage({ mainContainer, manageClient, manageUser }) {
	try {
		// Clear any messages
		clearMsg({ container: 'page-msg' });

		// build the main page components
		const pageComponents = await buildPageContainer({
			pageTitle: 'Edit Personal Notes',
		});

		// Get the notes data
		const notesData = await manageUser.getUserPersonalNotes();
		debugLog('Notes data:', notesData);

		if (!notesData?.length) {
			debugLog('No notes data found');
			// User has no notes
			const noNotes = buildNoNotes();
			renderPage({ mainContainer, pageComponents, noNotes });
			debugLog('before ui initialization.');
			await initializeUIPage({ mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

			return garbageCollector();
		}

		const notesComponents = await buildNotesComponents(notesData);

		renderPage({ mainContainer, pageComponents, notes: notesComponents})

		await initializeUIPage({ mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		// Garbage clean up
		return garbageCollector();

	}
	catch (err) {
		throw err;
	}
}

function buildNoNotes() {
	const PAGE_MAPPING = {
		notesContainer: {
			type: 'div',
			myClass: ['w3-center', 'w3-text-red'],
			text: 'No personal notes found',
		}
	};

	const pageComponents = buildElementsFromConfig(PAGE_MAPPING);
	return pageComponents.notesContainer;
}

async function buildNotesComponents(notesData) {
	const fragment = document.createDocumentFragment();

	let i = 1; // Iterator for notes
	for(const userNotes of notesData) {
		const NOTES_MAPPING = {
			notesBlock: {
				type: 'div',
				attributes: { id: `notes-block-${i}`},
				myClass: ['w3-padding', 'w3-border-bottom'],
			},
			notesTitle: {
				type: 'div',
				attributes: { id: `notes-title-${i}`},
				myClass: ['w3-padding-small', 'w3-pointer', 'w3-light-grey'],
			},
			notesBold: {
				type: 'span',
				myClass: ['w3-bold'],
				text: 'Notes: ',
			},
			partialNotes: {
				type: 'span',
				myClass: ['w3-small'],
				text: truncateText(userNotes.notes),
			},
			notesForm: {
				type: 'form',
				attributes: { id: `notes-form-${i}`},
				myClass: ['w3-hide'],
			},
			notesMsg: {
				type: 'div',
				attributes: { id: `notes-msg-${i}`},
				myClass: ['w3-center'],
			},
			hiddenNotesID: {
				type: 'input',
				attributes: {
					type: 'hidden',
					name: 'notesID',
					value: userNotes.notesID,
				},
			},
			hiddenNotesDate: {
				type: 'input',
				attributes: {
					type: 'hidden',
					name: 'date',
					value: userNotes.date,
				}
			},
		};

		const notesFormComponents = await buildTwoColumnTextareaSection({
			labelText: 'Notes: ',
			textareaID: `notes-${i}`,
			textareaName: 'notes',
			textareaTitle: 'Personal Notes',
			required: true,
			textareaValue: userNotes.notes,
			rows: 10,
		});

		const buttons = await buildSubmitDeleteButtonSection({
			submitButtonText: 'Edit Notes',
			submitButtonIterator: i,
			deleteButtonText: 'Delete Notes',
			deleteButtonIterator: i,
		});

		const pageComponents = buildElementsFromConfig(NOTES_MAPPING);

		// Put the components together
		pageComponents.notesTitle.append(pageComponents.notesBold, pageComponents.partialNotes);
		pageComponents.notesForm.append(
			pageComponents.notesMsg,
			pageComponents.hiddenNotesID,
			pageComponents.hiddenNotesDate,
			notesFormComponents,
			buttons,
		);
		pageComponents.notesBlock.append(pageComponents.notesTitle, pageComponents.notesForm);
		fragment.appendChild(pageComponents.notesBlock);
		i++;
	};

	return fragment;
}

function renderPage({ mainContainer, pageComponents, notes, noNotes }) {
	const [container, card] = pageComponents;

	// Clear the main container
	mainContainer.innerHTML = '';

	if (noNotes && noNotes instanceof HTMLElement) {
		card.appendChild(noNotes);
		container.appendChild(card);
		mainContainer.appendChild(container);
		return;
	}

	card.appendChild(notes);
	container.appendChild(card);
	mainContainer.appendChild(container);
}

async function initializeUIPage({ mainContainer, manageClient, manageUser, componentId }) {
	try {
		debugLog('Initializing UI page');
		
		const { default: editPersonalNotes } = await import("../../../../../../features/user/ui/personal-notes/edit/editPersonalNotesJS.js");
		editPersonalNotes({ mainContainer, manageClient, manageUser, componentId });
	}
	catch(err){
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'Error initializing functionality for personal notes',
		});
	}
}

function garbageCollector() {
	return () => removeListeners(COMPONENT_ID);
}

function truncateText(text, maxLength = 30){
	// Replace all new lines and carriage returns with spaces
	const flattenedText = text.replace(/[\r\n]+/g, ' ');

	// Clean the title
	const cleanText = cleanUserOutput(flattenedText);

	// Truncate the string if needed.
	return cleanText.length > maxLength ? 
	`${cleanText.substring(0, maxLength)}...` : cleanText;
}