import { buildGenericSelectOptions, disableEnableSubmitButton, getValidElement } from '../../../../../core/utils/dom/elements.js';
import { clearMsg } from '../../../../../core/utils/dom/messages.js';
import { cleanUserOutput, ucwords, underscoreToSpaces } from '../../../../../core/utils/string/stringUtils.js';
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

/**
 * Builds and manages the section where users can select horses for trimming
 * @async
 * @param {Object} params - The parameters object
 * @param {Event} params.evt - The event that triggered this function
 * @param {HTMLElement} params.horseListContainer - The container element for the horse list
 * @param {string|number} params.primaryKey - The primary key identifier for the client
 * @param {Object} params.manageClient - Client management interface object
 * @param {Object} params.manageUser - User management interface object
 * @throws {AppError} When unable to render the list or when farrier prices are not set
 * @returns {Promise<void>}
 */
export default async function buildListOfHorsesSection({ evt, horseListContainer, primaryKey, manageClient, manageUser }) {
	try {
		// Clear any form messages
		clearMsg({ container: 'form-msg' });

		// Get a valid html element
		horseListContainer = getValidElement(horseListContainer);
		// Get the number of children in the container
		const horseListChildren = horseListContainer.children.length;

		// Get all of our page data
		const {
			clientInfo,
			clientTrimCycle,
			clientHorses,
			totalHorses,
			farrierPrices,
			accessoryPrices,
		} = await getPageData({ manageUser, manageClient, primaryKey });

		debugLog('farrier prices: ', farrierPrices);

		const haveFarrierPricing = Object.values(farrierPrices).some(price => price !== '' && price !== '0.00' && price !== 0.00);

		if (!haveFarrierPricing) {
			throw new Error('Please update your farrier prices settings.');
		}

		// Set up the configuration options to pass to handle showing number of horses.
		const optionsConfig = getOptionsConfig({ clientHorses, userFarrierPrices: farrierPrices, accessoryPrices });

		const horseListSection = await handleShowingNumberOfHorses({
			evt,
			horseListContainer,
			clientTotalHorses: totalHorses,
			// farrierPrices: farrierPrices,
			optionsConfig,
			containerChildren: horseListChildren,
		});

		renderPage({ container: horseListContainer, horseList: horseListSection });

		await autoUpdateServiceCost(horseListContainer);

		// Get the final number of horses to determine the trimming costs
		const finalHorseCount = document.getElementById('number-horses').value;

		// Update the trimming costs and calculate total cost
		await updateTrimCost({ blockElementNode: horseListContainer, numberHorses: finalHorseCount, userFarrierPrices: farrierPrices });

		disableEnableSubmitButton('submit-button');

	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'Unable to render the list of horses section. Please update your farrier prices settings.',
			displayTarget: 'number-horses-error',
		}, true);
	}
}

/**
 * Renders the horse list section to the page
 * @param {Object} params - The parameters object
 * @param {HTMLElement} params.container - The container element to render into
 * @param {Array<HTMLElement>} params.horseList - Array of horse list elements to render
 * @private
 */
function renderPage({ container, horseList }) {
	// Set up a fragment
	const fragment = document.createDocumentFragment();

	fragment.append(...horseList);

	container.appendChild(fragment);
}

/**
 * Retrieves and processes all necessary data for the page
 * @async
 * @param {Object} params - The parameters object
 * @param {Object} params.manageUser - User management interface
 * @param {Object} params.manageClient - Client management interface
 * @param {string|number} params.primaryKey - The primary key identifier
 * @throws {AppError} When unable to get client data or when farrier prices are not set
 * @returns {Promise<Object>} Object containing client info, trim cycle, horses, and pricing data
 * @private
 */
async function getPageData({ manageUser, manageClient, primaryKey }) {
	try {
		const [clientInfo, userFarrierPrices] = await Promise.all([
			manageClient.getClientInfo({ primaryKey }),
			manageUser.getFarrierPrices(),
		]);

		// Get the user's accessory and farrier prices. If we don't have any, throw the error.
		const { accessories: accessoryPrices, ...farrierPrices } = userFarrierPrices;
		if (!accessoryPrices || Object.keys(farrierPrices).length === 0) throw new Error('Please update your farrier prices settings.');

		// Get the clients trim cycle
		const clientTrimCycle = clientInfo?.trim_cycle;

		// Get the clients horses sorted by trim cycle
		const clientHorses = clientInfo?.horses.sort((a, b) => {
			// First check if either matches the client's trim cycle
			const aMatchesClientCycle = a.trim_cycle === clientTrimCycle;
			const bMatchesClientCycle = b.trim_cycle === clientTrimCycle;

			// If one matches and the other doesn't, prioritize the match
			if (aMatchesClientCycle && !bMatchesClientCycle) return -1;
			if (!aMatchesClientCycle && bMatchesClientCycle) return 1;

			// If both match or both don't match, sort alphabetically
			return a.horse_name.localeCompare(b.horse_name);
		}) || [];

		// Get the clients total horses
		const totalHorses = clientHorses.length;

		return {
			clientInfo,
			clientTrimCycle,
			clientHorses,
			totalHorses,
			accessoryPrices,
			farrierPrices,
		};
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.PROCESSING_ERROR,
			userMessage: 'Unable to get client data.'
		}, true);
	}
}

/**
 * Creates configuration objects for various select elements
 * @param {Object} params - The parameters object
 * @param {Array} params.clientHorses - List of client's horses
 * @param {Object} params.userFarrierPrices - Farrier pricing information
 * @param {Object} params.accessoryPrices - Accessory pricing information
 * @returns {Object} Configuration object for horse list, farrier prices, and accessory options
 * @private
 */
function getOptionsConfig({ clientHorses, userFarrierPrices, accessoryPrices }) {
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
			list: Object.entries(userFarrierPrices)
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
 * Manages the display of horse selection elements based on user input
 * @async
 * @param {Object} params - The parameters object
 * @param {Event} params.evt - The event object
 * @param {HTMLElement} params.horseListContainer - Container for the horse list
 * @param {number} params.clientTotalHorses - Total number of horses for the client
 * @param {Object} params.farrierPrices - Farrier pricing information
 * @param {Object} params.optionsConfig - Select elements configuration
 * @param {number} params.containerChildren - Current number of children in container
 * @returns {Promise<Array>} Array of horse elements to display
 * @throws {Error} When there's an error processing the horse list
 * @private
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

/**
 * Initializes horse selection dropdowns and manages their state
 * @param {Array<HTMLElement>} buildShowHorseList - Array of horse list elements
 * @private
 */
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

/**
 * Automatically updates service costs based on horse selections
 * @param {HTMLElement} horseListContainer - Container element for the horse list
 * @private
 */
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

			if (serviceCostOption) {
				serviceCostOption.selected = true;
			}
			const changeEvent = new Event('change', {
				bubbles: true,
				cancelable: true
			});
			Object.defineProperty(changeEvent, 'target', { value: serviceCostSelect });
			serviceCostSelect.dispatchEvent(changeEvent);
		});
	}
	catch (err) {
		console.warn('Error in autoUpdateServiceCost: ', err);
	}
}