import { disableEnableSubmitButton, updateSelectOptions } from '../../../../../core/utils/dom/elements.js';
import { trimCycleRange } from '../../../../../core/utils/dom/forms/trimCycleConfigurations.js';
import { safeDisplayMessage } from '../../../../../core/utils/dom/messages.js';

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

		const errors = await validateEditHorseForm(userData);

		if (errors.length > 0) {
			const { default: displayFormErrors } = await import("../../../../../core/utils/dom/forms/displayFormValidationErrors.js");
			displayFormErrors(errors, { formMessage: 'Please fix the following errors', scrollToTope: true });
			disableEnableSubmitButton('submit-button');
			return;
		}

		const editHorse = await manageClient.editClientHorse({ cID, userData });

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
				datasetMapper: horse => ({
					'data-service-type': horse.service_type,
					'data-trim-cycle': horse.trim_cycle,
					'data-horse-type': horse.horse_type,
				})
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

async function deleteClientHorse({ evt, manageClient, cID, primaryKey, clientName, horseContainer, componentId }) {
	try {
		const shouldSubmit = confirm('Are you sure you want to delete this horse?');

		if (!shouldSubmit) {
			return;
		}
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientName = clientInfo.client_name;

		// Get the form data
		const userData = Object.fromEntries(new FormData(evt.target));
		const deleteHorse = await manageClient.deleteClientHorse({ hID: userData.hID, cID: cID, client_name: clientName });

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
			datasetMapper: horse => ({
				'data-service-type': horse.type_service,
				'data-trim-cycle': horse.trim_cycle,
				'data-horse-type': horse.horse_type,
			}),
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

async function validateEditHorseForm(userData) {
	try {
		const errors = [];

		// Validation rules
		const validations = [
			{
				field: 'horse_name',
				isValid: value => value !== '',
				message: 'Horse name cannot be empty.'
			},
			{
				field: 'horse_type',
				isValid: value => value !== 'null',
				message: 'Please select a horse type.'
			},
			{
				field: 'trim_cycle',
				isValid: value => trimCycleRange.includes(parseInt(value, 10)),
				message: 'Please select a trim cycle.'
			}
		];

		// Apply each validation rule
		validations.forEach(validation => {
			if (!validation.isValid(userData[validation.field])) {
				errors.push({
					input: validation.field,
					msg: validation.message
				});
			}
		});

		return errors;
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
		}, true);
	}
}