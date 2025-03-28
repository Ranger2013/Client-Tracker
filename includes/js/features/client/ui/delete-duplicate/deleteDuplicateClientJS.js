import { getValidElement } from '../../../../core/utils/dom/elements';
import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils.js';
import filterClientList from '../../../../core/utils/dom/forms/filterClientSelectElement';
import { addListener } from '../../../../core/utils/dom/listeners';
import { safeDisplayMessage } from '../../../../core/utils/dom/messages';
import showClientSelection from './components/showClientSelection';

// Set up the debugging component and function
const COMPONENT = 'Delete Duplicate Client JS';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Handle state management for the duplicate clients passed from the build page
let currentDuplicateClients = [];

export default async function deleteDuplicateClient({ mainContainer, duplicateClients, manageClient, manageUser, componentId }) {
	try {
		// Store the data in the currentDuplicateClients variable
		currentDuplicateClients = [...duplicateClients];

		// Initialize the event handlers
		initializeEventHandlers({ mainContainer, manageClient, manageUser, componentId });
	}
	catch (err) {
		const { AppError } = await import('../../../../core/errors/models/AppError.js');
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'An error occurred while initializing the Delete Duplicate Client page.'
		});
	}
}

function initializeEventHandlers({ mainContainer, manageClient, manageUser, componentId }) {
	// Create the debounce for the search input
	const searchInput = createDebouncedHandler(async (evt) => {
		await filterClientList({ evt, selectElement: 'client-list' });
	}, getOptimalDelay('search'));

	// Set up the static event handlers
	const staticEventHandlers = {
		'input:filter-client-list': (evt) => {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Filtering Client List...',
				isSuccess: true,
				color: 'w3-text-blue',
			});

			searchInput(evt)
		},
		'change:client-list': (evt) => showClientSelection({ evt, duplicateClients: currentDuplicateClients, manageClient, manageUser }),
	};

	const dynamicEventHandlers = {
		'delete-button': {
			events: ['click'], // Only trigger on click event
			handler: async (evt, index) => {
				const { default: deleteTheDuplicate } = await import('./components/deleteTheDuplicateClient.js');
				await deleteTheDuplicate({ evt, duplicateClients: currentDuplicateClients, manageClient, manageUser, index });
			}
		}
	};

	addListener({
		elementOrId: 'card',
		eventType: ['input', 'change', 'click'],
		handler: async (evt) => {
			// Handle static events first
			const keyPath = `${evt.type}:${evt.target.id}`;
			debugLog('keyPath: ', keyPath);
			if (staticEventHandlers[keyPath]) {
				staticEventHandlers[keyPath](evt);
				return;
			}

			// Then check for dynamic handlers (prefix matches)
			const id = evt.target.id;
			debugLog('id: ', id);
			for (const prefix in dynamicEventHandlers) {
				debugLog('prefix: ', prefix);
				if (id.startsWith(prefix)) {
					const handler = dynamicEventHandlers[prefix];
					debugLog('handler: ', handler);
					// Only execute if this event type should trigger this handler
					if (handler.events.includes(evt.type)) {
						const index = id.split(/-/g).pop();
						handler.handler(evt, index);
					}
					return;
				}
			}
		},
		componentId,
	});
}