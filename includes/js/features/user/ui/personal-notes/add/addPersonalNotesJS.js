import setupBackupNotice from '../../../../../core/services/backup-notice/backupNotice.js';
import { disableEnableSubmitButton } from '../../../../../core/utils/dom/elements.js';
import displayFormValidationErrors from '../../../../../core/utils/dom/forms/displayFormValidationErrors.js';
import { addListener } from '../../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../../core/utils/dom/messages.js';

// Set up debug logging
const COMPONENT = 'Add Personal Notes';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function addPersonalNotes({ componentId, manageUser }) {
	try {
		// Set up the static event handlers
		const staticEventHandlers = {
			'focusin:note': (evt) => {
				debugLog('evt.target: ', evt.target);

				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target.id });
				disableEnableSubmitButton('submit-button');
			},
			'submit:add-personal-notes-form': async (evt) => {
				evt.preventDefault();
				await handleAddNotesFormSubmission({ evt, manageUser });
			},
		};

		// Set up the event listener
		addListener({
			elementOrId: 'add-personal-notes-form',
			eventType: ['focusin', 'submit'],
			handler: (evt) => {
				const keyPath = `${evt.type}:${evt.target.id}`;

				if (staticEventHandlers[keyPath]) {
					staticEventHandlers[keyPath](evt);
				}
			},
			componentId,
		})
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}
}

async function handleAddNotesFormSubmission({ evt, manageUser }) {
	try {
		const userData = Object.fromEntries(new FormData(evt.target));

		// Set up validation
		const errors = await validateAddPersonalNotesForm(userData);

		if (errors?.length) {
			await displayFormValidationErrors(errors);
			disableEnableSubmitButton('submit-button');
			return;
		}

		const response = await handleFormSubmission(userData);

		if (response) {
			displaySuccessMessageAndResetForm({ evt, manageUser });
		}
	}
	catch (err) {
		console.log('handleAddNotesFormSubmission: ', err);
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			message: AppError.BaseMessages.forms.submissionFailed,
		});
	}
}

async function validateAddPersonalNotesForm(userData) {
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

async function handleFormSubmission(userData) {
	try {
		const { default: ManagePersonalNotes } = await import("../../../models/ManagePersonalNotes.js");
		const manageNotes = new ManagePersonalNotes({ debug: false });

		return await manageNotes.addPersonalNotes(userData);
	}
	catch (err) {
		console.warn('HandleFormSubmission: ', err);
		throw err;
	}
}

async function displaySuccessMessageAndResetForm({ evt, manageUser }) {
	try {
		safeDisplayMessage({
			elementId: 'form-msg',
			message: 'Personal notes added successfully.',
			isSuccess: true,
		});

		evt.target.reset();

		setupBackupNotice({ errorEleID: 'backup-data-notice', manageUser })
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.MESSAGE_DISPLAY_ERROR,
			message: AppError.BaseMessages.forms.messageDisplayFailed,
		});
	}
}