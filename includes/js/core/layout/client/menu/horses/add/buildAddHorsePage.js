import { buildEle } from '../../../../../utils/dom/elements.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';
import buildPageContainer from '../../../../components/buildPageContainer.js';
import buildSubmitButtonSection from '../../../../components/buildSubmitButtonSection.js';
import buildTwoColumnInputSection from '../../../../components/buildTwoColumnInputSection.js';

const COMPONENT_ID = 'add-horse';
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
		const {default: addNewHorse } = await import("../../../../../../features/client/ui/add-horse/addNewHorseJS.js");
		await addNewHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
}

async function buildHorseForm() {
	try {
		const FORM_CONFIG = {
			id: 'add-horse-form',
			input: {
				labelText: 'Name of Horse: ',
				inputID: 'horse-name',
				inputType: 'text',
				inputName: 'horse_name',
				inputTitle: "Horse's Name",
				required: true
			}
		};

		// Build the form element
		const form = buildEle({
			type: 'form',
			attributes: { id: FORM_CONFIG.id },
		});

		// Build the form elements
		const [horseInput, buttons] = await Promise.all([
			buildTwoColumnInputSection(FORM_CONFIG.input),
			buildSubmitButtonSection('Add New Horse'),
		]);

		// Append the form elements
		form.append(horseInput, buttons);
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
