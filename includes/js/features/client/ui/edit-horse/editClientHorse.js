import buildSubmitDeleteButtonSection from '../../../../core/layout/components/buildSubmitDeleteButtonSection.js';
import buildTwoColumnInputSection from '../../../../core/layout/components/buildTwoColumnInputSection.js';
import { buildEle, buildElementsFromConfig, disableEnableSubmitButton } from '../../../../core/utils/dom/elements.js';
import { addListener } from '../../../../core/utils/dom/listeners.js';
import { cleanUserOutput } from '../../../../core/utils/string/stringUtils.js';
import clientAnchorNav from '../../../../core/navigation/components/setupClientAnchorListener.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.js';
import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils.js';
import { handleHorseNameInput } from '../add-horse/components/handleHorseNameInput.js';
import handleEditHorseFormSubmission from './components/handleEditHorseFormSubmission.js';

export default async function editClientHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId }) {
	try {
		// Set the client anchor listener
		await clientAnchorNav({ manageClient, manageUser, componentId });

		// Set up the debouncer for validation.
		const debouncedValidate = createDebouncedHandler(
			(evt) => {
				handleHorseNameInput({ evt, cID, primaryKey, manageClient, componentId });
			}, getOptimalDelay('validation'));

		// Event handlers for the edit client horse page
		const eventHandlers = {
			'change:horse-list': async (evt) => {
				await showEditHorseForm({ evt, cID, primaryKey, manageClient, manageUser, componentId });
			},
			'input:horse-name': (evt) => {
				if (evt.target.value !== '') {
					safeDisplayMessage({
						elementId: 'form-msg',
						message: 'Processing...',
						isSuccess: true,
						color: 'w3-text-blue',
					});

					// Disable the submit button
					document.getElementById('submit-button').disabled = true;
				}
				debouncedValidate(evt);
			},
			'focusin:horse-name': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'submit:edit-horse-form': async (evt) => {
				evt.preventDefault();
				const horseContainer = document.getElementById('horse-container'); // Get fresh reference
				await handleEditHorseFormSubmission({ evt, cID, primaryKey, horseContainer, manageClient, componentId });
			},
		};

		// Set up the global event listener for the edit horse page
		addListener({
			elementOrId: 'card',
			eventType: ['focusin', 'change', 'submit', 'input'],
			handler: (evt) => {
				const eventKey = `${evt.type}:${evt.target.id}`;

				// Only execute the handler if we have a mapping for this event+element
				if (eventHandlers[eventKey]) {
					eventHandlers[eventKey](evt);
				}
			},
			componentId,
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}

async function showEditHorseForm({ evt, cID, primaryKey, manageClient, manageUser, componentId }) {
	try {
		// DOM Elements
		const horseContainer = document.getElementById('horse-container');
		const hID = evt.target.value;
		const horseName = evt.target.options[evt.target.selectedIndex].text;

		if(hID === 'null') {
			horseContainer.innerHTML = '';
			return;
		}

		const FORM_CONFIG = {
			form: {
				type: 'form',
				attributes: { id: 'edit-horse-form' },
			},
			hiddenHID: {
				type: 'input',
				attributes: { type: 'hidden', name: 'hID', value: hID },
			},
			hiddenPrimaryKey: {
				type: 'input',
				attributes: { type: 'hidden', name: 'primaryKey', value: primaryKey },
			},
		};

		// Build Elements
		const elements = buildElementsFromConfig(FORM_CONFIG);

		const [horseNameInput, submitDeleteButtons] = await Promise.all([
			buildTwoColumnInputSection({
				labelText: "Horse's Name: ",
				inputID: 'horse-name',
				inputType: 'text',
				inputName: 'horse_name',
				inputValue: cleanUserOutput(horseName),
				inputTitle: "Horse's Name",
				required: true,
			}),
			buildSubmitDeleteButtonSection({
				submitButtonText: 'Edit Horse',
				deleteButtonText: 'Delete Horse',
			}),
		]);

		elements.form.append(elements.hiddenHID, elements.hiddenPrimaryKey, horseNameInput, submitDeleteButtons);
		horseContainer.innerHTML = '';
		horseContainer.appendChild(elements.form);
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'An error occurred while trying to show the edit horse form.',
			displayTarget: 'horse-container',
		});
	}
}