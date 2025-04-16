import { checkForDuplicate } from '../../../../../../../../auth/services/duplicateCheck.js';
import { disableEnableSubmitButton, getValidElement } from '../../../../../../../../core/utils/dom/elements.js';
import displayFormValidationErrors from '../../../../../../../../core/utils/dom/forms/displayFormValidationErrors.js';
import { clearMsg, safeDisplayMessage } from '../../../../../../../../core/utils/dom/messages.js';
import { top } from '../../../../../../../../core/utils/window/scroll.js';

// Set up debug mode
const COMPONENT = "Account Settings Form Submission";
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function handleAccountSettingsFormSubmission({ evt, manageUser }) {
	try {
		top();
		// Show the processing message
		safeDisplayMessage({
			elementId: 'account-msg',
			message: 'Processing...',
			isSuccess: true,
			color: 'w3-text-blue'
		});

		const userData = Object.fromEntries(new FormData(evt.target));
		debugLog('Form Data: ', userData);

		const isValid = await handleFormValidation({ userData, manageUser });
		debugLog('Is Valid Form: ', isValid);
		if (!isValid) return;

		// If validation passes, proceed with submission
		const response = await handleFormSubmission(userData);
		debugLog('Form Submission Response: ', response);

		await handleServerResponse({ formEle: evt.target, response });
	}
	catch (err) {
		const { AppError } = await import("../../../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});
	}
}

async function handleFormSubmission(userData) {
	const [{ authAPI }, { fetchData }, { getValidationToken }] = await Promise.all([
		import('../../../../../../../../core/network/api/apiEndpoints.js'),
		import('../../../../../../../../core/network/services/network.js'),
		import('../../../../../../../../tracker.js'),
	]);

	const params = {
		key: 'update_user_credentials',
		data: userData,
	};
	return await fetchData({
		api: authAPI.updateUserCredentials,
		data: params,
		token: getValidationToken(),
	});
}

// Handle form validation
async function handleFormValidation({ userData, manageUser }) {
	const errors = await validateForm({ userData, manageUser });
	debugLog('Validation Errors: ', errors);

	// Check if we have a password lockout error
	const lockoutError = errors.find(err => err && err.lockout === true);
	if (lockoutError) {
		top();
		clearMsg({ container: 'account-msg', hide: true });

		displayLockoutErrorMsg(lockoutError.msg);

		disableEnableSubmitButton('submit-button');
		return false;
	}

	if (errors.length > 0) {
		top();
		clearMsg({ container: 'account-msg', hide: true });

		const { default: displayFormValidationErrors } = await import("../../../../../../../../core/utils/dom/forms/displayFormValidationErrors.js");
		await displayFormValidationErrors(errors);

		disableEnableSubmitButton('submit-button');

		return false;
	}

	return true;
}

async function validateForm({ userData, manageUser }) {
	try {
		const errors = [];

		// Validation functions map - only processes fields that exist in userData
		const validations = {
			username: async (value) => {
				// Ensure username is not empty
				if (!value.trim()) {
					return { input: 'username', msg: 'Username is required' };
				}

				// Make sure we do not have a duplicate username
				const response = await checkForDuplicate({
					value,
					column: 'username',
					table: 'users',
					shouldValidate: true
				});

				if (response.status === 'duplicate') {
					return { input: 'username', msg: response.msg };
				}

				return true;
			},
			current_password: async (value) => {
				// Make sure the new password is not empty
				if ('new_password' in userData && !value.trim()) {
					return { input: 'current_password', msg: 'Current password is required when changing password' };
				}

				if (value) {
					let msg = '';

					// Verify current password
					const verification = await manageUser.verifyPassword(value);
					debugLog('Password verification result:', verification);

					// Show attempts remaining
					if (verification.status === 'failed') {
						msg += `${verification.msg}<br>Attempts Remaining: ${verification.attemptsRemaining}`;
						return { input: 'current_password', msg };
					}

					// Lock out the password inputs
					if (verification.status === 'locked') {
						return { input: 'current_password', msg: verification.msg, lockout: true };
					}
				}

				return true;
			},
			new_password: async (value, allData) => {
				// Ensure there is a current password and it is not empty
				if ('current_password' in userData && !value.trim()) {
					return { input: 'new_password', msg: 'New password is required when changing password' };
				}

				// Password strength check
				const { checkPasswordStrength } = await import('../../../../../../../../auth/utils/passwordValidation.js');
				const validation = await checkPasswordStrength({
					evt: { target: { value } },
					strengthBadge: 'strength-container',
					errorContainer: 'new-password-error',
					submitButton: 'submit-button'
				});
				return true;
			},
			confirm_password: (value, allData) => {
				// Ensure that new password and confirm password match
				if (allData.new_password && value !== allData.new_password) {
					return { input: 'confirm_password', msg: 'Passwords do not match' };
				}
				return true;
			},
			phone: async (value) => {
				// Phone is required
				if (!value) return { input: 'phone', msg: 'Phone number is required' };

				// Format the phone
				const { formatPhone } = await import('../../../../../../../../core/utils/dom/forms/validation.js');
				const formattedValue = formatPhone(value);

				// If it can't format, return an error
				if (!formattedValue) {
					return { input: 'phone', msg: 'Invalid phone format' };
				}

				// Check for duplicate
				const { checkForDuplicate } = await import('../../../../../../../../auth/services/duplicateCheck.js');
				const response = await checkForDuplicate({
					value: formattedValue,
					column: 'phone',
					table: 'users',
					shouldValidate: true
				});

				if (response.status === 'duplicate') {
					return { input: 'phone', msg: response.msg };
				}

				// Update to formatted value
				userData.phone = formattedValue;
				return true;
			},
			email: async (value) => {
				if (!value) return { input: 'email', msg: 'Email is required' };

				// Email format validation
				const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (!value.match(emailPattern)) {
					return { input: 'email', msg: 'Invalid email format' };
				}

				// Check for duplicate
				const { checkForDuplicate } = await import('../../../../../../../../auth/services/duplicateCheck.js');
				const response = await checkForDuplicate({
					value,
					column: 'email',
					table: 'users',
					shouldValidate: true
				});

				if (response.status === 'duplicate') {
					return { input: 'email', msg: response.msg };
				}

				return true;
			}
		};

		// Only validate fields that are actually in the form data
		for (const [field, value] of Object.entries(userData)) {
			if (validations[field]) {
				debugLog(`Validating field: ${field} with value: ${value}`);
				const result = await validations[field](value, userData);
				if (result !== true) {
					errors.push(result);
				}
			}
		}

		return errors;
	}
	catch (err) {
		const { AppError } = await import("../../../../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
			displayTarget: 'form-msg',
		}, true);
	}
}

