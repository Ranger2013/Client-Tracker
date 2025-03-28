import { disableEnableSubmitButton } from '../../../../../core/utils/dom/elements.js';
import { addListener } from '../../../../../core/utils/dom/listeners.js';
import { clearMsg } from '../../../../../core/utils/dom/messages.js';
import handleAddMileageFormSubmission from './components/handleAddMileageFormSubmission.js';

// Set up debuggin
const COMPONENT = 'Add Mileage';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Sets up event handlers for the mileage form functionality
 * @async
 * @param {Object} params - The parameters object
 * @param {Object} params.manageClient - The client management object
 * @param {Object} params.manageUser - The user management object
 * @param {string} params.componentId - The ID of the component
 * @throws {AppError} Throws an AppError if initialization fails
 * @returns {Promise<void>}
 */
export default async function addMileage({ manageClient, manageUser, componentId }) {
	try {
		// Initialize event handlers for the page
		await setupEventHandlers({componentId, manageClient, manageUser});

	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}
}

/**
 * Sets up event delegation for all mileage form interactions
 * 
 * Uses a static handler mapping to respond to different DOM events
 * based on element ID and event type. This approach improves performance
 * by using a single event listener at the form level instead of
 * individual listeners for each element.
 * 
 * @param {Object} params - Configuration parameters
 * @param {string} params.componentId - ID of the component for listener tracking
 * @param {Object} params.manageClient - Client management instance
 * @param {Object} params.manageUser - User management instance
 * @returns {void}
 */
function setupEventHandlers({componentId, manageClient, manageUser}) {
	// Set up the static event handlers
	const staticHandlers = {
		'click:client-list-button': (evt) => {
			evt.preventDefault();
			toggleDisplays(evt);
		},
		'change:select-destination': (evt) => {
			clearMsg({container: 'destination-error', hide: true, input: 'select-destination'});
			disableEnableSubmitButton('submit-button');
		},
		'focusin:input-destination': (evt) => {
			clearMsg({container: 'destination-error', hide: true, input: 'input-destination'});
			disableEnableSubmitButton('submit-button');
		},
		'click:destination-button': (evt) => {
			evt.preventDefault();
			toggleDisplays(evt)
		},
		'focusin:starting-mileage': (evt) => {
			clearMsg({container: `${evt.target.id}-error`, hide: true, input: evt.target.id});
			disableEnableSubmitButton('submit-button');
		},
		'focusin:ending-mileage': (evt) => {
			clearMsg({container: `${evt.target.id}-error`, hide: true, input: evt.target.id});
			disableEnableSubmitButton('submit-button');
		},
		'submit:mileage-form': async (evt) => {
			evt.preventDefault();
			await handleAddMileageFormSubmission({evt, manageClient, manageUser});
		},
	};

	// Set up the listener for the form
	addListener({
		elementOrId: 'mileage-form',
		eventType: ['click', 'focusin', 'submit', 'change'],
		handler: (evt) => {
			const keyPath = `${evt.type}:${evt.target.id}`;

			if (staticHandlers[keyPath]) {
				staticHandlers[keyPath](evt);
			}
		},
		componentId,
	});
}

/**
 * Toggles the display and form elements based on the clicked button.
 * Uses a mapping object to determine which elements to show/hide and enable/disable.
 * 
 * @param {Event} evt - The click event object
 * @param {HTMLElement} evt.target - The clicked button element
 * @param {string} evt.target.id - The ID of the clicked button, must match a key in CONTAINER_MAPPING
 * 
 * @example
 * // Add event listener to buttons
 * document.getElementById('client-list-button').addEventListener('click', toggleDisplays);
 * document.getElementById('destination-button').addEventListener('click', toggleDisplays);
 */
function toggleDisplays(evt) {
	const CONTAINER_MAPPING = {
		'client-list-button': {
			container: 'client-list-display-container',
			element: 'select-destination',
		},
		'destination-button': {
			container: 'destination-display-container',
			element: 'input-destination',
		},
	};

	// Get the clicked buttons mapping
	const clickedMapping = CONTAINER_MAPPING[evt.target.id];
	debugLog('toggleDisplays: clickedMapping:', clickedMapping);

	// Process all mappings
	Object.entries(CONTAINER_MAPPING).forEach(([buttonId, mapping]) => {
		debugLog('toggleDisplays: buttonId:', buttonId);
		debugLog('toggleDisplays: mapping:', mapping);
		const containerElement = document.getElementById(mapping.container);
		const formElement = document.getElementById(mapping.element);

		if (buttonId === evt.target.id) {
			// Show and enable the clicked button
			containerElement.classList.remove('w3-hide');
			formElement.disabled = false;
		}
		else {
			// Hide and disable the other buttons
			containerElement.classList.add('w3-hide');
			formElement.disabled = true;
		}
	});
}
