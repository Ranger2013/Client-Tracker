import { buildGenericSelectOptions, disableEnableSubmitButton, getValidElement } from '../../../../../core/utils/dom/elements.js';
import { clearMsg } from '../../../../../core/utils/dom/messages.js';
import { cleanUserOutput, ucwords, underscoreToSpaces } from '../../../../../core/utils/string/stringUtils.js';
import ManageUser from '../../../../user/models/ManageUser.js';
import autoFillHorseList from './autoFillHorseList.js';
import calculateTotalCost from './calculateTotalCost.js';
import { updateTrimCost } from './updateTrimCost.js';
import { prevOptions } from '../addTrimmingJS.js';

const COMPONENT = 'BuildListOfHorsesSection';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function buildListOfHorsesSection({ evt, horseListContainer, primaryKey, manageClient, manageUser }) {
	try {
		// Clear any form messages
		clearMsg({ container: 'form-msg' });

		// Get a valid html element
		horseListContainer = getValidElement(horseListContainer);
		const horseListChildren = horseListContainer.children.length;

		// Get the clients information to extrapolate the horse list and total horses
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientHorses = clientInfo?.horses || [];
		const totalHorses = clientHorses.length;

		// Get the user's farrier prices
		const userFarrierPrices = await manageUser.getFarrierPrices();
		const { accessories: accessoryPrices, ...farrierPrices } = userFarrierPrices;

		const optionsConfig = getOptionsConfig({ clientHorses, userFarrierPrices });
		debugLog('Options Configuration: ', optionsConfig);
		const horseListSection = await handleShowingNumberOfHorses({
			evt,
			horseListContainer,
			clientTotalHorses: totalHorses,
			farrierPrices: farrierPrices,
			optionsConfig,
			containerChildren: horseListChildren,
		});

		horseListSection?.forEach(horseList => horseListContainer.appendChild(horseList));

		await autoUpdateServiceCost(horseListContainer);

		// Get the final number of horses to determine the trimming costs
		const finalHorseCount = document.getElementById('number-horses').value;

		// Update the trimming costs and calculate total cost
		await Promise.all([
			updateTrimCost({ blockElementNode: horseListContainer, numberHorses: finalHorseCount, userFarrierPrices: farrierPrices }),
			calculateTotalCost(),
		]);

		disableEnableSubmitButton('submit-button');

	}
	catch (err) {
		throw err;
	}
}

/**
 * Get the options configuration for the select elements.
 * @param {Array} clientHorses - The list of client horses.
 * @param {Object} userFarrierPrices - The user farrier prices.
 * @returns {Object} The options configuration.
 */
function getOptionsConfig({ clientHorses, userFarrierPrices }) {
	const { accessories: accessoryPrices, ...farrierPrices } = userFarrierPrices;
	return {
		horseListOptionsConfig: {
			list: clientHorses,
			value: opt => `${opt.hID}:${opt.horse_name}`,
			text: opt => opt.horse_name,
			attributes: opt => ({
				'data-service-type': opt.service_type,
				'data-trim-cycle': opt.trim_cycle
			})
		},
		farrierPricesOptionsConfig: {
			list: Object.entries(farrierPrices)
				.filter(([key, value]) => value !== '' && value !== '0.00' && value !== 0.00)
				.reduce((acc, [key, value]) => {
					const isTrim = key.includes('trim');
					if (isTrim && !acc.trim) {
						acc.trim = true;
						acc.list.push({ shoe: 'trim', price: 'xxx' });
					} else if (!isTrim) {
						acc.list.push({ shoe: key, price: value });
					}
					return acc;
				}, { trim: false, list: [] })
				.list,
			value: opt => `${opt.shoe}:${opt.price}`,
			text: opt => ucwords(underscoreToSpaces(opt.shoe)),
		},
		accessoryOptionsConfig: {
			list: Object.entries(accessoryPrices)
				.filter(([type, items]) => items.length > 0)
				.flatMap(([type, items]) => items.map(item => ({ type, acc: item.name || type, price: item.cost }))),
			value: opt => `${opt.type}:${opt.acc}:${opt.price}`,
			text: opt => ucwords(opt.acc),
		},
	};
}

/**
 * Handle showing the number of horses based on user input.
 * @param {Object} params - The parameters.
 * @param {Event} params.evt - The event object.
 * @param {HTMLElement} params.horseListContainer - The container for the horse list.
 * @param {number} params.clientTotalHorses - The total number of client horses.
 * @param {Object} params.farrierPrices - The farrier prices.
 * @param {Object} params.optionsConfig - The options configuration.
 * @param {number} params.containerChildren - The number of children in the horse list container.
 * @returns {Promise<Array>} The list of horse elements to display.
 */