function displayLockoutErrorMsg(msg) {
	const passwordInputContainer = getValidElement('password-input-container');
	// This same html structure is in the buildAccountSettingsPage.js file
	passwordInputContainer.innerHTML = `
	<div class="w3-panel w3-pale-red w3-leftbar w3-border-red">
		 <p>${msg}</p>
		 <p>Please use the "Forgot Password" option or contact support for assistance.</p>
		 <div class="w3-padding-small">
		 	<a id="reset-password" href="#" title="Reset Password" class="w3-button w3-small w3-blue">Reset Password</a>
		 </div>
	</div>
`;
}

async function handleServerResponse({ formEle, response }) {
	if (response.status === 'server-error' || response.status === 'error') {
		safeDisplayMessage({
			elementId: 'form-msg',
			message: response.msg,
		});

		clearMsg({ container: 'account-msg', hide: true });
		disableEnableSubmitButton('submit-button');
	}
	else if (response.status === 'validation-error') {
		await displayFormValidationErrors(response.errors, {displayTarget: 'account-msg'});
		disableEnableSubmitButton('submit-button');
	}
	else if (response.status === 'success') {
		clearMsg({ container: 'form-msg', hide: true });
		safeDisplayMessage({
			elementId: 'account-msg',
			message: response.msg,
			isSuccess: true,
		});

		// Hide all form sections
		hideAllFormSections();
	}
	else {
		console.log('Unknown response status:', response.status);
	}
}

function hideAllFormSections() {
	const allFormSections = document.querySelectorAll('[id$="-input-container"]');
	allFormSections.forEach(section => {
		console.log('Section: ', section);
		if (!section.classList.contains('w3-hide')) {
			section.classList.add('w3-hide');
		}
	});

	const submitContainer = getValidElement('submit-container');
	submitContainer.classList.add('w3-hide');
}