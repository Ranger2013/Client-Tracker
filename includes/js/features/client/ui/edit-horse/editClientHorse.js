import { buildEle, buildElementsFromConfig, disableEnableSubmitButton } from '../../../../core/utils/dom/elements.min.js';
import { addListener } from '../../../../core/utils/dom/listeners.min.js';
import { cleanUserOutput } from '../../../../core/utils/string/stringUtils.min.js';
import clientAnchorNav from '../../../../core/navigation/components/setupClientAnchorListener.min.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.min.js';
import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils.min.js';
import { handleHorseNameInput } from '../add-horse/components/handleHorseNameInput.min.js';
import handleEditHorseFormSubmission from './components/handleEditHorseFormSubmission.min.js';
import { trimCycleConfigurations } from '../../../../core/utils/dom/forms/trimCycleConfigurations.min.js';
import { buildSubmitDeleteButtonSection, buildTwoColumnInputSection, buildTwoColumnRadioButtonSection, buildTwoColumnSelectElementSection } from '../../../../core/utils/dom/forms/buildUtils.min.js';

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
		const selectedIndex = evt.target.options[evt.target.selectedIndex];
		const hID = evt.target.value;
		const horseName = selectedIndex.text;
		const horseServiceType = selectedIndex.dataset.serviceType;
		const horseTrimCycle = selectedIndex.dataset.trimCycle;

		console.log('hID: ', hID);
		console.log('horseName: ', horseName);
		console.log('horseServiceType: ', horseServiceType);
		console.log('horseTrimCycle: ', horseTrimCycle);

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

		const [
			horseNameInput, 
			radioButton,
			trimCycle,
			submitDeleteButtons,
		] = await Promise.all([
			buildTwoColumnInputSection({
				labelText: "Horse's Name: ",
				inputID: 'horse-name',
				inputType: 'text',
				inputName: 'horse_name',
				inputValue: cleanUserOutput(horseName),
				inputTitle: "Horse's Name",
				required: true,
			}),
			buildTwoColumnRadioButtonSection({
				labelText: 'Service Type: ',
				buttons: [
					{ name: 'service_type', value: 'trim', labelText: 'Trim: ', checked: horseServiceType === 'trim' ? true : undefined },
					{ name: 'service_type', value: 'half_set', labelText: 'Half Set Shoes: ', checked: horseServiceType === 'half_set' ? true : undefined },
					{ name: 'service_type', value: 'full_set', labelText: 'Full Set Shoes: ', checked: horseServiceType === 'full_set' ? true : undefined },
				],
			}),
			buildTwoColumnSelectElementSection({
				labelText: 'Trim Cycle: ',
				selectID: 'trim-cycle',
				selectName: 'trim_cycle',
				selectTitle: 'Trim Cycle',
				required: true,
				options: trimCycleConfigurations({trim_cycle: horseTrimCycle}),
			}),
			buildSubmitDeleteButtonSection({
				submitButtonText: 'Edit Horse',
				deleteButtonText: 'Delete Horse',
			}),
		]);

		elements.form.append(elements.hiddenHID, elements.hiddenPrimaryKey, horseNameInput, radioButton, trimCycle, submitDeleteButtons);
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