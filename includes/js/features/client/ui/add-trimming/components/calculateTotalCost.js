// Setup debug mode
const COMPONENT = 'Calculate Total Cost';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Calculates the total cost including service costs, accessory costs, and mileage costs.
 * Updates the payment input field with the calculated total cost.
 * 
 * @returns {Promise<void>} - A promise that resolves when the total cost is calculated and updated.
 */
export default async function calculateTotalCost() {
	try {
		debugLog('Calculating the total cost...');
		// DOM Elements
		const paymentInput = document.getElementById('payment');
		const serviceCostSelectElements = document.querySelectorAll('select[id^="service-cost-"]');
		const accessoriesCostSelectElements = document.querySelectorAll('select[id^="accessories-"]');
		const mileageChargesElement = document.getElementById('mileage-charges');

		// Calculate the total service cost
		const paymentTotal = Array.from(serviceCostSelectElements).reduce((total, { value }) => {
			const cost = parseFloat(value.split(':')[1]);
			return total + (!isNaN(cost) ? cost : 0);
		}, 0);
		debugLog('Service Cost Total:', paymentTotal);

		// Get the accessory options if the user selects multiple, but only if it is not disabled
		const accessoryOptions = Array.from(accessoriesCostSelectElements)
			.filter(({ disabled }) => !disabled)
			.flatMap(({ selectedOptions }) => Array.from(selectedOptions)
				.map(({ value }) => value));
		debugLog('Accessory Options:', accessoryOptions);

		// Calculate the total accessory cost
		const accessoriesTotal = accessoryOptions.reduce((total, accessory) => {
			const cost = parseInt(accessory.split(':')[2], 10);
			return total + (Number.isInteger(cost) ? cost : 0);
		}, 0);
		debugLog('Accessories Total:', accessoriesTotal);

		// Add the mileage cost if the mileage cost is not disabled
		const mileageTotal = mileageChargesElement && !mileageChargesElement.disabled 
		? parseInt(mileageChargesElement.value, 10) || 0 
		: 0;

		debugLog('Mileage Total:', mileageTotal);
		// Calculate the grand total
		const grandTotal = paymentTotal + accessoriesTotal + mileageTotal;
		debugLog('Grand Total:', grandTotal);
		
		// Update the payment input with the grand total
		paymentInput.value = grandTotal;
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'We encountered an error while calculating the total cost. You can enter it manually.',
		});
	}
}