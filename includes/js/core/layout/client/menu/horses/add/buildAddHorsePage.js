import { buildEle, buildElementsFromConfig } from '../../../../../utils/dom/elements.js';
import { buildPageContainer, buildSubmitButtonSection, buildTwoColumnInputSection, buildTwoColumnRadioButtonSection, buildTwoColumnSelectElementSection } from '../../../../../utils/dom/forms/buildUtils.js';
import { trimCycleConfigurations } from '../../../../../utils/dom/forms/trimCycleConfigurations.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';

const COMPONENT_ID = 'add-horse';

// Error Logging
const COMPONENT = 'Add Horse Page';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Builds the Add Horse page.
 * @param {Object} params Page parameters
 * @param {HTMLElement} params.mainContainer The main container element
 * @param {string} params.cID Client ID
 * @param {string} params.primaryKey Client primary key
 * @returns {Promise<Function>} Cleanup function
 */
export default async function buildAddHorsePage({ cID, primaryKey, mainContainer, manageClient, manageUser }) {
	try {
		// Clear any page messages
		clearMsg({ container: 'page-msg' });

		if (!cID || !primaryKey) {
			throw new Error('Unable to build the add horse page. Certain parameters are missing.');
		}

		const clientInfo = await manageClient.getClientInfo({ primaryKey });

		const [[container, card], form] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Add Horse for ',
				clientName: cleanUserOutput(clientInfo.client_name),
				cID,
				primaryKey,
			}),
			buildHorseForm(),
		]);

		// Clear the page content
		mainContainer.innerHTML = '';
		card.append(form);
		container.append(card);
		mainContainer.append(container);

		// Initialize UI handler file
		const { default: addNewHorse } = await import("../../../../../../features/client/ui/add-horse/addNewHorseJS.js");
		await addNewHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
}

async function buildHorseForm() {
	try {
		// Build the form element
		const form = buildEle({
			type: 'form',
			attributes: { id: 'add-horse-form' },
		});

		// Build the form elements
		const [horseInput, horseType, serviceType, trimCycle, buttons] = await Promise.all([
			buildTwoColumnInputSection({
				labelText: 'Name of Horse: ',
				inputID: 'horse-name',
				inputType: 'text',
				inputName: 'horse_name',
				inputTitle: "Horse's Name",
				required: true
			}),
			buildTwoColumnSelectElementSection({
				labelText: 'Type of Horse: ',
				selectID: 'horse-type',
				selectName: 'horse_type',
				selectTitle: 'Type of Horse',
				required: true,
				options: typeHorseOptions(),
			}),
			buildTwoColumnRadioButtonSection({
				labelText: 'Service Type: ',
				buttons: [
					{ name: 'service_type', value: 'trim', labelText: 'Trim: ', checked: true },
					{ name: 'service_type', value: 'half_set', labelText: 'Half Set Shoes: ' },
					{ name: 'service_type', value: 'full_set', labelText: 'Full Set Shoes: ' },
				],
			}),
			buildTwoColumnSelectElementSection({
				labelText: 'Trim Cycle: ',
				selectID: 'trim-cycle',
				selectName: 'trim_cycle',
				selectTitle: 'Trim Cycle',
				required: true,
				options: trimCycleConfigurations(),
			}),
			buildSubmitButtonSection('Add New Horse'),
		]);

		// Append the form elements
		form.append(horseInput, horseType, serviceType, trimCycle, buttons);
		return form;
	}
	catch (err) {
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

function typeHorseOptions() {
	return [
		{ value: 'null', text: '-- Select Horse Type --' },
		{ value: 'horse', text: 'Horse' },
		{ value: 'draft', text: 'Draft' },
		{ value: 'mule', text: 'Mule' },
		{ value: 'donkey', text: 'Donkey' },
		{ value: 'mini_donkey', text: 'Mini Donkey' },
		{ value: 'pony', text: 'Pony' },
		{ value: 'mini_pony', text: 'Mini Pony' },
	];
}