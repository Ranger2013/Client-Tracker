import checkAppointment from '../../../../core/services/appointment-block/checkAppointment.min.js';
import { getValidElement } from '../../../../core/utils/dom/elements.min.js';
import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils.min.js';
import filterClientList from '../../../../core/utils/dom/forms/filterClientSelectElement.min.js';
import { addListener } from '../../../../core/utils/dom/listeners.min.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.min.js';
import buildAndShowClientForm from './components/buildAndShowClientForm.min.js';
import duplicateClientFormSubmission from './components/duplicateClientFormSubmission.min.js';

// Set up Error Logging
const COMPONENT = 'Duplicate Client';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function duplicateClient({ mainContainer, manageClient, manageUser, componentId }) {
	try {
		// Set up the debouncing for the search input
		const debouncedSearch = createDebouncedHandler((evt) => {
			filterClientList({evt, selectElement: 'select-client'});
		}, getOptimalDelay('search'));

		// Set up the static event handlers
		const staticHandlers = {
			'input:filter-client': async (evt) => {
				if (evt.target.value) {
					safeDisplayMessage({
						elementId: 'form-msg',
						message: 'Filtering Client List...',
						isSuccess: true,
						color: 'w3-text-blue',
					})
				}
				debouncedSearch(evt);
			},
			'change:select-client': async (evt) => await buildAndShowClientForm({ evt, manageClient, manageUser }),
			'focusin:trim-cycle': (evt) => clearMsg({ container: 'trim-cycle-error', hide: true, input: 'trim-cycle' }),
			'change:next-trim-date': (evt) => {
				checkAppointment({
					trimDate: 'next-trim-date',
					trimCycle: 'trim-cycle',
					appBlock: 'appointment-block',
					projAppBlock: 'projected-appointment-block',
					manageClient,
					manageUser,
				})
			},
			'submit:duplicate-form': async (evt) => {
				evt.preventDefault();
				await duplicateClientFormSubmission({ evt, manageClient, manageUser });
			},
		};

		// Set up the event listener to delegate events
		addListener({
			elementOrId: 'card',
			eventType: ['input', 'change', 'submit', 'focusin'],
			handler: (evt) => {
				const eventKey = `${evt.type}:${evt.target.id}`;
				debugLog('Event Key: ', eventKey);
				// Handle static events first
				if (staticHandlers[eventKey]) {
					staticHandlers[eventKey](evt);
					return;
				}
			},
			componentId,
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}