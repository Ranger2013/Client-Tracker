
import ManageUser from "../../../../classes/ManageUser.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import buildMileageRangeInputs from "./buildMileageRangeInputs.js";

export default async function listenForFuelRangeInput(){
	// DOM Elements
	const rangeInput = document.getElementById('fuel-ranges'); // Input element the user inputs the number of ranges
	const fuelRangeContainer = document.getElementById('fuel-range-container'); // This will hold the ranges form
	const buttonSection = document.getElementById('button-section');

	if(buttonSection){
		buttonSection.remove();
	}

	const manageUser = new ManageUser();
	
	// Get the fuel-ranges
	const mileageCharges = await manageUser.getMileageCharges();

	addListener(rangeInput, 'input', (evt) => buildMileageRangeInputs(evt, fuelRangeContainer, mileageCharges));

	if(mileageCharges && mileageCharges.length > 0){
		rangeInput.value = mileageCharges.length;

		// Manually trigger the input event after setting the value
		const event = new Event('input', { bubbles: true, cancelable: true});
		rangeInput.dispatchEvent(event);
	}
}