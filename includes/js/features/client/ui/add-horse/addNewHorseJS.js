import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils';
import { addListener } from '../../../../core/utils/dom/listeners';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages';
import { handleAddHorseFormSubmission, handleHorseNameInput } from './components/handleHorseNameInput';

export default async function addNewHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId }) {
	try {
		// Add the event listener for the client name to navigate back to the client page
		const { default: clientAnchorNav } = await import("../../../../core/navigation/components/setupClientAnchorListener.js");
		await clientAnchorNav({ manageUser, manageClient, componentId });

		// Set up the debouncer for validation.
		const debouncedValidate = createDebouncedHandler(
			(evt) => {
			handleHorseNameInput({ evt, cID, primaryKey, manageClient, componentId });
		}, getOptimalDelay('validation'));

		// Event listener to validate the horse name. Ensuring no duplicate horse names are added.
		addListener({
			elementOrId: 'horse-name',
			eventType: 'input',
			handler: (evt) => {
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
			componentId,
		});

		// Add the form submission event listener
		addListener({
			elementOrId: 'add-horse-form',
			eventType: 'submit',
			handler: async (evt) => {
				evt.preventDefault();
				await handleAddHorseFormSubmission({ evt, cID, primaryKey, manageClient, componentId });
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