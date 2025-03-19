import { buildEle } from '../../../../../utils/dom/elements.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';
import buildPageContainer from '../../../../components/buildPageContainer.js';
import buildTwoColumnSelectElementSection from '../../../../components/buildTwoColumnSelectElementSection.js';

const COMPONENT_ID = 'edit-horse';

export default async function buildEditHorsePage({ cID, primaryKey, mainContainer, manageClient, manageUser }){
	try{
		// Clear any previous page messages
		clearMsg({ container: 'page-msg' });

		// Make sure we have a cID and primaryKey
		if(!(cID || primaryKey)) throw new Error('Unable to build the edit horse page. Certain parameters are missing.');

		// Get the client's information
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientName = cleanUserOutput(clientInfo.client_name) || 'No Name Found';
		const clientHorses = clientInfo?.horses || [];

		// Setup the select options for the horse list
		const selectOptionArray = clientHorses.map(horse => ({ value: horse.hID, text: cleanUserOutput(horse.horse_name), 'data-service-type': horse.service_type, 'data-trim-cycle': horse.trim_cycle }));
		selectOptionArray.unshift({ value: 'null', text: '-- Select a horse --' });

		const [[container, card], selectHorse] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Edit Horse for ',
				clientName,
				cID,
				primaryKey,
			}),
			buildTwoColumnSelectElementSection({
				labelText: 'Select a Horse: ',
				selectID: 'horse-list',
				selectName: 'horse_list',
				selectTitle: "Horse's Name",
				options: selectOptionArray,
				required: true,
			}),
		]);

		// Build the horse container that will show the form elements. This is built in the UI
		const horseContainer = buildEle({
			type: 'div',
			attributes: { id: 'horse-container' },
		});

		// Clear the main container
		mainContainer.innerHTML = '';

		container.appendChild(card);
		card.append(selectHorse, horseContainer);
		mainContainer.appendChild(container);

		// Initialize the UI handler file
		const { default: editClientHorse } = await import('../../../../../../features/client/ui/edit-horse/editClientHorse.js');
		editClientHorse({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		// Remove event listeners
		return () => removeListeners(COMPONENT_ID);
	}
	catch(err){
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		}, true);
	}
}