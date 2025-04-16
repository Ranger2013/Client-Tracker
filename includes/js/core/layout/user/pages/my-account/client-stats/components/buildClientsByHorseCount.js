import { buildElementsFromConfig, getValidElement } from '../../../../../../utils/dom/elements.js';
import { addListener, removeListeners } from '../../../../../../utils/dom/listeners.js';

// Setup debug mode
const COMPONENT = 'Build Clients By Horse Count';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Event listener
const COMPONENT_ID = 'clients-by-horse-count';

export default async function buildClientsByHorseCount({ evt, tabContentContainer, manageClient }) {
	const tabContainer = getValidElement(tabContentContainer);
	const overviewStats = tabContainer.innerHTML;

	const numberOfHorses = evt.target.dataset.horses;

	// Get the client list based on the number of horses
	const clientList = await getClientsByHorseCount({ numberOfHorses, manageClient })

	// Build the page components
	const titleComponents = buildTitleComponents({ numberOfHorses });
	const clientListComponents = buildClientListComponents({ clientList });

	// Render the page
	renderPage({ tabContainer: tabContentContainer, titleComponents, clientListComponents });

	// Handle the back to stats event listener
	handleBackToStatsEventListener({ tabContainer, overviewStats });

	return () => removeListeners(COMPONENT_ID);
}

async function getClientsByHorseCount({ numberOfHorses, manageClient }) {
	const clientList = await manageClient.getClientScheduleList();
	return clientList.filter(client => {
		const horseCount = client?.horses.length;
		return horseCount === parseInt(numberOfHorses, 10);
	})
		.sort((a, b) => a.client_name.localeCompare(b.client_name));
}

function buildTitleComponents({ numberOfHorses }) {
	const titleComponents = {
		buttonContainer: {
			type: 'div',
			myClass: ['w3-bar', 'w3-padding-small', 'w3-center'],
		},
		button: {
			type: 'button',
			myClass: ['w3-button', 'w3-blue-grey', 'w3-round', 'w3-small'],
			attributes: {
				id: 'back-to-overview',
				'data-back-to-overview': 'overview',
			},
			text: '← Back to Stats'
		},
		mainTitle: {
			type: 'div',
			myClass: ['w3-center'],
			text: `Clients with ${numberOfHorses} Horse(s)`,
		},
		subTitle: {
			type: 'div',
			myClass: ['w3-center', 'w3-small'],
			text: `<span class="w3-text-red">*</span> Names in <span class="w3-text-red">red</span> are inactive.`,
		},
	}

	const elements = buildElementsFromConfig(titleComponents);
	const { buttonContainer, button, mainTitle, subTitle } = elements;
	buttonContainer.appendChild(button);
	return { mainTitle, subTitle, buttonContainer };
}

function buildClientListComponents({ clientList }) {
	const fragment = document.createDocumentFragment();

	clientList.forEach(client => {
		const CLIENT_LIST_MAPPING = {
			row: {
				type: 'div',
				myClass: ['w3-row'],
			},
			colOne: {
				type: 'div',
				myClass: ['w3-col', 's7', 'w3-padding-small'],
			},
			colOneAnchor: {
				type: 'a',
				myClass: ['w3-pointer', 'w3-underline', client.active === 'no' ? 'w3-text-red' : ''],
				attributes: {
					href: `/tracker/clients/appointments/?cID=${client.cID}&primaryKey=${client.primaryKey}`,
					'data-component': 'client-navigation',
					'data-clientid': client.cID,
					'data-primarykey': client.primaryKey,
					title: client.client_name,
				},
				text: client.client_name,
			},
			colTwo: {
				type: 'div',
				myClass: ['w3-col', 's5', 'w3-padding-small'],
				text: `${parseInt(client.trim_cycle, 10) / 7} Week Cycle`,
			},
		};

		const coponents = buildElementsFromConfig(CLIENT_LIST_MAPPING);
		const { row, colOne, colOneAnchor, colTwo } = coponents;
		colOne.appendChild(colOneAnchor);
		row.append(colOne, colTwo);
		fragment.appendChild(row);
	});

	return fragment;
}

function renderPage({ tabContainer, titleComponents, clientListComponents }) {
	// Clear the tabContainer
	tabContainer = getValidElement(tabContainer);

	// Clear existing content
	tabContainer.innerHTML = '';
	tabContainer.append(...Object.values(titleComponents), clientListComponents);
}

function handleBackToStatsEventListener({ tabContainer, overviewStats }) {
	addListener({
		elementOrId: 'back-to-overview',
		eventType: ['click'],
		handler: (evt) => {
			evt.preventDefault();
			tabContainer.innerHTML = overviewStats;
		},
		componentId: COMPONENT_ID,
	})
}