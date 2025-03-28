import { buildEle } from '../../../../utils/dom/elements.js';
import { buildPageContainer, buildTwoColumnInputSection, buildTwoColumnSelectElementSection } from '../../../../utils/dom/forms/buildUtils.js';
import { removeListeners } from '../../../../utils/dom/listeners.js';
import { cleanUserOutput } from '../../../../utils/string/stringUtils.js';

// Handle logging
const COMPONENT = 'Build Delete Duplicate Client Page';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Set event listener component id
const COMPONENT_ID = 'delete-duplicate-client';

/**
 * Builds the Delete Duplicate Client page with filter and client selection functionality
 * @async
 * @param {Object} params - The parameters object
 * @param {HTMLElement} params.mainContainer - The main container element where the page will be rendered
 * @param {Object} params.manageClient - The client management service object
 * @param {Object} params.manageUser - The user management service object
 * @throws {Error} Throws any errors that occur during page building
 * @returns {Promise<void>}
 */
export default async function buildDeleteDuplicateClientPage({ mainContainer, manageClient, manageUser }) {
	try {
		// Need to get all duplicate clients
		const duplicateClients = await manageClient.getAllDuplicateClients();
		
		if (duplicateClients.length === 0) {
			await buildNoDuplicateClients(mainContainer); // Still need to build this
			return;
		}

		debugLog('duplicateClients:', duplicateClients);


		// Get the page data
		const clientOptions = await getClientListOptions({ manageClient, mainContainer });
		debugLog('clientOptions:', clientOptions);

		const pageComponents = await buildPageComponents(clientOptions);

		await renderPage({ mainContainer, pageComponents });

		// Initialize the event handlers
		await initializeEventHandlers({ mainContainer, manageClient, manageUser, componentId: COMPONENT_ID, duplicateClients });
	}
	catch (err) {
		throw err;
	}
}

/**
 * Generates options for the client selection dropdown
 * @param {Array<Object>} uniqueClients - Array of unique client objects
 * @param {string|null} uniqueClients[].cID - The client ID
 * @param {string} uniqueClients[].client_name - The client name
 * @param {number} [uniqueClients[].duplicateCount] - Number of duplicates for the client
 * @returns {Promise<Array<Object>>} Array of option objects with value and text properties for select element
 */
async function getClientListOptions({ manageClient, mainContainer }) {
	// Need to get all duplicate clients
	const duplicateClients = await manageClient.getAllDuplicateClients();
	if (duplicateClients.length === 0) {
		await buildNoDuplicateClients(mainContainer); // Still need to build this
		return;
	}

	debugLog('duplicateClients:', duplicateClients);

	// Count duplicates for each client
	const clientDuplicateCounts = getDuplicateCount(duplicateClients);

	debugLog('clientDuplicateCounts:', clientDuplicateCounts);
	// Create unique client list with duplicate counts
	const uniqueClients = getUniqueClientList({ duplicateClients, clientDuplicateCounts });

	debugLog('uniqueClients:', uniqueClients);


	// Put a null value and text into the uniqueClients
	uniqueClients.unshift({ cID: null, client_name: '-- Select a Client --' });

	// Client list options
	return uniqueClients.map(client => {
		return {
			value: client.cID,
			text: `${cleanUserOutput(client?.client_name)}${client?.duplicateCount ? ` (${client?.duplicateCount} duplicates)` : ''}`,
		}
	});
}

async function buildNoDuplicateClients(mainContainer) {
	const [container, card] = await buildPageContainer({
		pageTitle: 'Delete Duplicate Client',
	});

	const p = buildEle({
		type: 'p',
		text: 'No duplicate clients found.',
		myClass: ['w3-center'],
	});

	card.appendChild(p);
	container.appendChild(card);
	mainContainer.innerHTML = '';
	mainContainer.appendChild(container);
}

/**
 * Calculates the count of duplicate entries for each client
 * @param {Array<Object>} duplicateClients - Array of client objects with duplicate entries
 * @param {string} duplicateClients[].cID - The client ID
 * @returns {Object} An object with client IDs as keys and duplicate counts as values
 */
function getDuplicateCount(duplicateClients) {
	// Count duplicates for each client
	return duplicateClients.reduce((acc, client) => {
		acc[client.cID] = (acc[client.cID] || 0) + 1;
		return acc;
	}, {});
}

/**
 * Creates a list of unique clients with their duplicate counts
 * @param {Object} params - The parameters object
 * @param {Array<Object>} params.duplicateClients - Array of client objects with duplicate entries
 * @param {Object} params.clientDuplicateCounts - Object containing duplicate counts for each client
 * @returns {Array<Object>} Array of unique client objects with added duplicateCount property
 */
function getUniqueClientList({ duplicateClients, clientDuplicateCounts }) {
	// Create unique client list with duplicate counts
	return Array.from(new Set(duplicateClients.map(client => client.cID)))
		.map(cID => {
			const client = duplicateClients.find(c => c.cID === cID);
			return {
				...client,
				duplicateCount: clientDuplicateCounts[cID]
			};
		});
}

async function buildPageComponents(clientOptions) {
	// Build the page
	const [[container, card], filterSection, clientListSection] = await Promise.all([
		buildPageContainer({
			pageTitle: 'Delete Duplicate Client',
		}),
		buildTwoColumnInputSection({
			labelText: 'Filter Client List:',
			inputID: 'filter-client-list',
			inputType: 'search',
			inputName: 'filter_client_list',
			inputTitle: 'Filter the client list',
		}),
		buildTwoColumnSelectElementSection({
			labelText: 'Select a Client:',
			selectID: 'client-list',
			selectName: 'client_list',
			selectTitle: 'Select a client.',
			required: true,
			options: clientOptions,
		}),
	]);

	const clientContainer = buildEle({
		type: 'div',
		attributes: { id: 'client-container' },
		myClass: ['w3-padding-small'],
	});

	return [
		container,
		card,
		filterSection,
		clientListSection,
		clientContainer
	];
}

async function renderPage({ mainContainer, pageComponents }) {

	debugLog('render page: ', pageComponents);
	const [container, card] = pageComponents.splice(0, 2);

	card.append(...pageComponents);
	container.append(card);

	// Clear the main container
	mainContainer.innerHTML = '';
	mainContainer.appendChild(container);
}

async function initializeEventHandlers({ mainContainer, manageClient, manageUser, componentId, duplicateClients }) {
	try {
		const { default: deleteDuplicateClient } = await import("../../../../../features/client/ui/delete-duplicate/deleteDuplicateClientJS.js");
		await deleteDuplicateClient({ mainContainer, duplicateClients, manageClient, manageUser, componentId });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		const { AppError } = await import("../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		}, true);
	}
}