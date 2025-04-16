import { disableEnableSubmitButton, getValidElement } from '../../../../../../../core/utils/dom/elements.js';
import { createAdaptiveHandler } from '../../../../../../../core/utils/dom/eventUtils.js';
import { formatPhone } from '../../../../../../../core/utils/dom/forms/validation.js';
import { addListener } from '../../../../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../../../../core/utils/dom/messages.js';

// Setup debug mode
const COMPONENT = 'User Account Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function accountSettings({ tabContentContainer, componentId, manageUser }) {
	try {
		debugLog('Initializing dynamic event handlers...');

		const validateUsernameAdaptive = createAdaptiveHandler(async (evt) => {
			const { checkForDuplicate } = await import('../../../../../../../auth/services/duplicateCheck.js');
			return await checkForDuplicate({
				value: evt.target.value,
				column: 'username',
				table: 'users',
				shouldValidate: true,
			});
		}, 'validation');

		const validateEmailAdaptive = createAdaptiveHandler(async (evt) => {
			const { default: validateEmail } = await import('../../../../../../../auth/utils/emailValidation.js');
			return await validateEmail({
				evt,
				value: evt.target.value,
				column: 'email',
				table: 'users',
				shouldValidate: true,
			});
		}, 'validation');

		const validatePhoneAdaptive = createAdaptiveHandler(async (evt) => {
			const { default: validatePhone } = await import('../../../../../../../auth/utils/phoneValidation.js');
			return await validatePhone({
				evt,
				value: evt.target.value,
				column: 'phone',
				table: 'users',
				shouldValidate: true,
			});
		}, 'validation');

		// Separate handlers for each tab's content
		const accountSettingsHandlers = {
			'click:username-label': async (evt) => await toggleAccountSection({ evt, containerId: 'username-input-container' }),
			'input:username': async (evt) => {
				const response = await validateUsernameAdaptive(evt);
				handleDuplicateResponse({ response, target: evt.target });
			},
			'focusin:username': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'click:password-label': async (evt) => await toggleAccountSection({ evt, containerId: 'password-input-container' }),
			'focusin:current-password': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'input:new-password': async (evt) => {
				const { checkPasswordStrength } = await import('../../../../../../../auth/utils/passwordValidation.js');
				await checkPasswordStrength({
					evt,
					strengthBadge: 'strength-container',
					errorContainer: 'new-password-error',
					submitButton: 'submit-button',
				});
			},
			'input:confirm-password': async (evt) => {
				const { comparePasswords } = await import('../../../../../../../auth/utils/passwordValidation.js');
				const passwordFieldId = 'new-password';
				const errorContainer = 'confirm-password-error';
				const submitButton = 'submit-button';

				await comparePasswords({
					evt,
					passwordFieldId,
					errorContainer,
					submitButton,
				});
			},
			'click:reset-password': async (evt) => {
				evt.preventDefault();
				debugLog('Reset password button clicked: evt.target: ', evt.target);
				const { default: handleResetPassword } = await import("./components/handleResetPassword.js");
				await handleResetPassword({ evt, manageUser });
			},
			'click:company-label': async (evt) => await toggleAccountSection({ evt, containerId: 'company-input-container' }),
			'click:phone-label': async (evt) => await toggleAccountSection({ evt, containerId: 'phone-input-container' }),
			'input:phone': async (evt) => {
				const response = await validatePhoneAdaptive(evt);
				handleDuplicateResponse({ response, target: evt.target });
			},
			'click:email-label': async (evt) => await toggleAccountSection({ evt, containerId: 'email-input-container' }),
			'input:email': async (evt) => {
				const response = await validateEmailAdaptive(evt);
				handleDuplicateResponse({ response, target: evt.target });
			},
			'submit:account-form': async (evt) => {
				evt.preventDefault();
				// Handle account form submission
				const { default: handleAccountSettingsFormSubmission } = await import("./components/handleAccountSettingsFormSubmission.js");
				await handleAccountSettingsFormSubmission({ evt, manageUser });
			}
		};

		addListener({
			elementOrId: 'account-form',
			eventType: ['click', 'submit', 'input', 'focusin'],
			handler: async (evt) => {
				try {
					const keyPath = `${evt.type}:${evt.target.id}`;
					debugLog('KeyPath: ', keyPath);
					if (accountSettingsHandlers[keyPath]) {
						await accountSettingsHandlers[keyPath](evt);
					}
				}
				catch (err) {
					const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
					AppError.handleError(err, {
						errorCode: AppError.Types.RENDER_ERROR,
						message: AppError.BaseMessages.system.render,
					});
				}
			},
			componentId,
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}

}

// Helper function specifically for account settings tab
async function toggleAccountSection({ evt, containerId }) {
	debugLog('Event.target: ', evt.target);
	debugLog('Container ID: ', containerId);

	const container = getValidElement(containerId);
	const inputs = container.querySelectorAll('input');
	const isHidden = container.classList.contains('w3-hide');
	container.classList.toggle('w3-hide');

	inputs.forEach(input => {
		if(isHidden) {
			clearMsg({ container: `${input.id}-error`, hide: true, input });
		}
		input.disabled = !isHidden;
	});

	// Update submit button visibility
	const submitContainer = getValidElement('submit-container');
	const hasVisibleSection = document.querySelector('[id$="-input-container"]:not(.w3-hide)');
	submitContainer.classList.toggle('w3-hide', !hasVisibleSection);

	disableEnableSubmitButton('submit-button');

	clearFormMsgOnAllSectionsHidden();
}

// Helper function to handle duplicate responses
function handleDuplicateResponse({ response, target }) {
	if (response.status === 'duplicate' || response.status === 'validation-error') {
		safeDisplayMessage({
			elementId: `${target.id}-error`,
			message: response.msg,
			targetId: target,
		});
		disableEnableSubmitButton('submit-button');
	} else {
		clearMsg({ container: `${target.id}-error`, hide: true, input: target });
		disableEnableSubmitButton('submit-button');
	}
}

function clearFormMsgOnAllSectionsHidden() {
	const allFormSections = document.querySelectorAll('[id$="-input-container"]');
	const allHidden = Array.from(allFormSections).every(section => section.classList.contains('w3-hide'));
	const submitContainer = getValidElement('submit-container');

	if(allHidden) {
		clearMsg({ container: 'form-msg', hide: true });
	}
}