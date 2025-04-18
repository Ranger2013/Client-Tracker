import setupClientAnchorListener from '../../../../core/navigation/components/setupClientAnchorListener.js';
import checkAppointment from '../../../../core/services/appointment-block/checkAppointment.js';
import { disableEnableSubmitButton } from '../../../../core/utils/dom/elements.js';
import { addListener } from '../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.js';
import { ucwords, underscoreToSpaces } from '../../../../core/utils/string/stringUtils.js';
import buildListOfHorsesSection from './components/buildListOfHorsesSection.js';
import calculateTotalCost from './components/calculateTotalCost.js';
import { handleShowingAccessoriesSelectBox, handleShowingCostChangeInput, updateCostChangeInput, updateServiceCostSelectedIndex } from './handlers/costHandlers.js';
import handleAddTrimmingFormSubmission from './handlers/formSubmission.js';

const COMPONENT = 'Add Trimming JS';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export const prevOptions = new Map();

export default async function addTrimming({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId }) {
	try {
		// Handle the client navigation anchor
		setupClientAnchorListener({ manageClient, manageUser, componentId });
		debugLog('In addTrimming: ');

		// Get the clients information
		const clientInfo = await manageClient.getClientInfo({ primaryKey });

		checkAppointment({
			trimDate: 'next-trim-date',
			appBlock: 'appointment-block',
			projAppBlock: 'projected-appointment-block',
			clientInfo,
			manageClient,
			manageUser,
		});

		// Set up static event handlers for known elements
		const staticEventHandlers = {
			'input:number-horses': async (evt) => {
				numberOfHorsesServiced({ evt, primaryKey, manageClient, manageUser });
			},
			'focusin:number-horses': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
			'change:next-trim-date': (evt) => checkAppointment({
				trimDate: 'next-trim-date',
				appBlock: 'appointment-block',
				projAppBlock: 'projected-appointment-block',
				clientInfo,
				manageClient,
				manageUser,
			}),
			'change:mileage': async (evt) => await disableMileageCharges({ evt }),
			'submit:trimming-form': (evt) => {
				evt.preventDefault();
				handleAddTrimmingFormSubmission({ evt, cID, primaryKey, mainContainer, manageClient })
			},
		};

		// Registry of dynamic element handlers with their specific event types
		const dynamicHandlers = {
			'horse-list-': {
				events: ['change'], // Only trigger on change event
				handler: async (evt, index) => {
					debugLog(`Horse list ${index} changed:`, evt.target.value);
					await updateAllHorseListSelectElements(evt);
					await changeServiceCostToMatchHorseService({evt, primaryKey, manageClient});
					updateHorseListLabel({evt});
				}
			},
			'service-cost-': {
				events: ['change'], // Select elements use change
				handler: async (evt, index) => {
					debugLog(`Service cost ${index} changed:`, evt.target.value);
					await handleShowingAccessoriesSelectBox({ evt, index });
					await updateCostChangeInput({ evt, index });
					calculateTotalCost();
				}
			},
			'checkbox-cost-': {
				events: ['change'], // Checkboxes use change
				handler: async (evt, index) => {
					debugLog(`Checkbox cost ${index} changed:`, evt.target.checked);
					await handleShowingCostChangeInput({ evt, index });
				}
			},
			'cost-change-': {
				events: ['input'], // Text inputs use input
				handler: async (evt, index) => {
					debugLog(`Cost change ${index} input:`, evt.target.value);
					await updateServiceCostSelectedIndex({ evt, index });
					calculateTotalCost();
				}
			},
			'accessories-': {
				events: ['change'], // Multi-select uses change
				handler: async (evt, index) => await calculateTotalCost(),
			},
		};

		// Add our event listener for the entire page. This handles all dynamic elements
		addListener({
			elementOrId: 'card',
			eventType: ['input', 'change', 'submit', 'focusin', 'click'],
			handler: (evt) => {
				const eventKey = `${evt.type}:${evt.target.id}`;

				// First check for static handlers (exact matches)
				if (staticEventHandlers[eventKey]) {
					debugLog('Event handler: ', evt.target);
					staticEventHandlers[eventKey](evt);
					return;
				}

				// Then check for dynamic handlers (prefix matches)
				const id = evt.target.id;
				for (const prefix in dynamicHandlers) {
					if (id.startsWith(prefix)) {
						const handler = dynamicHandlers[prefix];
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
	catch (err) {
		debugLog('Add Trimming Error: ', err);
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}

async function numberOfHorsesServiced({ evt, primaryKey, manageClient, manageUser }) {
	try {
		debugLog('number of horses serviced: user input value: ', evt.target.value);
		// Show error message if blank or 0. return early
		if (evt.target.value === '0' || evt.target.value === '') {
			safeDisplayMessage({
				elementId: `${evt.target.id}-error`,
				message: 'Please enter the number of horses serviced.',
				targetId: evt.target
			});

			disableEnableSubmitButton('submit-button');
			return;
		}

		// Clear any previous messages
		clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });

		// Show the list of horses
		await buildListOfHorsesSection({ evt, horseListContainer: 'number-horse-container', primaryKey, manageClient, manageUser });
	}
	catch (err) {
		disableEnableSubmitButton('submit-button');

		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
			displayTarget: 'number-horses-error',
		});
	}
}

async function disableMileageCharges({ evt }) {
	try {
		debugLog('In disableMileageCharges: ', evt.target);
		const checkbox = evt.target;
		const mileageCharges = document.getElementById('mileage-charges');
		const fuelCostDisplay = document.getElementById('fuel-cost-display');

		fuelCostDisplay.classList.toggle('w3-hide', checkbox.checked);
		mileageCharges.disabled = checkbox.checked;

		await calculateTotalCost();
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error trying to disable mileage charges.'
		});
	}
}

async function updateAllHorseListSelectElements(evt) {
	try {
		// Initialize the Map with current selections if it's empty
		if (prevOptions.size === 0) {
			const form = document.getElementById('trimming-form');
			const initialSelects = form.querySelectorAll('select[id^="horse-list-"]');
			for (const select of initialSelects) {
				const option = select.options[select.selectedIndex];
				prevOptions.set(select.id, option);
			}
		}
		debugLog('Initialized prevOptions: ', prevOptions);
		const select = evt.target;
		const usersSelectedOption = select.options[select.selectedIndex];

		// Get all the select elements listed
		let horseListSelects = document.querySelectorAll('select[id^="horse-list-"]');

		for (const sel of horseListSelects) {
			if (sel.id !== select.id) {
				// If there was a previously selected option for this select element, add it back
				if (prevOptions.has(select.id)) {
					let prevOption = prevOptions.get(select.id);
					let option = prevOption.cloneNode(true);
					sel.add(option);
				}

				// Remove the newly selected option
				for (let i = 0; i < sel.options.length; i++) {
					if (sel.options[i].value === usersSelectedOption.value) {
						sel.remove(i);
						break;
					}
				}
			}
		}

		// Store the newly selected option as the previous option for this select element
		prevOptions.set(select.id, usersSelectedOption);

		debugLog('Previous Options Map:', prevOptions);
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error trying to update the horse list select elements.'
		});
	}
}

