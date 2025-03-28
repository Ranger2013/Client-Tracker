// Setup debug mode
const COMPONENT = 'Update Trim Cost';
const DEBUG = true;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Updates the trim cost based on the total number of horses.
 * 
 * @param {Object} params - The parameters for the function.
 * @param {HTMLElement} params.blockElementNode - The HTML block element node.
 * @param {string} params.trimValue - The calculated trim value to set.
 * @returns {Promise<void>} - A promise that resolves when the trim cost is updated.
 */
export async function updateTrimCost({ blockElementNode, numberHorses, userFarrierPrices }) {
	try {
		const trimValue = calculateTrimValue({ totalHorses: numberHorses, farrierPrices: userFarrierPrices });
		debugLog('Trim Value:', trimValue);

		// Service cost select elements
		const selectElements = blockElementNode.querySelectorAll('select[id^="service-cost-"]');
		debugLog('Select Elements:', selectElements);

		// Loop through the select elements and update the trim value
		selectElements.forEach(select => {
			// Find the option that has trim in it
			const trimOption = Array.from(select.options).find(option => option.value.includes('trim') || option.textContent.toLowerCase().includes('trim'));
			debugLog('Trim Option:', trimOption);

			if(!trimOption) return;

			// Get the index of the select element
			const index = select.id.split('-').pop();
			debugLog('Index:', index);

			// Get the value portion of the trim option
			const trimOptionValue = trimOption.value.split(':')[1];
			debugLog('Selected Index Value:', trimOptionValue);

			// Change the cost of the service cost trim option element
				trimOption.value = trimValue;

			// Get the change cost input element
			const changeCostInput = blockElementNode.querySelector(`#cost-change-${index}`);
			debugLog('Selected Index === xxx: ', trimOptionValue);
			debugLog('Change Cost Input:', changeCostInput);
			// changeCostInput.value = trimOption === 'xxx' ? trimOption.value.split(':')[1] : trimOptionValue ;
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error updating the trim cost.',
			displayTarget: 'form-msg',
		}, true);
	}
}

/**
* Calculates the trim value based on the total number of horses.
* 
* @param {number} totalHorses - The total number of horses.
* @param {Object} farrierPrices - The farrier prices object.
* @returns {string} - The calculated trim value.
*/
export function calculateTrimValue({ totalHorses, farrierPrices }) {
	totalHorses = parseInt(totalHorses, 10);
	debugLog('Total Horses:', totalHorses);
	debugLog('Farrier Prices:', farrierPrices);
	const {
		barn_trim: barnTrim,
		triple_horse_trim: tripleTrim,
		double_horse_trim: doubleTrim,
		single_horse_trim: singleTrim
	} = farrierPrices;

	if(!singleTrim) return '';

	if (totalHorses >= 10) {
		return `trim:${barnTrim || tripleTrim || doubleTrim || singleTrim}`;
	} else if (totalHorses >= 3 && totalHorses < 10) {
		return `trim:${tripleTrim || doubleTrim || singleTrim}`;
	} else if (totalHorses === 2) {
		return `trim:${doubleTrim || singleTrim}`;
	} else if (totalHorses === 1) {
		return `trim:${singleTrim}`;
	}
	return '';
}
