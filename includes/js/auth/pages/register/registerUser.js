import { clearMsg } from "../../../../../old-js-code/js/utils/dom/domUtils.js";
import { addListener } from "../../../../../old-js-code/js/utils/event-listeners/listeners.js";
import { ucwords } from "../../../../../old-js-code/js/utils/string/stringUtils.js";
import { checkForDuplicate, checkPasswordStrength, comparePasswords, formatPhone } from "../../../../../old-js-code/js/utils/validation/validationUtils.js";
import { handleUserRegistration, getTerms } from "./components/registerUserHelpers.js";

// Select all the DOM elements that have a -error in the id
const errorElements = document.querySelectorAll('[id$="-error"]');
const submitButton = document.getElementById('submit-button');

// Create the error element object map to store the elements with their full id's
const errorElementMap = {};

errorElements.forEach(element => {
	errorElementMap[element.id] = element;
});

// DOM Elements Object to set all the event listeners
const DomElements = {
	'first-name': [
		{
			type: 'input',
			listener: function () { this.value = ucwords(this.value); }
		},
	],
	'last-name': [
		{
			type: 'input',
			listener: function () { this.value = ucwords(this.value); },
		}
	],
	'phone': [
		{
			type: 'blur',
			listener: (evt) => checkForDuplicate(evt, errorElementMap['phone-error'], 'phone', 'users'),
		},
		{
			type: 'input',
			listener: (evt) => formatPhone(evt, errorElementMap['phone-error']),
		},
		{
			type: 'focus',
			listener: function () { clearMsg({ container: errorElementMap['phone-error'], input: this }); },
		},
	],
	'email': [
		{
			type: 'blur',
			listener: (evt) => checkForDuplicate(evt, errorElementMap['email-error'], 'email', 'users'),
		},
		{
			type: 'focus',
			listener: function () { clearMsg({ container: errorElementMap['email-error'], input: this }); },
		},
	],
	'username': [
		{
			type: 'blur',
			listener: (evt) => checkForDuplicate(evt, errorElementMap['username-error'], 'username', 'users'),
		},
		{
			type: 'focus',
			listener: function () { clearMsg({ container: errorElementMap['username-error'], input: this }); }
		},
	],
	'password': [
		{
			type: 'input',
			listener: (evt) => checkPasswordStrength(evt, document.getElementById('password-strength-container'), document.getElementById('password-error'), submitButton),
		},
		{
			type: 'focus',
			listener: (evt) => clearMsg({container: document.getElementById('password-error'), hide: true, input: document.getElementById('password')}),
		},
	],
	'confirm-password': [
		{
			type: 'input',
			listener: (evt) => comparePasswords(evt, 'password', document.getElementById('confirm-password-error'), submitButton ),
		},
		{
			type: 'focus',
			listener: (evt) => clearMsg({container: document.getElementById('confirm-password-error'), hide: true, input: document.getElementById('confirm-password')}),
		}
	],
	'terms': [
		{
			type: 'click',
			listener: () => getTerms('terms'),
		}
	],
	'privacy': [
		{
			type: 'click',
			listener: () => getTerms('privacy'),
		}
	],
	'new-user-form': [
		{
			type: 'submit',
			listener: handleUserRegistration,
		}
	],
};

// Set up the event listeners by iterating through the keys
Object.keys(DomElements).forEach(key => {
	// Loop through each of the array elements of the key
	DomElements[key].forEach(({ element, type, listener }) => {
		// If we have an element that is different from the key, we will use it. Otherwise default to using the key to get the DOM element
		const targetElement = element || document.getElementById(key);
		if (targetElement) addListener(targetElement, type, listener);
	});
});

