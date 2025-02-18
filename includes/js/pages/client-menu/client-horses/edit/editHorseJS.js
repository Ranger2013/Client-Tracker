
import ManageClient from "../../../../classes/ManageClient.js";
import { clearMsg, disableEnableSubmitButton, myError, mySuccess } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import { ucwords } from "../../../../utils/string/stringUtils.js";

/**
 * Handles the editing of a horse.
 * 
 * @param {string} cID - The client ID.
 * @param {string} primaryKey - The primary key of the client.
 * @param {HTMLElement} mainContainer - The main container element where the page is built.
 * @param {Array} clientHorses - The list of the client's horses.
 */
export default async function editHorse({cID, mainContainer, clientHorses}) {
	try {
		// Add the event listener to prevent duplicate names
		addListener('horse-name', 'input', (evt) => {
			const inputName = evt.target.value.toLowerCase().trim();
			const hID = document.querySelector('input[name="hID"]').value;

			// Make the names capitalized
			evt.target.value = ucwords(evt.target.value);

			// Check for empty input
			if (inputName === '') {
				myError(`${evt.target.id}-error`, "Horse's name is required.", evt.target.id);
				disableEnableSubmitButton('submit-button', false);
				disableEnableSubmitButton('delete-button', false);
				return;
			}

			// Check for duplicate names
			const duplicate = clientHorses.some(horse => horse.hID !== hID && horse.horse_name.toLowerCase().trim() === inputName);

			if (duplicate) {
				myError(`${evt.target.id}-error`, `${evt.target.value} is already listed.`, evt.target.id);
				disableEnableSubmitButton('submit-button', false);
				disableEnableSubmitButton('delete-button', false);
			} else {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button', true);
				disableEnableSubmitButton('delete-button', true);
			}

			// Set the event listener to remove error when focused on the input element
			addListener(evt.target, 'focus', (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }));
		});

		// Add the event listener to handle the form submission
		addListener('edit-horse-form', 'submit', async (evt) => {
			evt.preventDefault();
			// Handle form submission logic here
			const response = await handleEditHorseFormSubmission(evt, cID);
			
			if(response.status === true){
				mySuccess('form-msg', response.msg);
				if (response.horse_name) {
					updateHorseSelectOption(response.hID, response.horse_name);
				} else {
					removeHorseSelectOption(response.hID);
				}
				mainContainer.innerHTML = '';
				return;
			}
			else if(response.status === false){
				myError('form-msg', response.msg);
				return;
			}
		});
	}
	catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('editHorseError', 'Edit horse error: ', err);
	}
}

/**
 * Handles the form submission for editing or deleting a horse.
 * 
 * @param {Event} evt - The event object.
 * @param {string} cID - The client ID.
 * @returns {Promise<Object>} - A promise that resolves to the response object.
 */
async function handleEditHorseFormSubmission(evt, cID) {
	try{
		const manageClient = new ManageClient();
		const submitterButton = evt.submitter.name;

		// Get the form elements
		const userData = Object.fromEntries(new FormData(evt.target));
		const hID = userData.hID;
		const horseName = userData.horse_name;

		if(submitterButton === 'submit'){
			const response = await manageClient.editClientHorse(hID, cID, horseName);
			return { ...response, hID, horse_name: horseName };
		}
		else if(submitterButton === 'delete'){
			const confirmDelete = confirm('Are you sure you want to delete this horse?');
			if (confirmDelete) {
				const clientInfo = await manageClient.getClientInfo(cID);
				const response = await manageClient.deleteClientHorse(hID, cID);
				return { ...response, hID };
			} else {
				return { status: false, msg: 'Horse deletion cancelled.' };
			}
		}
	}
	catch(err){
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('editHorseError', 'Edit horse error: ', err, 'Unable to edit the horse at this time.', 'form-msg');
	}
}

/**
 * Updates the text of the select option for the given horse ID.
 * 
 * @param {string} hID - The horse ID.
 * @param {string} horseName - The new name of the horse.
 */
function updateHorseSelectOption(hID, horseName) {
	const selectElement = document.getElementById('horse-list');
	const option = selectElement.querySelector(`option[value="${hID}"]`);
	if (option) {
		option.text = horseName;
	}
}

/**
 * Removes the select option for the given horse ID.
 * 
 * @param {string} hID - The horse ID.
 */
function removeHorseSelectOption(hID) {
	const selectElement = document.getElementById('horse-list');
	const option = selectElement.querySelector(`option[value="${hID}"]`);
	if (option) {
		option.remove();
	}
}