
import ManageUser from "../../../../classes/ManageUser.js";
import buildSubmitButtonSection from "../../../../../../../../old-js-code/js/utils/page-builders/helpers/buildSubmitButtonSection.js";

export default async function buildByMileSection(buttonContainer) {
	try {
		// DOM Elements
		const startFromInput = document.getElementById('start-from-mile-input');
		const costInput = document.getElementById('cost-per-mile-input');
		const buttonSection = document.getElementById('button-section');

		if(buttonSection){
			// Remove the button section
			buttonSection.remove();
		}

		// Classes
		const manageUser = new ManageUser();

		// Get the mileage_charges
		const mileageCharges = await manageUser.getMileageCharges();
		
		if(mileageCharges?.cost_per_mile != null){
			costInput.value = mileageCharges.cost_per_mile;
		}

		if(mileageCharges?.starting_mile != null){
			startFromInput.value = mileageCharges.starting_mile;
		}
		
		// Build the submit button section
		const button = await buildSubmitButtonSection('Add Fuel Charges');
		buttonContainer.appendChild(button);
	}
	catch (err) {
		console.warn('build by mile section error: ', err);
	}
}