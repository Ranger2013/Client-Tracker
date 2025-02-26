import { clearMsg } from "../../core/utils/dom/messages.js";
import { disableEnableSubmitButton } from "../../core/utils/dom/elements.js";

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

