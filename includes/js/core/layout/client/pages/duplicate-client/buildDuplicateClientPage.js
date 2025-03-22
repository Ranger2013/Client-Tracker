import { buildElementsFromConfig } from '../../../../utils/dom/elements.min.js';
import { buildPageContainer, buildTwoColumnInputSection, buildTwoColumnSelectElementSection } from '../../../../utils/dom/forms/buildUtils.min.js';
import { removeListeners } from '../../../../utils/dom/listeners.min.js';
import { cleanUserOutput } from '../../../../utils/string/stringUtils.min.js';

// Set up logging.
const COMPONENT = 'Build Duplicate Client Page';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`${COMPONENT}`, ...args);
	}
};

// Set up component id for listeners
const COMPONENT_ID = 'duplicate-client';

const uniqueClients = new Set();

export default async function buildDuplicateClientPage({ mainContainer, manageClient, manageUser }) {
	try {
		// Clear the Set when initializing the page
		uniqueClients.clear();
		debugLog('new Set(): uniqueClients: ', uniqueClients);
		// Get the client information
		const allClientList = await manageClient.getClientScheduleList();
		debugLog('allClientList:', allClientList);

		const clientListOptions = allClientList.filter((client) => {
			if (uniqueClients.has(client.cID)) {
				debugLog('Client already in Set(): ', uniqueClients.has(client.cID));
				return false;
			}

			// Add the client to the Set()
			debugLog('Adding client to Set(): ', client.cID);
			uniqueClients.add(client.cID);
			return true;
		})
			.map(client => ({ value: `${client.primaryKey}:${cleanUserOutput(client.client_name)}`, text: `${cleanUserOutput(client.client_name)}` }));
		debugLog('clientListOptions:', clientListOptions);

		const [[container, card], filterSection, clientListSection] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Duplicate a Client',
			}),
			buildTwoColumnInputSection({
				labelText: 'Filter Client List: ',
				inputID: 'filter-client',
				inputType: 'search',
				inputName: 'filter_client',
				inputTitle: 'Filter the client list by name',
			}),
			buildTwoColumnSelectElementSection({
				labelText: 'Select Client: ',
				selectID: 'select-client',
				selectName: 'select_client',
				selectTitle: 'Select the client to duplicate',
				options: [
					{
						value: 'null',
						text: '-- Select a client --',
					},
					...clientListOptions,
				],
			}),
		]);
		debugLog('clientListSection:', clientListSection);

		const PAGE_LAYOUT = {
			form: {
				type: 'form',
				attributes: { id: 'duplicate-form' },
			},
			filterRow: {
				type: 'div',
				myClass: ['w3-row', 'w3-padding-small'],
			},
			selectClientRow: {
				type: 'div',
				myClass: ['w3-row', 'w3-padding-small'],
			},
			clientContainer: {
				type: 'div',
				attributes: { id: 'client-container' },
			},
			pageNotesContainer: {
				type: 'div',
				myClass: ['w3-container'],
			},
			pageNotes: {
				type: 'p',
				myClass: ['w3-padding-small', 'w3-text-light-grey', 'w3-small'],
				text: 'Duplicate a client in order to have multiple appointment bookings.<br>This is useful for barns that have a lot horses and you need to split up your appointments.',
			},
		};

		// Build the page elements
		const { form, filterRow, selectClientRow, clientContainer, pageNotesContainer, pageNotes } = buildElementsFromConfig(PAGE_LAYOUT);

		// Put it together
		filterRow.appendChild(filterSection);
		selectClientRow.appendChild(clientListSection);
		pageNotesContainer.appendChild(pageNotes);
		form.append(selectClientRow, clientContainer);
		card.append(pageNotesContainer, filterRow, form);
		container.appendChild(card);

		// Clear the main container
		mainContainer.innerHTML = '';
		mainContainer.appendChild(container);

		const { default: duplicateClient } = await import("../../../../../features/client/ui/duplicate-client/duplicateClientJS.js");
		duplicateClient({ mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
}