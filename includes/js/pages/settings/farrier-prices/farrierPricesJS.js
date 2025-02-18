import setupBackupNotice from "../../../utils/backup-notice/backupNotice.js";
import { myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import displayMultipleInputs from "./helpers/displayMultipleInputs.js";
import makeInputsGreen from "./helpers/makeInputsGreen.js";
import populateFarrierPricesForm from "./helpers/populateFarrierPricesForm.js";
import seperateFarrierPricesFromAccessories from "./helpers/seperateFarrierPricesFromAccessories.js";

// Set the DOM elements
const fm = document.getElementById('form-msg');
const farrierPricesForm = document.getElementById('farrier-prices-form');
const submitButton = document.getElementById('submit'); 

// Set the back-up data reminder
setupBackupNotice();

await populateFarrierPricesForm(fm, farrierPricesForm);

// Make the inputs green when input loses focus
makeInputsGreen(farrierPricesForm);

// Handle the pads, packing wedges numbered inputs
displayMultipleInputs(fm, farrierPricesForm);

/**
 * Handles the submission of farrier prices by the user.
 * 
 * @async
 * @function handlePrices
 * @param {Event} evt - The event object from the form submission.
 * @throws Will throw an error if there's an issue with updating the IndexedDB store or syncing data with the server.
 * @returns {Promise<void>} Returns a promise that resolves when the function has completed.
 */
async function submitFarrierPricesForm(evt) {
	// Prevent form submission
	evt.preventDefault();

	try {
		// Clear any previous messages by showing the processing message
		mySuccess(fm, 'Processing...', 'w3-text-blue');
		top();

		// Imports
		const { default: ManageUser } = await import("../../../classes/ManageUser.js"); 
		const manageUser = new ManageUser();

		// Get the form data and convert it to a js object
		const userData = Object.fromEntries(new FormData(evt.target));

		// Set the farrier object and the accessory object. If any errors in the form, it throws an error
		const farrierPricesStructure = seperateFarrierPricesFromAccessories(userData);

		// Now we are going to add the farrier prices to the user_settings idb store
		const updatePrices = await manageUser.updateLocalUserSettings({ userData: farrierPricesStructure, settingsProperty: 'farrier_prices', backupStore: manageUser.indexed.stores.FARRIERPRICES, backupAPITag: 'add_farrierPrices' });

		if (updatePrices) {
			mySuccess(fm, 'Your pricing has been set.');
		}
	}
	catch (err) {
		if (err.isCustom) {
			myError(fm, err);
		}
		else {
			console.warn('submit farrier form error: ', err);
		}
	}
} 

// Add the event listener for the page price form
addListener(farrierPricesForm, 'submit', submitFarrierPricesForm);