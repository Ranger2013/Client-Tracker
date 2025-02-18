
import { isNumeric } from "../../../utils/validation/validationUtils.js";
import ManageFuelCharges from "../../../classes/ManageFuelCharges.js";
import { myError, mySuccess } from "../../../utils/dom/domUtils.js";

export default async function handlePerMileFormSubmission(evt){
	evt.preventDefault();

	try{
		// DOM Elements
		const fm = document.getElementById('form-msg');

		const userData = Object.fromEntries(new FormData(evt.target));

		// Validate the two form entries
		if(!isNumeric(userData.starting_mile) || !isNumeric(userData.cost_per_mile)){
			myError(fm, 'All values must be numeric.');
			return;
		}

		const manageFuelCharges = new ManageFuelCharges();

		if(manageFuelCharges.addFuelChargesByMile(userData)){
			mySuccess(fm, 'Fuel Charges have been added.');
			return;
		}
		else {
			myError(fm, 'Unable to add fuel charges.<br>Please submit a new Help Desk Ticket for this issue.');
			return;
		}
	}
	catch(err){
		console.warn('Handle per mile form submission error: ', err);
	}
}