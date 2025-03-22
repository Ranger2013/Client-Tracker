import { clearMsg, getValidElement, safeDisplayMessage } from '../../core/utils/dom/messages.min.js';
import { disableEnableSubmitButton } from '../../core/utils/dom/elements.min.js';
import deepFreeze from '../../core/utils/deepFreeze.min.js';

const PASSWORD_VALIDATION = deepFreeze({
	MIN_LENGTH: 8,
	PATTERNS: {
		STRONG: /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\W])(?=.{8,})/,
		MEDIUM: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.{8,})/
	},
	MESSAGES: {
		TOO_SHORT: 'Password must be at least 8 characters',
		NO_MATCH: 'Passwords do not match',
		WEAK: 'Password must contain uppercase, lowercase, numbers and special characters',
		FIELD_NOT_FOUND: 'Password field not found'
	},
	STYLES: {
		STRONG: 'w3-green',
		MEDIUM: 'w3-blue',
		WEAK: 'w3-red error',
		WARNING: 'w3-yellow error'
	},
	STRENGTH_LEVELS: [
		{
			test: value => value.length < PASSWORD_VALIDATION.MIN_LENGTH,
			message: 'Password must be at least 8 characters',
			style: 'w3-text-red error',
			isValid: false
		},
		{
			test: value => PASSWORD_VALIDATION.PATTERNS.STRONG.test(value),
			message: 'Strong',
			style: 'w3-green',
			isValid: true
		},
		{
			test: value => PASSWORD_VALIDATION.PATTERNS.MEDIUM.test(value),
			message: 'Medium',
			style: 'w3-blue',
			isValid: true
		},
		{
			test: () => true, // Default case
			message: 'Password must contain uppercase, lowercase, numbers and special characters',
			style: 'w3-text-red error',
			isValid: false
		}
	]
});

/**
 * Compares password fields for equality
 * @param {Event} evt - Input event object
 * @param {string} passwordFieldId - Original password field ID
 * @param {HTMLElement} errorContainer - Error message container
 * @param {HTMLElement|string} submitButton - Form submit button
 * @returns {Promise<boolean>} Validation result
 */
export async function comparePasswords(evt, passwordFieldId, errorContainer, submitButton) {
	try {
		const pass = document.getElementById(passwordFieldId)?.value;
		const compPass = evt.target.value;

		if (!pass) {
			throw new Error(PASSWORD_VALIDATION.MESSAGES.FIELD_NOT_FOUND);
		}

		if (pass !== compPass) {
			safeDisplayMessage({
				elementId: errorContainer,
				message: PASSWORD_VALIDATION.MESSAGES.NO_MATCH
			});
			disableEnableSubmitButton(submitButton, false);
			return false;
		}
		else {
			await clearMsg({ container: errorContainer, hide: true });
			disableEnableSubmitButton(submitButton, true);
			return true;
		}
	}
	catch (error) {
		const { AppError } = await import('../../core/errors/models/AppError.min.js');

		AppError.handleError(error, {
			errorCode: ErrorTypes.INPUT_ERROR,
			userMessage: 'Unable to validate password. Please try again.',
			displayTarget: 'form-msg',
			shouldLog: false
		})

		return false; // Ensure we return false on error
	}
}

/**
 * Checks password strength
 * @param {Event} evt - Input event object
 * @param {HTMLElement} strengthBadge - Strength indicator element
 * @param {HTMLElement} errorContainer - Error container
 * @param {HTMLElement|string} submitButton - Form submit button
 * @returns {Promise<boolean>} Strength validation result
 */
export async function checkPasswordStrength(evt, strengthBadge, errorContainer, submitButton) {
	try {
		const value = evt.target.value;

		if (!value) {
			return false;
		}

		await clearMsg({ container: errorContainer, hide: true });

		const strengthLevel = PASSWORD_VALIDATION.STRENGTH_LEVELS.find(level => level.test(value));

		await updateStrengthIndicator(errorContainer, strengthLevel.message, strengthLevel.style);
		disableEnableSubmitButton(submitButton, strengthLevel.isValid);
		return strengthLevel.isValid;
	}
	catch (error) {
		console.warn('Error in checkPasswordStrength:', error);
		const { AppError } = await import('../../core/errors/models/AppError.min.js');

		AppError.handleError(error, {
			errorCode: ErrorTypes.INPUT_ERROR,
			userMessage: 'Unable to check password strength. Please ensure your password meets the requirements.',
			displayTarget: 'form-msg',
			shouldLog: false
		});

		return false; // Ensure we return false on error
	}
}

/**
 * Updates strength indicator display
 * @private
 */
async function updateStrengthIndicator(badge, text, className) {
	try {
		const badgeEle = getValidElement(badge);
		badgeEle.innerHTML = `<div class="${className} w3-padding-small w3-center">${text}</div>`;
		badgeEle.classList.remove('w3-hide');
	}
	catch (err) {
		console.warn('Error in updateStrengthIndicator:', err);
	}
}