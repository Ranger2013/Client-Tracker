import { safeDisplayMessage } from "../../../../../../core/utils/dom/messages.js";
import { isNumeric } from "../../../../../../core/utils/validation/validators.js";
import { top } from "../../../../../../core/utils/window/scroll.js";

export default async function handlePerMileFormSubmission({ evt, manageUser }) {
	evt.preventDefault();

	try {
		const byMileContainer = document.getElementById('by-mile-container'); // Used to hide the section
		const userData = Object.fromEntries(new FormData(evt.target));

		// Validate form inputs
		const errors = validateForm(userData);

		if (errors.length > 0) {
			const { default: displayFormValidationErrors } = await import("../../../../../../core/utils/dom/forms/displayFormValidationErrors.js");
			await displayFormValidationErrors(errors);
			return;
		}

		const { addFuelCharges } = await import("./manageFuelCharges.js");
		const manageFuelCharges = await addFuelCharges({ userData, formType: 'mile', manageUser });

		if (manageFuelCharges) {
			safeDisplayMessage({
				elementId: 'form-msg',
				message: 'Fuel Charges have been added',
				isSuccess: true,
			});
			evt.target.reset();
			byMileContainer.classList.add('w3-hide');
			top();
		}
		else {
			throw new Error('Failed to add fuel charges');
		}
	}
	catch (err) {
		console.warn('Handle per mile form submission error: ', err);
	}
}

/**
 * Validates form inputs for the per mile form
 * Allows for the base_cost to be optional
 * 
 * @param {Object} userData - Form data
 * @param {String} userData.starting_mile - Starting mile
 * @param {String} userData.cost_per_mile - Cost per mile
 * @param {String} userData.base_cost - Base cost (optional)
 * @returns {Array} - Array of errors
 */
function validateForm(userData) {
	const errors = [];

	// Required fields must be numeric
	if (!isNumeric(userData.starting_mile)) {
		errors.push({
			input: 'starting_mile',
			msg: 'Starting mile must be numeric'
		});
	}

	if (!isNumeric(userData.cost_per_mile)) {
		errors.push({
			input: 'cost_per_mile',
			msg: 'Cost per mile must be numeric'
		});
	}

	// Optional field - only validate if has value
	if (userData.base_cost !== '' && !isNumeric(userData.base_cost)) {
		errors.push({
			input: 'base_cost',
			msg: 'Base cost must be numeric if provided'
		});
	}

	return errors;
}