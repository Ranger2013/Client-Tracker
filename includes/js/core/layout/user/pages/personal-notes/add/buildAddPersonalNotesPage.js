import { buildEle } from '../../../../../utils/dom/elements.js';
import { buildPageContainer, buildSubmitButtonSection, buildTwoColumnTextareaSection } from '../../../../../utils/dom/forms/buildUtils.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';

// Set up debug mode
const COMPONENT = 'Build Add Personal Notes Page';
const DEBUG = false;
const debugLog = (...args) => {
	console.log(`[${COMPONENT}]`, ...args);
};

// Set up component ID for event listener clean up
const COMPONENT_ID = 'add-personal-notes';

export default async function buildAddPersonalNotes({ mainContainer, manageClient, manageUser }) {
	try {
		// Clear any page-msg
		clearMsg({ container: 'page-msg' });
		// Build page components and form components concurrently
		const [pageComponents, formComponents] = await Promise.all([
			buildPageComponents(),
			buildFormComponents(),
		]);

		// Render the page
		renderPage({
			mainContainer,
			pageComponents,
			formComponents,
		});

		// Initialize the UI file
		await initializeUIFunction({ componentId: COMPONENT_ID, manageUser });

		// Garbage collection
		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
}

async function buildPageComponents() {
	const [container, card] = await buildPageContainer({
		pageTitle: 'Add Personal Notes',
	});

	return {
		container,
		card,
	};
};

async function buildFormComponents() {
	const form = buildEle({
		type: 'form',
		attributes: {
			id: 'add-personal-notes-form',
		},
	});

	const [
		noteSection,
		submitButtonSection,
	] = await Promise.all([
		buildTwoColumnTextareaSection({
			labelText: 'Notes:',
			textareaID: 'notes',
			textareaName: 'notes',
			textareaTitle: 'Personal Notes',
			// required: true,
			rows: 10,
		}),
		buildSubmitButtonSection('Add Notes'),
	]);

	return {
		form,
		noteSection,
		submitButtonSection,
	};
};

function renderPage({ mainContainer, pageComponents, formComponents }) {
	const { container, card } = pageComponents;
	const { form, noteSection, submitButtonSection } = formComponents;

	form.append(noteSection, submitButtonSection);
	card.append(form);
	container.append(card);

	mainContainer.innerHTML = '';
	mainContainer.append(container);
}

async function initializeUIFunction({ componentId, manageUser }) {
	try {
		const { default: addPersonalNotes } = await import("../../../../../../features/user/ui/personal-notes/add/addPersonalNotesJS.js");
		addPersonalNotes({ componentId, manageUser });
	}
	catch (err) {
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		}, true);
	}
};