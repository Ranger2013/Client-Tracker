import { buildGenericSelectOptions } from '../../../../../core/utils/dom/elements.js';
import { ucwords, underscoreToSpaces } from '../../../../../core/utils/string/stringUtils.js';
import buildServiceBlocks from './buildServiceBlocks.js';

// Set up debugging const and arrow function
const COMPONENT = 'AutoFillHorseList';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Cache for select options to avoid rebuilding them
const optionsCache = new Map();

export default async function autoFillHorseList({ totalHorses, optionsConfig }) {
	try {
		debugLog('optionsConfig: ', optionsConfig);
		// Create a DocumentFragment for better performance
		const fragment = document.createDocumentFragment();

		// Pre-build options once if not cached
		const getCachedOptions = (config, cacheKey) => {
			debugLog('In getCachedOptions: config: ', config);
			const key = JSON.stringify(config);
			if (!optionsCache.has(key)) {
				optionsCache.set(key, buildGenericSelectOptions(config));
			}
			return optionsCache.get(key);
		};

		// Pre-build all options sets
		const options = {
			horseList: getCachedOptions(optionsConfig.horseListOptionsConfig, 'horseList'),
			farrierPrices: getCachedOptions(optionsConfig.farrierPricesOptionsConfig, 'farrierPrices'),
			accessories: getCachedOptions(optionsConfig.accessoryOptionsConfig, 'accessories')
		};

		debugLog('Options: ', options);
		
		// Build all blocks concurrently
		const blocks = await Promise.all(
			Array.from({ length: totalHorses }, async (_, i) => {
				const iterator = i + 1;

				const block = await buildServiceBlocks({
					iterator,
					horseListOptions: options.horseList,
					farrierPricesOptions: options.farrierPrices,
					accessoryOptions: options.accessories,
				});

				debugLog('Block: ', block);
				// Get and configure elements
				const horseList = block.querySelector(`#horse-list-${iterator}`);
				debugLog('Horse List Element: ', horseList);
				const servicesContainer = block.querySelector(`#services-container-${iterator}`);
				const checkboxContainer = block.querySelector(`#checkbox-container-${iterator}`);

				const predictedOptions = [];

				// Identify all predicted options in this select box
				for(let j = 0; j < horseList.options.length; j++){
					if(horseList.options[j].getAttribute('data-is-predicted') === 'true'){
						predictedOptions.push(j);
					}
				}

				// If we have predicted options, prioritize them
				if(predictedOptions.length > 0 && i < predictedOptions.length){
					// Take predicted options in order
					horseList.selectedIndex = predictedOptions[i];
				}
				else {
					// Otherwise fall back to default index-based selection
					horseList.selectedIndex = Math.min(i, horseList.options.length - 1);
				}


				// Set selected index to i (0-based) instead of iterator (1-based)
				// horseList.selectedIndex = i;

				const horseTypeDiv = block.querySelector(`#horse-type-${iterator}`);
				const horseTrimCycleDiv = block.querySelector(`#horse-trim-cycle-${iterator}`);
				const selectOption = horseList.options[horseList.selectedIndex];
				const serviceType = selectOption.dataset.serviceType;
				const serviceTime = selectOption.dataset.trimCycle;
				const horseType = selectOption.dataset.horseType || 'Unknown';
				horseTrimCycleDiv.innerHTML = `<span class="w3-small">${ucwords(underscoreToSpaces(serviceType))} Cycle: ${serviceTime / 7} weeks</span>`;
				horseTypeDiv.textContent = horseTypeDiv.textContent + ucwords(underscoreToSpaces(horseType));


				// Show the containers
				[servicesContainer, checkboxContainer].forEach(
					container => container?.classList.remove('w3-hide')
				);

				return block;
			})
		);

		// Append all blocks to fragment
		blocks.forEach(block => fragment.appendChild(block));
		return Array.from(fragment.children);

	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error auto-filling the horse list.',
			displayTarget: 'form-msg',
		});

		// Disable submit button and clear cache on error
		document.getElementById('submit-button').disabled = true;
		optionsCache.clear();
		return [];
	}
}

// Clear cache when module is unloaded
window.addEventListener('unload', () => optionsCache.clear());