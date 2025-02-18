import ManageUserMileage from "../../../../classes/ManageUserMileage.js";
import { mySuccess } from "../../../../utils/dom/domUtils.js";

/**
* Handles mileage form submission and validation
* 
* @param {Event} evt - Form submission event
* @returns {Promise<Object>} Response object with status and message
* @throws Will throw an error if form submission fails
*/
export default async function handleMileageFormSubmission(evt){
	try{
		const userData = Object.fromEntries(new FormData(evt.target));

		const validate = validateMileageData(userData);
		if(validate.status === 'validation-error') return validate;

		// Get the mileage class
		const manageMileage = new ManageUserMileage();

		const mileageStructure = manageMileage.setMileageStructure(userData);

		const response = await manageMileage.addUserMileage(mileageStructure);
		return response;
	} 
	catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('handleMileageFormSubmissionError', 'Handle mileage form submission error: ', err);
	}
}

/**
 * Validates mileage form data
 * 
 * @param {Object} userData - Form data from FormData object
 * @param {string} userData.destination - Destination location
 * @param {string} userData.starting_miles - Starting mileage value
 * @param {string} userData.ending_miles - Ending mileage value
 * @returns {Object} Validation result with status and message/data
 */
function validateMileageData(userData) {
	if (!userData.destination || userData.destination === 'null' || userData.destination === '') {
		 return { status: 'validation-error', msg: 'Please enter a destination.' };
	}

	const startMiles = parseInt(userData.starting_miles || '0', 10);
	const endMiles = parseInt(userData.ending_miles || '0', 10);

	if (isNaN(startMiles) || isNaN(endMiles)) {
		 return { status: 'validation-error', msg: 'Please enter a valid mileage.' };
	}

	if (endMiles <= startMiles) {
		 return { status: 'validation-error', msg: 'Ending mileage must be greater than starting mileage.' };
	}

	return { 
		 status: 'success', 
		 data: { startMiles, endMiles }
	};
}
