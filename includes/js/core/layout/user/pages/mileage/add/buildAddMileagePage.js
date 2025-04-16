import { sortByTrimDateAndAppTime } from '../../../../../utils/date/dateUtils.js';
import { buildEle, buildElementTree } from '../../../../../utils/dom/elements.js';
import { buildErrorDiv, buildPageContainer, buildSubmitButtonSection, buildTwoColumnInputSection } from '../../../../../utils/dom/forms/buildUtils.js';
import createSelectElement from '../../../../../utils/dom/forms/createSelectElement.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';

// Set up debugging
const COMPONENT = 'Build Add Mileage Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Set event listener component
const COMPONENT_ID = 'add-mileage-page';

export default async function buildAddMileagePage({ mainContainer, manageClient, manageUser }) {
	try {
		// Clear any page-msg
		clearMsg({ container: 'page-msg' });

		// Get the client list information
		const clientList = await getPageData({ manageClient, manageUser });
		debugLog('buildAddMileagePage: Client List:', clientList);

		// Build the page components
		const pageComponents = await buildPageComponents({ clientList });

		renderPage({ pageComponents, mainContainer });

		await initializeHandlers({ manageClient, manageUser, componentId: COMPONENT_ID });
		return () => removeListeners(COMPONENT_ID);

	}
	catch (err) {
		throw err;
	}
}

async function getPageData({ manageClient, manageUser }) {
	const clientList = await manageClient.getClientScheduleList({ active: 'yes' });
	return clientList.sort((a, b) => sortByTrimDateAndAppTime(a, b));
}

async function buildPageComponents({ clientList }) {
	// Convert the client list into a list of options
	const clientOptions = clientListToOptions(clientList);

	// Build most of the page components concurrently
	const [[container, card], startMileageSection, endMileageSection, submitButton] = await Promise.all([
		buildPageContainer({ pageTitle: 'Add Mileage' }),
		buildTwoColumnInputSection({
			labelText: 'Starting Mileage: ',
			inputID: 'starting-mileage',
			inputType: 'number',
			inputName: 'starting_mileage',
			inputTitle: 'Enter the starting mileage',
		}),
		buildTwoColumnInputSection({
			labelText: 'Ending Mileage: ',
			inputID: 'ending-mileage',
			inputType: 'number',
			inputName: 'ending_mileage',
			inputTitle: 'Enter the ending mileage',
		}),
		buildSubmitButtonSection('Add Mileage'),
	]);

	const pageStructure = buildPageStructure();

	// Build the client list select element
	const clientListSelect = createSelectElement({
		id: 'select-destination',
		name: 'destination',
		title: 'Select the destination client',
		options: clientOptions,
		nullOptionText: '-- Select a client --',
		required: true,
		disabled: true,
	});

	// Build the destination input
	const destinationInput = buildEle({
		type: 'input',
		attributes: {
			id: 'input-destination',
			name: 'destination',
			title: 'Enter your destination name',
			required: true,
			disabled: true,
			placeholder: 'Destination',
		},
		myClass: ['w3-input', 'w3-border'],
	});

	// Build the form
	const form = buildEle({
		type: 'form',
		attributes: { id: 'mileage-form' },
	});

	return {
		container,
		card,
		startMileageSection,
		endMileageSection,
		submitButton,
		clientListSelect,
		destinationInput,
		form,
		pageStructure,
	};
}

function buildPageStructure() {
	const PAGE_MAPPING = {
		type: 'div',
		myClass: ['w3-row'],
		children: {
			destinationLabel: {
				type: 'div',
				myClass: ['w3-col', 'm6', 'w3-padding-small'],
				text: 'Destination:'
			},
			destinationButtonsContainer: {
				type: 'div',
				myClass: ['w3-col', 'm6', 'w3-padding-small'],
				children: {
					buttonsContainer: {
						type: 'div',
						myClass: ['w3-row', 'w3-padding-small'],
						children: {
							clientListSelectButtonContainer: {
								type: 'div',
								myClass: ['w3-col', 's6', 'w3-center'],
								children: {
									clientListButton: {
										type: 'button',
										attributes: { id: 'client-list-button' },
										myClass: ['w3-button', 'w3-black', 'w3-round-large', 'w3-hover-light-grey', 'w3-padding-small'],
										text: 'Select Client',
									}
								},
							},
							destinationInputButtonContainer: {
								type: 'div',
								myClass: ['w3-col', 's6', 'w3-center'],
								children: {
									destinationButton: {
										type: 'button',
										attributes: { id: 'destination-button' },
										myClass: ['w3-button', 'w3-black', 'w3-round-large', 'w3-hover-light-grey', 'w3-padding-small'],
										text: 'Enter Destination',
									}
								}
							},
						},
					},
					displayContainer: {
						type: 'div',
						myClass: ['w3-padding-small'],
						children: {
							clientListDisplayContainer: {
								type: 'div',
								myClass: ['w3-hide'],
								attributes: { id: 'client-list-display-container' },
							},
							destinationDisplayContainer: {
								type: 'div',
								myClass: ['w3-hide'],
								attributes: { id: 'destination-display-container' },
							},
							destinationErrorContainer: {
								type: 'div',
								attributes: { id: 'destination-error' },
								myClass: ['w3-padding-small', 'w3-center'],
							},
						},
					},
				},
			},
		},
	};

	const elements = buildElementTree(PAGE_MAPPING);
	debugLog('buildPageStructure: Elements:', elements);
	return elements;
}

function clientListToOptions(clientList) {
	debugLog('clientListToOptions: Client List:', clientList);
	const sortedList = clientList.sort((a, b) => sortByTrimDateAndAppTime(a, b));

	return sortedList.map(client => {
		return new Option(
			cleanUserOutput(client.client_name),
			cleanUserOutput(client.client_name),
		)
	});
}

function renderPage({ pageComponents, mainContainer }) {
	const {
		container,
		card,
		startMileageSection,
		endMileageSection,
		submitButton,
		clientListSelect,
		destinationInput,
		form,
		pageStructure,
	} = pageComponents;

	// Get the containers from the page structure to put our input and select elements into
	const clientListDisplay = pageStructure.querySelector('#client-list-display-container');
	const destinationDisplay = pageStructure.querySelector('#destination-display-container');

	clientListDisplay.appendChild(clientListSelect);
	destinationDisplay.appendChild(destinationInput);

	form.append(pageStructure, startMileageSection, endMileageSection, submitButton);
	card.append(form)
	container.append(card);

	mainContainer.innerHTML = '';
	mainContainer.append(container);
}

async function initializeHandlers({ manageClient, manageUser, componentId }) {
	const { default: addMileage } = await import("../../../../../../features/user/ui/mileage/add/addMileageJS.js");
	addMileage({ manageClient, manageUser, componentId });
}