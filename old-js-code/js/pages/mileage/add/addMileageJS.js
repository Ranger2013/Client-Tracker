import { clearMsg, myError, mySuccess } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";

const COMPONENT_ID = 'add-mileage';

const BUTTON_HANDLERS = {
	'client-list-button': async (container) => {
		const { default: buildClientListSelect } = await import('./helpers/buildClientListSelect.js');
		await buildClientListSelect(container);
	},
	'destination-button': async (container) => {
		const { default: buildDestinationInput } = await import('./helpers/buildDestinationInput.js');
		await buildDestinationInput(container);
	}
};

export default async function addMileage() {
	try {
		const destinationContainer = document.getElementById('destination-container');
		const mileageForm = document.getElementById('mileage-form');

		// Handle button clicks (delegation)
		addListener(mileageForm, 'click', async (evt) => {
			evt.preventDefault();

			const button = evt.target.closest('button');
			if (!button) return;


			try {
				const handler = BUTTON_HANDLERS[button.id];
				if (handler) {
					await handler(destinationContainer);
				}
			} catch (err) {
				const { handleError } = await import("../../../utils/error-messages/handleError.js");
				await handleError(
					'addMileageButtonError',
					'Error handling button click:',
					err,
					'Unable to process button click.',
					'form-msg'
				);
			}
		}, COMPONENT_ID);

		// Handle form submission separately
		addListener(mileageForm, 'submit', async (evt) => {
			evt.preventDefault();

			try {
				mySuccess('form-msg', 'Processing...', 'w3-text-blue');

				const { default: handleMileageFormSubmission } = await import('./helpers/handleMileageFormSubmission.js');
				const response = await handleMileageFormSubmission(evt);

				if (response.status === 'success') {
					destinationContainer.innerHTML = '';
					evt.target.reset();
					mySuccess('form-msg', response.msg);
				} else {
					myError('form-msg', response.status === 'validation-error'
						? response.msg
						: 'There was an error adding the mileage.'
					);
				}
			} catch (err) {
				const { handleError } = await import("../../../utils/error-messages/handleError.js");
				await handleError(
					'addMileageSubmitError',
					'Form submission error:',
					err,
					'Unable to process form submission.',
					'form-msg'
				);
			}
		}, COMPONENT_ID);

		return () => removeListeners(COMPONENT_ID);
	} catch (err) {
		const { handleError } = await import("../../../utils/error-messages/handleError.js");
		await handleError(
			'addMileageInitError',
			'Initialization error:',
			err,
			'Unable to initialize mileage form.',
			'form-msg'
		);
	}
}