import ManageClient from "../../../../../../classes/ManageClient.js";
import { buildEle, clearMsg } from "../../../../../dom/domUtils.js";
import { addListener, removeAllListeners } from "../../../../../event-listeners/listeners.js";
import { cleanUserOutput } from "../../../../../string/stringUtils.js";
import buildPageContainer from "../../../../helpers/buildPageContainer.js";
import buildSubmitDeleteButtonSection from "../../../../helpers/buildSubmitDeleteButtonSection.js";
import buildTwoColumnInputSection from "../../../../helpers/buildTwoColumnInputSection.js";
import buildTwoColumnSelectElementSection from "../../../../helpers/buildTwoColumnSelectElementSection.js";

export default async function buildEditHorsePage({ cID, primaryKey, mainContainer }) {
	try {
		// Clear any page msgs
		clearMsg({ container: 'page-msg' });

		if (!(cID || primaryKey)) {
			const { default: buildNoClientAvailablePage } = await import("../helpers/buildNoClientAvailablePage.js");
			// Show error page
			await buildNoClientAvailablePage(mainContainer);
			return;
		}

		// Get client information
		const manageClient = new ManageClient();
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientName = clientInfo?.client_name || 'No Name ';
		const clientHorses = clientInfo?.horses || [];

		// Set up the select options
		const selectOptions = clientHorses.map(horse => ({ value: horse.hID, text: horse.horse_name }));
		selectOptions.unshift({ value: 'null', text: '-- Select a Horse --' });

		const [[container, card], selectHorse] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Edit Horse for ',
				clientName,
				cID,
				primaryKey
			}),
			buildTwoColumnSelectElementSection({
				labelText: 'Select a Horse:',
				selectID: 'horse-list',
				selectName: 'horse_id',
				selectTitle: "Horse's Name",
				options: selectOptions,
			}),
		]);

		// Build the form msg
		const formMsg = buildEle({
			type: 'div',
			attributes: { id: 'form-msg' },
			myClass: ['w3-center'],
		});

		const horseContainer = buildEle({
			type: 'div',
			attributes: { id: 'horse-container' }
		});

		// Clear the main container
		mainContainer.innerHTML = '';

		// Put it all together
		container.appendChild(card);
		card.appendChild(formMsg);
		card.appendChild(selectHorse);
		card.appendChild(horseContainer);
		mainContainer.appendChild(container);

		// Set the event listener for the horse select to show the form
		addListener('horse-list', 'change', async (evt) => {
			// Clear the container if the user selects the default
			if (evt.target.value === 'null') {
				horseContainer.innerHTML = '';
				return;
			};

			// Add the form to the container
			const form = await buildEditForm(evt, primaryKey);

			// Add the form to the horse container
			horseContainer.innerHTML = '';
			horseContainer.appendChild(form);

			const { default: editHorse } = await import("../../../../../../pages/client-menu/client-horses/edit/editHorseJS.js");
			await editHorse({cID, mainContainer: horseContainer, clientHorses});
		});

		return removeAllListeners;
	}
	catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError(
			'buildEditHorsePageError',
			'Error building the edit horse page:',
			err,
			'Unable to display the edit horse page. Please try again later.',
			'page-msg'
		);
	}
}

/**
 * Builds the edit form for a horse.
 * 
 * @param {Event} evt - The event object.
 * @param {string} primaryKey - The primary key of the client.
 * @returns {Promise<HTMLFormElement>} - A promise that resolves to the form element.
 */
async function buildEditForm(evt, primaryKey) {
	try {
		const hID = evt.target.value;
		const horseName = evt.target.options[evt.target.selectedIndex].text;

		const editHorseForm = buildEle({
			type: 'form',
			attributes: { id: 'edit-horse-form' }
		});

		// Define synchronous form elements
		const formElements = [
			{
				type: 'input',
				attributes: {
					type: 'hidden',
					name: 'hID',
					value: hID
				}
			},
			{
				type: 'input',
				attributes: {
					type: 'hidden',
					name: 'primaryKey',
					value: primaryKey
				}
			}
		];

		// Create synchronous form elements
		formElements.forEach(element => {
			editHorseForm.appendChild(buildEle(element));
		});

		// Create asynchronous form elements concurrently
		const [horseNameInput, submitDeleteButtons] = await Promise.all([
			buildTwoColumnInputSection({
				labelText: "Horse's Name: ",
				inputID: 'horse-name',
				inputType: 'text',
				inputName: 'horse_name',
				inputValue: cleanUserOutput(horseName),
				inputTitle: "Horse's Name",
				required: true
			}),
			buildSubmitDeleteButtonSection({
				submitButtonText: 'Edit Horse',
				deleteButtonText: 'Delete Horse'
			})
		]);

		// Append asynchronous form elements to the form
		editHorseForm.appendChild(horseNameInput);
		editHorseForm.appendChild(submitDeleteButtons);

		return editHorseForm;
	}
	catch (err) {
		const { handleError } = await import("../../../../../../utils/error-messages/handleError.js");
		await handleError('buildEditFormError', 'Build edit form error: ', err);
		throw err;
	}
}