import { buildEle, buildElementsFromConfig } from '../../../../../core/utils/dom/elements.js';
import createSelectElement from '../../../../../core/utils/dom/forms/createSelectElement.js';

const COMPONENT = 'buildServiceBlocks';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
}

/**
 * Shows the horse list select elements.
 * 
 * @param {Object} params - The parameters for the function.
 * @param {number} params.iterator - The iterator for the elements.
 * @param {Array} params.horseListOptions - The options for the horse list select element.
 * @param {Array} params.farrierPricesOptions - The options for the farrier prices select element.
 * @param {Array} params.accessoryOptions - The options for the accessory select element.
 * @returns {Promise<HTMLElement>} The created row element containing the select elements.
 */
export default async function buildServiceBlocks({ iterator, clientTrimCycle, horseListOptions, farrierPricesOptions, accessoryOptions }) {
	try {
		const i = iterator;
		const PAGE_MAPPING = {
			row: {
				type: 'div',
				myClass: ['w3-row', 'w3-padding-small', 'w3-border-bottom', 'w3-margin-bottom'],
			},
			firstCol: {
				type: 'div',
				myClass: ['w3-col', 'm6'],
			},
			firstColLabel: {
				type: 'label',
				attributes: { for: `horse-list-${i}` },
				text: 'Horse\'s Name:',
			},
			firstColHorseTrimCycle: {
				type: 'div',
				attributes: { id: `horse-trim-cycle-${i}` },
				myClass: ['w3-small'],
			},
			firstColTypeHorse: {
				type: 'div',
				attributes: { id: `horse-type-${i}` },
				myClass: ['w3-small'],
				text: 'Horse Type: ',
			},
			secondCol: {
				type: 'div',
				myClass: ['w3-col', 'm6'],
			},
			horseListSelectError: {
				type: 'div',
				attributes: { id: `horse-list-${i}-error` },
			},
			servicesContainer: {
				type: 'div',
				attributes: { id: `services-container-${i}` },
				myClass: ['w3-padding-small', 'w3-hide'],
			},
			accessoriesContainer: {
				type: 'div',
				attributes: { id: `accessories-container-${i}` },
				myClass: ['w3-padding-small', 'w3-hide'],
			},
			changeCostCheckboxContainer: {
				type: 'label',
				attributes: { id: `checkbox-container-${i}`, for: `checkbox-cost-${i}` },
				myClass: ['w3-padding-small', 'w3-hide'],
				text: ' Change price of your service.',
			},
			changeCostCheckbox: {
				type: 'input',
				attributes: {
					id: `checkbox-cost-${i}`,
					name: `checkbox_cost_${i}`,
					type: 'checkbox',
					value: '1',
					title: 'Change cost of your service',
				},
				myClass: ['w3-checkbox'],
			},
			changeCostInputContainer: {
				type: 'div',
				attributes: { id: `change-cost-container-${i}` },
				myClass: ['w3-padding-small', 'w3-hide'],
			},
			changeCostSpan: {
				type: 'span',
				myClass: ['w3-text-red', 'w3-small'],
				text: 'This does not change the accessory cost.',
			},
			changeCostInput: {
				type: 'input',
				attributes: {
					id: `cost-change-${i}`,
					type: 'number',
					title: 'Change cost of selected service.',
					placeholder: 'Change service cost',
					disabled: 'disabled',
				},
				myClass: ['w3-input', 'w3-border'],
			},
		};
		debugLog('In buildServiceBlocks: horseListOptions: ', horseListOptions);
		debugLog('In buildServiceBlocks: farrierPricesOptions: ', farrierPricesOptions);
		const elements = buildElementsFromConfig(PAGE_MAPPING);
		// Main Layout elements
		const { row, firstCol, firstColLabel, firstColHorseTrimCycle, firstColTypeHorse, secondCol } = elements;

		// Form Elements
		const { horseListSelectError, servicesContainer, accessoriesContainer } = elements;

		// Cost related elements
		const { changeCostCheckboxContainer, changeCostCheckbox, changeCostInputContainer, changeCostSpan, changeCostInput } = elements;
		// Creates the select element for the horse list
		const horseListSelect = createSelectElement({
			id: `horse-list-${i}`,
			name: `horse_list_${i}`,
			title: 'Select a Horse',
			options: horseListOptions,
			required: true,
		});

		// Creates the select element for the farrier's pricing
		const serviceCostSelect = createSelectElement({
			id: `service-cost-${i}`,
			name: `service_cost_${i}`,
			title: 'Type of Service',
			nullOptionText: '-- Select Service --',
			options: farrierPricesOptions,
			required: true,
		});

		// Creates the select element for the farrier's accessories pricing
		const accessoriesSelect = createSelectElement({
			id: `accessories-${i}`,
			name: `accessories_${i}`,
			title: 'Select the Accessories',
			options: accessoryOptions,
			nullOptionText: '-- Select Accessory --',
			multiple: true,
			disabled: true,
		});

		// Put The parts together
		servicesContainer.appendChild(serviceCostSelect);
		accessoriesContainer.appendChild(accessoriesSelect);
		changeCostCheckboxContainer.prepend(changeCostCheckbox);
		changeCostInputContainer.append(changeCostSpan, changeCostInput);

		// Put the main elements together
		firstCol.append(firstColLabel, firstColHorseTrimCycle, firstColTypeHorse);
		secondCol.append(
			horseListSelect,
			horseListSelectError,
			servicesContainer,
			accessoriesContainer,
			changeCostCheckboxContainer,
			changeCostInputContainer
		);

		// Add everything to the row
		row.append(firstCol, secondCol);
		return row;
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
			displayTarget: 'number-horses-error',
		}, true);
	}
}

async function updateChangeCostInput({ evt, changeCostInput }) {
	try {
		debugLog('In updateChangeCostInput: SHOULD NOT BE HERE');
		const selectElements = document.querySelectorAll('select[id^="service-cost-"]');
		const originalServiceCostValue = evt.target.value;
		changeCostInput.value = originalServiceCostValue.split(':')[1];
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'updateChangeCostInputError',
			'Update change cost input error: ',
			err,
		);
	}
}

async function changeServiceCost({ evt, serviceCostSelect }) {
	try {
		const newCost = evt.target.value;
		// Get the name of the service
		const serviceName = serviceCostSelect.options[serviceCostSelect.selectedIndex].value.split(':')[0];
		// Change the value of the selected service
		serviceCostSelect.options[serviceCostSelect.selectedIndex].value = `${serviceName}:${newCost}`;
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'changeServiceCostError',
			'Change service cost error: ',
			err,
		);
	}
}

function handleShowingAccessoriesSelect(evt, container, select) {
	// Show the accessories container if the service is not a trim
	container.classList.toggle('w3-hide', evt.target.value.includes('trim'));

	// Disable the accessories select if the service is a trim
	select.disabled = evt.target.value.includes('trim');
}
