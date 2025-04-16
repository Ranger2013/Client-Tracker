import { buildEle, buildElementsFromConfig, getValidElement } from '../../../../../utils/dom/elements.js';
import createSelectElement from '../../../../../utils/dom/forms/createSelectElement.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import buildHorseTypesWidget from './components/buildHorseTypesWidget.js';
import buildOverviewWidget from './components/buildOverviewWidget.js';

// Set up debug mode
const COMPONENT = 'Client Stats Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const COMPONENT_ID = 'build-client-stats-page';

export default async function buildClientStatsPage({ tabContentContainer, manageClient, manageUser, componentId }) {

	const allClientInfo = await manageClient.getClientScheduleList();
	debugLog('All Client Info: ', allClientInfo);
	if (!allClientInfo?.length) {
		const noClientComponent = buildNoClientsComponent();
		renderNoClientPage({ tabContainer: tabContentContainer, pageComponent: noClientComponent });
		return;
	}

	const pageComponent = buildPageComponents();
	const widgets = buildWidgets({ clientData: allClientInfo, componentId });

	renderPage({ tabContainer: tabContentContainer, pageComponent, widgets });

	// Initialize UI Event Handlers
	const { default: clientStats } = await import("../../../../../../features/user/ui/my-account/user-account/tabs/client-stats/clientStatsJS.js");
	await clientStats({ tabContentContainer, componentId: COMPONENT_ID, manageUser, manageClient });

	return () => removeListeners(COMPONENT_ID);
}

function buildPageComponents() {
	const tabs = [
		{ value: 'overview', text: 'Overview' },
		{ value: 'horse-types', text: 'Horse Types' },
	];

	const pageComponents = {
		container: {
			type: 'div',
			myClass: ['w3-padding-small', 'w3-border-bottom', 'w3-border-gray'],
		},
		tabBarContainer: {
			type: 'div',
			myClass: ['w3-center'],
		},
		overviewContainer: {
			type: 'div',
			attributes: { id: 'overview-container' },
			myClass: ['w3-padding-small'],
		},
		horseTypesContainer: {
			type: 'div',
			attributes: { id: 'horse-types-container' },
			myClass: ['w3-padding-small', 'w3-hide'],
		},
	};

	const elements = buildElementsFromConfig(pageComponents);

	const tabBar = buildEle({
		type: 'div',
		myClass: ['w3-bar', 'w3-round-large', 'w3-card'],
		attributes: { id: 'tab-bar-container', style: 'display: inline-block; overflow: hidden;' },
	});

	tabs.forEach((tab, index) => {
		const button = buildEle({
			type: 'button',
			myClass: index === 0 ? ['w3-bar-item', 'w3-button', 'w3-blue-grey'] : ['w3-bar-item', 'w3-button'],
			attributes: {
				'data-widget': tab.value,
				style: 'minWidth: 70px;',
			},
			text: tab.text,
		});

		tabBar.appendChild(button);
	});

	elements.tabBarContainer.appendChild(tabBar);
	return elements;
}

function buildWidgets({ clientData, componentId }) {
	const processData = processClientData(clientData);
	const overviewWidget = buildOverviewWidget(processData);
	const horseTypesWidget = buildHorseTypesWidget(processData);

	return { overviewWidget, horseTypesWidget };
}

function processClientData(clientData) {
	const uniqueClients = new Set();

	// Initialize counters as arrays [inactive, active]
	const clientCounter = [0, 0];
	const horseCounter = [0, 0];

	// For client horse count grouping
	const clientsByHorseCount = {};

	// For horse types
	const horseTypes = {
		draft: 0,
		horse: 0,
		mule: 0,
		donkey: 0,
		'mini_donkey': 0,
		pony: 0,
		'mini_pony': 0,
	};
	debugLog('Process Client Data: clientData: ', clientData);

	clientData.forEach(client => {
		if (uniqueClients.has(client.cID)) return;
		uniqueClients.add(client.cID);

		// Use boolean as index: false->0, true->1
		const isActive = client.active === 'yes';
		clientCounter[+isActive]++;

		// Process horses
		const horses = client.horses || [];
		const horseCount = horses.length;

		// Update the horse counter
		horseCounter[+isActive] += horseCount;

		// Group by horse count
		if (!clientsByHorseCount[horseCount]) {
			clientsByHorseCount[horseCount] = [];
		}
		clientsByHorseCount[horseCount].push(client);

		// Process horse types
		horses.forEach(horse => {
			const type = horse.horse_type?.toLowerCase() || 'horse';
			if (horseTypes.hasOwnProperty(type)) {
				horseTypes[type]++;
			}
			else {
				horseTypes.horse++;
			}
		});
	});

	debugLog('Horse Types: ', horseTypes);
	debugLog('Client Counter: ', clientCounter);
	debugLog('Horse Counter: ', horseCounter);
	debugLog('Clients by Horse Count: ', clientsByHorseCount);
	return {
		clientsByHorseCount,
		horseTypes,
		totalActiveClients: clientCounter[1],
		totalInactiveClients: clientCounter[0],
		totalActiveHorses: horseCounter[1],
		totalInactiveHorses: horseCounter[0],
		totalClients: clientCounter[0] + clientCounter[1],
		totalHorses: horseCounter[0] + horseCounter[1]
	};
}

function buildNoClientsComponent() {
	const component = buildEle({
		type: 'div',
		myClass: ['w3-padding-small', 'w3-center'],
		text: 'No Clients Found',
	})
	return component;
}

function renderNoClientPage({ tabContainer, pageComponent }) {
	const tabContentContainer = getValidElement(tabContainer);

	tabContentContainer.innerHTML = ''; // Clear existing content
	tabContentContainer.appendChild(pageComponent);
}

function renderPage({ tabContainer, pageComponent, widgets }) {
	const tabContentContainer = getValidElement(tabContainer);
	const { container, ...otherComponents } = pageComponent;

	otherComponents.overviewContainer.appendChild(widgets.overviewWidget);
	otherComponents.horseTypesContainer.appendChild(widgets.horseTypesWidget);
	container.append(...Object.values(otherComponents));

	tabContentContainer.innerHTML = ''; // Clear existing content
	tabContentContainer.appendChild(container);
}
