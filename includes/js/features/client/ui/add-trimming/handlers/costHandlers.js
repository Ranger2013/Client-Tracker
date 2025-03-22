import calculateTotalCost from '../components/calculateTotalCost.min.js';

const COMPONENT = 'costHandlers';
const DEBUG = false;

const debugLog = (...args) => {
	if(DEBUG){
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Shows or hides the accessories select box based on service type
 * @async
 * @param {Object} params - The parameters object
 * @param {Event} params.evt - The change event from the service-cost select
 * @param {string|number} params.index - The index suffix of the related elements
 * @throws {AppError} When elements cannot be found or toggled
 */
export async function handleShowingAccessoriesSelectBox({ evt, index }) {
	try {
		// Show the accessories container if the service is not a trim
		const container = document.getElementById(`accessories-container-${index}`);
		const accSelect = document.getElementById(`accessories-${index}`);
		container.classList.toggle('w3-hide', evt.target.value.includes('trim'));

		// Disable the accessories select if the service is a trim
		accSelect.disabled = evt.target.value.includes('trim');
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error trying to display the accessories.'
		});
	}
}

/**
 * Updates the cost change input value based on service selection
 * @async
 * @param {Object} params - The parameters object
 * @param {Event} params.evt - The change event from the service-cost select
 * @param {string|number} params.index - The index suffix of the related elements
 * @throws {AppError} When elements cannot be found or updated
 */
export async function updateCostChangeInput({ evt, index }) {
	try {
		debugLog('Updating cost change input: evt.target: ', evt.target);
		// Event target is the service-cost-x select element
		const serviceCostSelect = evt.target;
		const selectedOptionValue = serviceCostSelect.options[serviceCostSelect.selectedIndex].value.split(':')[1];
		debugLog('selectedOptionValue: ', selectedOptionValue);
		const costChangeInput = document.getElementById(`cost-change-${index}`);
		debugLog('costChangeInput: ', costChangeInput);
		costChangeInput.value = selectedOptionValue;
		debugLog('costChangeInput.value: ', costChangeInput.value);
		debugLog('final cost change input: ', costChangeInput);
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error trying to update the change service cost.'
		});
	}
}

/**
 * Shows/hides and enables/disables the cost change input based on checkbox state
 * @async
 * @param {Object} params - The parameters object
 * @param {Event} params.evt - The change event from the checkbox
 * @param {string|number} params.index - The index suffix of the related elements
 * @throws {AppError} When elements cannot be found or toggled
 */
export async function handleShowingCostChangeInput({ evt, index }) {
	try {
		const container = document.getElementById(`change-cost-container-${index}`);
		const costChangeInput = document.getElementById(`cost-change-${index}`);
		container.classList.toggle('w3-hide', !evt.target.checked);

		// Disable the change cost input if the checkbox is not checked
		costChangeInput.disabled = !evt.target.checked;
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error trying to display change service cost input.'
		});
	}
}

/**
 * Updates the service cost select element's value based on manual cost input
 * @async
 * @param {Object} params - The parameters object
 * @param {Event} params.evt - The input event from the cost-change input
 * @param {string|number} params.index - The index suffix of the related elements
 * @throws {AppError} When elements cannot be found or updated
 */
export async function updateServiceCostSelectedIndex({ evt, index }) {
	try {
		debugLog('Updating service cost selected index: evt.target: ', evt.target);
		// Event target is the cost-change-x input element
		const costChangeInput = evt.target;
		const serviceCostSelect = document.getElementById(`service-cost-${index}`);

		// Get the selected index from the service cost select element
		const selectIndex = serviceCostSelect[serviceCostSelect.selectedIndex]
		const selectIndexValue = selectIndex.value.split(':')[0];
		const newCostValue = `${selectIndexValue}:${costChangeInput.value}`;

		selectIndex.value = newCostValue;
		await calculateTotalCost();
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error trying to update the service cost selected index.'
		});
	}
}
