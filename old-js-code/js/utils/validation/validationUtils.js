import { clearMsg, disableEnableSubmitButton, myError } from "../../../../includes/js/core/utils/dom/domUtils.js";
import { fetchData } from "../network/network.js";
import { checkForDuplicatesAPI } from "../network/apiEndpoints.js";
import { underscoreToHyphen, underscoreToHyphenPlusError } from "../string/stringUtils.js";

// DOM Elements
const fm = document.getElementById('form-msg');
const submitButton = document.getElementById('submit-button');

/**
 * Checks for duplicate phone numbers by sending a request to the server.
 * 
 * @param {Event} evt - The event object from the input field.
 * @param {HTMLElement} errorEle - The element to display the error messages.
 */
export async function checkForDuplicate(evt, errorEle, type, userType) {
	try {
		// Set up the server params
		const serverParams = {
			value: evt.target.value, // The email, phone or username value
			column: type, // The column that is used on the db, email, phone or username
			userType: userType, // Are we looking at the users table or the clients table
		};

		// Send request to the server
		const data = await fetchData({ api: checkForDuplicatesAPI, data: serverParams });

		// Get server returned status
		if (data.status === 'ok') {
			// Clear any previous error messages
			clearMsg({ container: errorEle, hide: true, input: evt.target });
			// Enable the submit button
			disableEnableSubmitButton(submitButton);
		}
		// There was a duplicate, show error message
		else if (data.status === 'duplicate') {
			myError(errorEle, data.msg, evt.target);
			// Disable the submit button
			disableEnableSubmitButton(submitButton);
		}
		else if (data.status === 'unexpected-error' || data.status === 'server-error') {
			myError(fm, data.msg);
			// Disable the submit button
			disableEnableSubmitButton(submitButton);
		}
	}
	catch (err) {
		console.warn(err);
	}
}

export function formatPhone(evt, errorEle) {
	let cleaned = ('' + evt.target.value).replace(/\D/g, '');
	let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

	if (match) {
		let pn = match[1] + '-' + match[2] + '-' + match[3];
		evt.target.value = pn;
		clearMsg({ container: errorEle, hide: true })
		// Enable the submit button
		disableEnableSubmitButton(submitButton);
	}
	else {
		myError(errorEle, 'Please use the correct format.');
		// Disable the submit button
		disableEnableSubmitButton(submitButton);
	}
}

/**
 * Compares the password and confirm password fields for equality.
 *
 * @param {Event} evt - The event object from the input field.
 * @param {string} passwordFieldId - The ID of the password field.
 * @param {HTMLElement} errorContainer - The container to display error messages.
 * @param {HTMLElement|string} submitButton - The submit button element or its ID to disable/enable based on errors.
 */
export async function comparePasswords(evt, passwordFieldId, errorContainer, submitButton) {
	const pass = document.getElementById(passwordFieldId).value;
	const compPass = evt.target.value;
	const compPassError = errorContainer;

	if (pass !== compPass) {
		// Show the error message
		myError(compPassError, 'Passwords do not match');
		// Disable the submit button
		disableEnableSubmitButton(submitButton);
	} else {
		// Clear the error message
		clearMsg({ container: compPassError, hide: true });
		// Enable the submit button
		disableEnableSubmitButton(submitButton);
	}
}

/**
 * Checks the strength of a password and updates the strength badge.
 *
 * @param {Event} evt - The event object from the input field.
 * @param {HTMLElement} strengthBadge - The container to display the password strength badge.
 * @param {HTMLElement} confirmPassContainer - The container for the confirm password field.
 * @param {HTMLElement} errorContainer - The container to display error messages.
 * @param {HTMLElement|string} submitButton - The submit button element or its ID to disable/enable based on errors.
 */
export async function checkPasswordStrength(evt, strengthBadge, errorContainer, submitButton) {
	const value = evt.target.value;

	const strongPassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\W])(?=.{8,})/;
	const mediumPassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.{8,})/;

	clearMsg({ container: errorContainer, hide: true });
	clearMsg({ container: strengthBadge, hide: true });

	if (value === '') return false;

	const badgeText = (innerHTML, className) => {
		strengthBadge.innerHTML = `<div class="${className} w3-padding-small w3-center">${innerHTML}</div>`;
		strengthBadge.classList.remove('w3-hide');
	};

	if (value.length < 8) {
		badgeText('Passwords must be at least 8 characters', 'w3-yellow error');
		disableEnableSubmitButton(submitButton);
		return false;
	}

	if (strongPassword.test(value)) {
		badgeText('Strong', 'w3-green');
		disableEnableSubmitButton(submitButton);
		return true;
	} else if (mediumPassword.test(value)) {
		badgeText('Medium', 'w3-blue');
		disableEnableSubmitButton(submitButton);
		return true;
	} else {
		badgeText('Please make a stronger password using Upper case, Lower case, numbers and special characters', 'w3-red error');
		disableEnableSubmitButton(submitButton);
		return false;
	}
}

/**
 * Loop through the errors array and add the error messages to the specified fields
 * 
 * @param {Array} errors An array of objects
 */
export function handleFormValidationErrors(errors) {
	try {
		// Errors should be an array of objects
		for(const error in errors){
			const errorContainer = document.getElementById(underscoreToHyphenPlusError(error));
			const inputContainer = document.getElementById(underscoreToHyphen(error));

			myError(errorContainer, errors[error], inputContainer);
		}
	}
	catch (err) {
		console.warn('Handle form validation errors Error: ', err);
	}
}

/**
 * Checks if a given value is numeric with up to two decimal places.
 * Allows for an optional empty string based on the `allowEmpty` parameter.
 *
 * @param {string} num - The value to check.
 * @param {boolean} [allowEmpty=false] - Whether to allow empty strings.
 * @return {boolean} - Returns true if the value is numeric (with up to two decimal places) or an allowed empty string.
 */
export function isNumeric(num, allowEmpty = false) {
	// Regex to check for numeric values with up to two decimal places or spaces (used when allowEmpty is true)
	const regexAllowEmpty = /^(?:\d+|\d*\.\d{1,2}|\s*)$/;
	
	// Regex to check for numeric values with up to two decimal places (no spaces allowed, used when allowEmpty is false)
	const regexNoEmpty = /^(?:\d+|\d*\.\d{1,2})$/;

	// Use the appropriate regex based on the allowEmpty parameter
	return allowEmpty ? regexAllowEmpty.test(num) : regexNoEmpty.test(num);
}

/**
 * Validates a mileage range input.
 * @param {string} input - The mileage range input string to validate (e.g., "50-59+" or "71-80").
 * @returns {boolean} - Returns true if the input is valid, otherwise false.
 */
export function validateRange(input) {
	const pattern = /(\d{1,})-(\d{1,})\+?/;
	const match = input.match(pattern);
	
	if (!match) {
		 // Input does not match the pattern
		 return false;
	}
	
	// Extract the first and second numbers from the matched groups
	const start = parseInt(match[1], 10); // Parse with radix 10
	const end = parseInt(match[2], 10);   // Parse with radix 10
	
	// Ensure the first number is smaller than the second number
	if (start >= end) {
		 return false;
	}

	// Input is valid if it matches the pattern and start < end
	return true;
}

/**
 * Ensure the input is a valid date in the format 'YYYY-MM-DD'.
 * @param {String} date - The date to validate
 * @returns {Boolean} - Returns true if the date is valid, otherwise false
 */
export function validateDate(date) {
	const pattern = /^\d{4}-\d{2}-\d{2}$/;
	return pattern.test(date);
}