async function handleShowingNumberOfHorses({ evt, horseListContainer, clientTotalHorses, farrierPrices, optionsConfig, containerChildren }) {
	try {
		// Number of horses we are showing
		let numberHorsesInput = parseInt(evt.target.value, 10);

		// Clear prevOptions whenever number of horses changes
		prevOptions.clear();

		// Handle max horses boundary condition first
		if (numberHorsesInput >= clientTotalHorses) {
			if (numberHorsesInput > clientTotalHorses) {
				// Set the max number of horses as the numberHorseInput
				numberHorsesInput = clientTotalHorses;
				// Set the actual input element value to the max number of horses
				evt.target.value = clientTotalHorses;
			}

			// Clear the horse list container
			horseListContainer.innerHTML = '';
			debugLog('Options Configuration: ', optionsConfig);
			debugLog('Max Possible Horses: clientTotalHorses: ', clientTotalHorses);

			// Auto fill with the horses names and the service auto set to trim
			const autoFill = await autoFillHorseList({ totalHorses: clientTotalHorses, optionsConfig });

			// Keep only the selected option for each select
			autoFill.map(options => options.querySelector('select[id^="horse-list-"]'))
				.forEach(select => {
					const selectedOption = select.options[select.selectedIndex];

					Array.from(select.options).forEach(option => {
						if (option !== selectedOption) {
							select.removeChild(option);
						}
					});
				});

			return autoFill;
		}

		// Handle removing horses case
		if (numberHorsesInput < containerChildren) {
			let childList = containerChildren;
			let removedOptions = [];

			const [removeLastOption, addNewOption] = await Promise.all([
				import("./removeLastChildAndGetOptions.js"),
				import("./addOptionToRemainingHorseListSelectElements.js"),
			]);
			const { default: removeLastChildAndGetOptions } = removeLastOption;
			const { default: addOptionToRemainingHorseListSelectElements } = addNewOption;

			while (childList > numberHorsesInput) {
				const selectedOptions = await removeLastChildAndGetOptions(horseListContainer);
				if (selectedOptions) removedOptions.push(selectedOptions);
				childList--;
			}

			removedOptions.forEach(optionWithIndex =>
				addOptionToRemainingHorseListSelectElements({ container: horseListContainer, optionWithIndex }));

			// After removing horses, reinitialize prevOptions with remaining horses
			const remainingSelects = horseListContainer.querySelectorAll('select[id^="horse-list-"]');
			remainingSelects.forEach(select => {
				const selectedOption = select.options[select.selectedIndex];
				prevOptions.set(select.id, selectedOption);
			});

			return [];
		}

		debugLog('Number of horses input: ', numberHorsesInput);
		// Clear the horseListContainer
		horseListContainer.innerHTML = '';
		const buildShowHorseList = await autoFillHorseList({ totalHorses: numberHorsesInput, optionsConfig });

		// Replace the old dropdown management code with our new function
		initializeHorseSelections(buildShowHorseList);

		return buildShowHorseList;
	}
	catch (err) {
		throw err;
	}
}

function initializeHorseSelections(buildShowHorseList) {
	// Clear previous options when rebuilding list
	prevOptions.clear();

	// Get and track selected horses
	const selectedHorses = buildShowHorseList.map(options => {
		const select = options.querySelector('select[id^="horse-list-"]');
		const selectedOption = select.options[select.selectedIndex];
		// Store initial selection in prevOptions
		prevOptions.set(select.id, selectedOption);
		return selectedOption.value;
	});

	// Remove already selected horses from other dropdowns
	buildShowHorseList.map(options => options.querySelector('select[id^="horse-list-"]'))
		.forEach(select => {
			const selectedOption = select.options[select.selectedIndex];
			Array.from(select.options).forEach(option => {
				if (option !== selectedOption && selectedHorses.includes(option.value)) {
					select.removeChild(option);
				}
			});
		});

	debugLog('Initialized prevOptions:', prevOptions);
}

function autoUpdateServiceCost(horseListContainer) {
	try {
		const serviceTypeMapping = {
			trim: 'trim',
			half_set: 'front_',
			full_set: 'full_',
		};

		const horseListSelects = horseListContainer.querySelectorAll('select[id^="horse-list-"]');

		horseListSelects.forEach(horseListSelect => {
			const index = horseListSelect.id.split('-').pop();
			const serviceCostSelect = horseListContainer.querySelector(`select[id="service-cost-${index}"]`);
			const horseListSelectedIndex = horseListSelect.options[horseListSelect.selectedIndex];
			const serviceCostOption = Array.from(serviceCostSelect.options).find(option => {
				return option.value.includes(serviceTypeMapping[horseListSelectedIndex.dataset.serviceType]);
			});
			
			if(serviceCostOption) {
				serviceCostOption.selected = true;
				const changeEvent = new Event('change', {
					bubbles: true,
					cancelable: true
			  });
			  Object.defineProperty(changeEvent, 'target', {value: serviceCostSelect});
			  serviceCostSelect.dispatchEvent(changeEvent);
			}
		});
	}
	catch (err) {
		console.warn('Error in autoUpdateServiceCost: ', err);
	}
}