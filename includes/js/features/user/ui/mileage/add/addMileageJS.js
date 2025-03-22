import { addListener } from '../../../../../core/utils/dom/listeners.min.js';

// Set up debuggin
const COMPONENT = 'Add Mileage';
const DEBUG = true;
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
		// Set up the static event handlers
		const staticHandlers = {
			'click:client-list-button': (evt) => {
				evt.preventDefault();
				toggleDisplays(evt)
			},
			'click:destination-button': (evt) => {
				evt.preventDefault();
				toggleDisplays(evt)
			},
			'focusin:starting-mileage': () => { },
			'focusin:ending-mileage': () => { },
			'submit:mileage-form': () => { },
		};

		// Set up the listener for the form
		addListener({
			elementOrId: 'mileage-form',
			eventType: ['click', 'focusin', 'submit'],
			handler: (evt) => {
				const keyPath = `${evt.type}:${evt.target.id}`;

				if (staticHandlers[keyPath]) {
					staticHandlers[keyPath](evt);
				}
			},
			componentId,
		})
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}
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