async function changeServiceCostToMatchHorseService({ evt, primaryKey, manageClient }) {
    try {
        const shoeMapping = {
            half_set: 'front_',
            full_set: 'full_',
            trim: 'trim',
        };

        // Get the selected horses id
        const selectedHorseId = evt.target.value.split(':')[0];
        // Get the index of this event target id
        const index = evt.target.id.split(/-/g).pop();

        // Get the service cost for the selected horse
        const serviceCostElement = document.getElementById(`service-cost-${index}`);
        const serviceCost = serviceCostElement.options[serviceCostElement.selectedIndex].value;
    
        // Get the clients list of horses
        const clientHorses = await manageClient.getClientHorses({ primaryKey });
        
        // Find the selected horse from the list
        const selectedHorse = clientHorses.find(horse => horse.hID.toString() === selectedHorseId);
        if (!selectedHorse) return;

        const mappedService = shoeMapping[selectedHorse.service_type];

		  // Check if current selection already matches the horse's service type
        if (!serviceCost.includes(mappedService)) {
            // Find the first option that matches the mapped service type
            const options = serviceCostElement.options;
            let matchFound = false;

            for (let i = 0; i < options.length; i++) {
                if (options[i].value.includes(mappedService)) {
                    serviceCostElement.selectedIndex = i;
                    matchFound = true;
                    // Create a proper change event that includes the target
                    const changeEvent = new Event('change', {
                        bubbles: true,
                        cancelable: true
                    });
                    Object.defineProperty(changeEvent, 'target', {value: serviceCostElement});
                    serviceCostElement.dispatchEvent(changeEvent);
                    break;
                }
            }

            // If no matching service found, default to first option
            if (!matchFound) {
                serviceCostElement.selectedIndex = 0;
                const changeEvent = new Event('change', {
                    bubbles: true,
                    cancelable: true
                });
                Object.defineProperty(changeEvent, 'target', {value: serviceCostElement});
                serviceCostElement.dispatchEvent(changeEvent);
            }
        }
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'We encountered an error trying to update the service cost to match the horse service.'
        });
    }
}

async function updateHorseListLabel({evt}){
	try{
		const index = evt.target.id.split(/-/g).pop();
		const selectedOption = evt.target.options[evt.target.selectedIndex];
		const serviceType = selectedOption.dataset.serviceType;
		const serviceTime = selectedOption.dataset.trimCycle;
		const horseType = selectedOption.dataset.horseType;

		const horseTrimCycleDiv = document.querySelector(`#horse-trim-cycle-${index}`);
		horseTrimCycleDiv.innerHTML = `<span class="w3-small">${ucwords(underscoreToSpaces(serviceType))} Cycle: ${serviceTime / 7} weeks</span>`;
		const horseTypeDiv = document.getElementById(`horse-type-${index}`);
		horseTypeDiv.innerHTML = horseType !== '' ? `Horse Type: ${ucwords(underscoreToSpaces(horseType))}` : 'Horse Type: Unknown';
	}
	catch(err){
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		});
	}
}