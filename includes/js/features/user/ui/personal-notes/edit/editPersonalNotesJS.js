import { getValidElement } from '../../../../../core/utils/dom/elements.js';
import displayFormValidationErrors from '../../../../../core/utils/dom/forms/displayFormValidationErrors.js';
import { addListener } from '../../../../../core/utils/dom/listeners.js';
import { safeDisplayMessage } from '../../../../../core/utils/dom/messages.js';

// Set up debug mode
const COMPONENT = 'Edit personal notes page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function editPersonalNotes({ mainContainer, manageClient, manageUser, componentId }) {
	try {
		// Initialize Event handlers
		initializeEventHandlers({ componentId, manageUser });
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}
}

/**
 * @typedef {Object} HandlerConfig
 * @property {(evt: Event, index: string) => Promise<void>|void} handler - Event handler function
 */

/**
 * Event handlers for different element types
 * @type {Record<string, HandlerConfig>}
 */
const handlers = {
	'notes-title-': {
		handler: (evt, index) => {
			const element = evt.target.closest('[id^="notes-title-"]');
			debugLog('Event Handler: element: ', element);
			closeAllTitleBlocks(element);
		}
	},
	'notes-form-': {
		handler: async (evt, index) => {
			evt.preventDefault();
			await handleNotesFormSubmission({ evt, index });
		}
	}
};

function initializeEventHandlers({ componentId, manageUser }) {
	debugLog('Initializing event handlers');

	// Single event listener for all dynamic elements
	addListener({
		elementOrId: 'card',
		eventType: ['submit', 'focusin', 'click'],
		handler: (evt) => handleDynamicEvent(evt),
		componentId
	});
}

/**
 * Handles all dynamic events by finding the closest matching element
 * @param {Event} evt - The event object
 * @param {Object} manageUser - User management instance
 */
function handleDynamicEvent(evt) {
	for (const [prefix, config] of Object.entries(handlers)) {
		// Always use closest to find the target, even for direct matches
		const matchingElement = evt.target.closest(`[id^="${prefix}"]`);

		if (matchingElement) {
			// Only handle submit events for forms and click events for others
			if ((prefix.includes('form') && evt.type !== 'submit') ||
				(!prefix.includes('form') && evt.type !== 'click')) {
				continue;
			}

			const index = matchingElement.id.split('-').pop();
			config.handler(evt, index);
			break;
		}
	}
}

function closeAllTitleBlocks(clickedTitleElement) {
	// Extract the index from the clicked title (like "notes-title-2" → "2")
	const clickedIndex = clickedTitleElement.id.split('-').pop();
	debugLog('clickedIndex: ', clickedIndex);
	// The form we want to toggle
	const targetFormId = `notes-form-${clickedIndex}`;
	debugLog('targetFormId: ', targetFormId);
	// Get all form elements
	const allForms = document.querySelectorAll('form[id^="notes-form-"]');
	debugLog('allForms: ', allForms);
	// First hide all forms
	allForms.forEach(form => {
		// Hide all forms except our target (which we'll handle separately)
		if (form.id !== targetFormId) {
			form.classList.add('w3-hide');
		}
	});

	// Now toggle just our target form
	const targetForm = document.getElementById(targetFormId);
	debugLog('targetForm: ', targetForm);
	if (targetForm) {
		debugLog('Toggling target form: ', targetForm);
		targetForm.classList.toggle('w3-hide');
	}
}

async function handleNotesFormSubmission({ evt, index }) {
	try {
		const { default: ManagePersonalNotes } = await import("../../../models/ManagePersonalNotes.js");
		const manageNotes = new ManagePersonalNotes();

		const submitter = evt.submitter;
		debugLog('submitter: ', submitter);

		if (submitter.name === 'delete') {
			const deleted = await handleNotesDeletion({ evt, index, manageNotes });
			if (deleted) {
				removeNotesBlockAndDisplayMessage(index);
			}
			return;
		}

		const submitted = await handleFormSubmission({ evt, index, manageNotes });

		if (submitted) {
			safeDisplayMessage({
				elementId: `notes-msg-${index}`,
				message: 'Notes updated successfully.',
				isSuccess: true,
			});
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			message: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: `notes-msg-${index}`,
		});
		debugLog('Form submission error: ', err);
	}
}

async function handleNotesDeletion({ evt, index, manageNotes }) {
	try {
		if (!confirm('Are you sure you want to delete this note?')) {
			return;
		}

		const userData = Object.fromEntries(new FormData(evt.target));
		debugLog('userData: ', userData);

		await manageNotes.deletePersonalNotes(userData.notesID);
		return true;
	}
	catch (err) {
		throw err;
	}
}

async function handleFormSubmission({ evt, index, manageNotes }) {
	const userData = Object.fromEntries(new FormData(evt.target));

	const errors = await validateNotesForm(userData);

	if (errors?.length) {
		await displayFormValidationErrors(errors);
		return false;
	}

	return await manageNotes.editPersonalNotes(userData);
}

function removeNotesBlockAndDisplayMessage(index) {
	const notesBlock = getValidElement(`notes-block-${index}`);
	if (notesBlock) {
		notesBlock.remove();
	}

	safeDisplayMessage({
		elementId: 'form-msg',
		message: 'Notes deleted successfully.',
		isSuccess: true,
	});
}

async function validateNotesForm(userData) {
	try {
		const VALIDATION_MAPPING = {
			notes: {
				isValid: () => userData.notes.trim().length > 0,
				message: 'Please enter a note.',
			}
		};

		return Object.entries(VALIDATION_MAPPING)
			.filter(([key, config]) => !config.isValid())
			.map(([key, config]) => ({ input: key, msg: config.message }));
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			message: AppError.BaseMessages.forms.validationFailed,
		});
	}
}