
import { clearMsg, myError, mySuccess, top } from "../../utils/dom/domUtils.js";
import openModal from "../../../js/utils/modal/openModal.js";
import { getTermsAPI, registerUserAPI } from "../../utils/network/apiEndpoints.js";
import { fetchData } from "../../utils/network/network.js";
import { handleFormValidationErrors } from "../../utils/validation/validationUtils.js";

/**
 * Gets either the terms of service or the privacy policy for the modal
 * @param {string} type - Get either the 'terms' or 'privacy'
 * @return {void}
 */
export async function getTerms(type) {
	// Set the params
	const params = {
		'type': type
	};

	try {
		// Send the request
		const data = await fetchData({ api: getTermsAPI, data: params });

		if (data.message) {
			openModal({ content: data.message });
		}
	}
	catch (err) {
		// handleError(`Error getting ${type} contract.`, err);
	}
}

export async function handleUserRegistration(evt) {
	evt.preventDefault();

	// Imports
	const { unexpectedErrorMsg, possibleConnectionErrorMsg } = await import("../../utils/error-messages/errorMessages.js");
	
	// DOM elements
	const formContainer = document.getElementById('form-container');
	const fm = document.getElementById('form-msg');

	// Give a message the user is registering
	mySuccess(fm, 'Registering...', 'w3-text-blue');

	// Get the user data
	const userData = Object.fromEntries(new FormData(evt.target));

	try {
		// Take user to top of page.
		top();

		// Send the data to the server
		const req = await fetchData({ api: registerUserAPI, data: userData });

		if (req.status === 'ok') {
			// Clear the registering message
			clearMsg({ container: fm });
			mySuccess(formContainer, req.msg, 'w3-text-black');
		}
		else if (req.status === 'form-errors') {
			myError(fm, req.msg);
			handleFormValidationErrors(req.errors);
		}
		else if (req.status === 'error' || req.status === 'server-error') {
			myError(fm, req.msg);
		}
		else {
			myError(fm, unexpectedErrorMsg);
		}
	}
	catch (err) {
		myError(fm, possibleConnectionErrorMsg);
	}
}