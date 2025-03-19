import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils.js';
import { addListener } from '../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.js';
import { handleAddHorseFormSubmission, handleHorseNameInput } from './components/handleHorseNameInput.js';
import clientAnchorNav from '../../../../core/navigation/components/setupClientAnchorListener.js';

export default async function addNewHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId }) {
	try {
		// Add the event listener for the client name to navigate back to the client page
		await clientAnchorNav({ manageUser, manageClient, componentId });

		// Set up the debouncer for validation.
		const debouncedValidate = createDebouncedHandler(
			(evt) => {
			handleHorseNameInput({ evt, cID, primaryKey, manageClient, componentId });
		}, getOptimalDelay('validation'));

		const eventHandlers = {
			'input:horse-name': (evt) => {
				if (evt.target.value !== '') {
					safeDisplayMessage({
						elementId: 'form-msg',
						message: 'Processing...',
						isSuccess: true,
						color: 'w3-text-blue',
					});
					document.getElementById('submit-button').disabled = true;
				}
				debouncedValidate(evt);
			},
			'focusin:horse-name': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
			'focusin:trim-cycle': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
			'submit:add-horse-form': async (evt) => {
				evt.preventDefault();
				await handleAddHorseFormSubmission({ evt, cID, primaryKey, manageClient, componentId });
			},
		};

		addListener({
			elementOrId: 'card',
			eventType: ['input', 'focusin', 'submit'],
			handler: (evt) => {
				const eventKey = `${evt.type}:${evt.target.id}`;

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
			userMessage: 'An error occurred while initializing the add new horse page.',
		});
	}
}