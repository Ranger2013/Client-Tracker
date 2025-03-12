import { disableEnableSubmitButton, updateSelectOptions } from '../../../../../core/utils/dom/elements';
import { safeDisplayMessage } from '../../../../../core/utils/dom/messages';

export default async function handleEditHorseFormSubmission({ evt, cID, primaryKey, horseContainer, manageClient, componentId }) {
	try {
		// Which button submitted the form
		const buttonSubmitter = evt.submitter;

		if (buttonSubmitter.name === 'delete') {
			// Handle the horse deletion
			await deleteClientHorse({ evt, manageClient, cID, primaryKey, horseContainer, componentId });
			return;
		}

		// Get the form data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Make sure that the horse-name is not empty
		if (userData.horse_name === '') {
			safeDisplayMessage({
				elementId: `${evt.target.elements['horse_name'].id}-error`,
				message: 'Horse name cannot be empty.',
				targetId: evt.target.elements['horse_name'].id,
			});

			disableEnableSubmitButton('submit-button');
			return;
		}

		const editHorse = await manageClient.editClientHorse({ hID: userData.hID, cID: cID, horseName: userData.horse_name });

		if (editHorse) {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: `${userData.horse_name} has been successfully updated.`,
				isSuccess: true,
			});

			// Need to reset the horse-list select element by removing all the options, and repopulating it from the client's horses.
			const clientHorses = await manageClient.getClientHorses({ primaryKey });
			const selectHorse = document.getElementById('horse-list');

			// Update the select option with the new horse list
			updateSelectOptions('horse-list', clientHorses, {
				valueMapper: horse => horse.hID,
				textMapper: horse => horse.horse_name,
			});

			// Clear the horse container
			horseContainer.innerHTML = '';
			return;
		}

		// In case we have an edge case failure, show the user a message
		safeDisplayMessage({
			elementId: 'form-msg',
			message: 'An error occurred while updating the horse. Please try again.',
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});
	}
}

async function deleteClientHorse({ evt, manageClient, cID, primaryKey, horseContainer, componentId }) {
	try {
		const shouldSubmit = confirm('Are you sure you want to delete this horse?');

		if (!shouldSubmit) {
			return;
		}

		// Get the form data
		const userData = Object.fromEntries(new FormData(evt.target));
		const deleteHorse = await manageClient.deleteClientHorse({ hID: userData.hID, cID: cID });

		if (!deleteHorse) {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: `An error occurred while trying to delete ${userData.horse_name}. Please try again.`,
			});
			return;
		}

		// Need to reset the horse-list select element by removing all the options, and repopulating it from the client's horses.
		const clientHorses = await manageClient.getClientHorses({ primaryKey });
		updateSelectOptions('horse-list', clientHorses, {
			valueMapper: horse => horse.hID,
			textMapper: horse => horse.horse_name,
		});

		// Clear the horse container
		horseContainer.innerHTML = '';
		safeDisplayMessage({
			elementId: 'form-msg',
			message: `${userData.horse_name} has been successfully deleted.`,
			isSuccess: true,
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		}, true);
	}
}