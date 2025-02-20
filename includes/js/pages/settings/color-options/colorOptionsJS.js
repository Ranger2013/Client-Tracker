
import ManageUser from "../../../classes/ManageUser.js";
import setupBackupNotice from "../../../utils/backup-notice/backupNotice.js";
import displayFormValidationErrors from "../../../utils/dom/displayFormValidationErrors.js";
import { clearMsg, myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { helpDeskTicket } from "../../../utils/error-messages/errorMessages.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";

// DOM Elements
const fm = document.getElementById('form-msg');
const colorOptionsForm = document.getElementById('color-options-form');

// Set the back-up data reminder
setupBackupNotice();

async function handleColorOptionFormSubmission(evt) {
	// Prevent form submission
	evt.preventDefault();

	try{
		// Clear any messages
		clearMsg({container: fm});

		// Get the user Data
		const userData = Object.fromEntries(new FormData(evt.target));

		// Validate the colors
		const validate = validateColor(userData);

		if(validate){
			await displayFormValidationErrors(validate);
			return;
		}

		// Include the Manage user class
		const manageUser = new ManageUser();
		const stores = manageUser.getStoreNames();

		if(await manageUser.updateLocalUserSettings({
			userData,
			settingsProperty: 'color_options',
			backupStore: stores.COLOROPTIONS,
			backupAPITag: 'add_colorOptions'
		})){
			mySuccess(fm, 'Color Options have been saved');
			top();
			return;
		}
		myError(fm, `Unable to save color options at this time.<br>${helpDeskTicket}`);
		return;
	}
	catch(err){
		console.warn('Handle color options form submissin error: ', err);		
	}
}

function validateColor(userData){
	// Set the regex to validate the color
	const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

	// Set the array to handle any errors
	let errors = [];

	// Loop through the userData checking for appropriate colors
	for(let field in userData){
		// get the color
		let color = userData[field];

		// Do the check
		if(!hexColorRegex.test(color)){
			errors.push({input: field, msg: "Invalid color format."});
		}
	}

	return errors.length > 0 ? errors : null;
}

// Listen for the form submission
addListener(colorOptionsForm, 'submit', handleColorOptionFormSubmission);