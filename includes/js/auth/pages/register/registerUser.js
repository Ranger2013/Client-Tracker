import { addListener } from "../../../core/utils/dom/listeners.js";
import { ucwords } from "../../../core/utils/string/stringUtils.js";
import { clearMsg, safeDisplayMessage } from "../../../core/utils/dom/messages.js";
import { checkForDuplicate } from "../../services/duplicateCheck.js";
import { formatEmail, formatPhone } from "../../../core/utils/dom/forms/validation.js";
import { checkPasswordStrength, comparePasswords } from "../../utils/passwordValidation.js";
import { getTerms, handleUserRegistration } from "./components/registerUserHelpers.js";
import { createAdaptiveHandler } from "../../../core/utils/dom/eventUtils.js";
import { disableEnableSubmitButton } from "../../../core/utils/dom/elements.js";

/**
 * Initializes the registration form validation and event handlers
 * Primary entry point for registration functionality
 */
function initializeRegistrationForm() {
    // Setup name fields (no delay needed - instant feedback)
    ['first-name', 'last-name', 'company-name'].forEach(id => {
        addListener({
            element: id,
            event: 'input',
            handler: evt => evt.target.value = ucwords(evt.target.value)
        });
    });

    // Setup fields requiring validation with adaptive handlers
    const validatedFields = [
        {
            id: 'email',
            type: 'email',
            format: 'email',
            inputType: 'validation' // Used by getOptimalDelay
        },
        {
            id: 'phone',
            type: 'phone',
            format: 'phone',
            inputType: 'validation'
        },
        {
            id: 'username',
            type: 'username',
            inputType: 'validation'
        }
    ];

    validatedFields.forEach(({ id, type, inputType, format }) => {
        // Clear errors on focus
        addListener({
            element: id,
            event: 'focus',
            handler: evt => clearMsg({ container: `${id}-error`, input: evt.target })
        });

        // Add adaptive validation handler for phone, email, and username
        addListener({
            element: id,
            event: 'input', // Using 'input' instead of 'blur' to track typing patterns
            handler: createAdaptiveHandler(async (evt) => {

                if (format) {
                    // Format phone number/email if necessary
                    const formattedFields = await handleFormatting({ target: evt.target, format });
                    if (!formattedFields) return;
                }

                const response = await checkForDuplicate({ value: evt.target.value, type, userType: 'users' });
                if (response.status === 'duplicate') {
                    await handleValidationResponse({ response: response.msg, errorEle: `${evt.target.id}-error`, inputEle: evt.target });
                }
                else if (response.status === 'ok') {
                    clearMsg({ container: `${evt.target.id}-error`, input: evt.target });
                }

                disableEnableSubmitButton('submit-button');
            }, inputType)
        });
    });

    // Password validation with adaptive timing
    addListener({
        element: 'password',
        event: 'input',
        handler: createAdaptiveHandler(async (evt) =>
            await checkPasswordStrength(evt, 'password-strength-container', 'password-error', 'submit-button'),
            'validation'
        )
    });

    addListener({
        element: 'confirm-password',
        event: 'input',
        handler: createAdaptiveHandler(async (evt) =>
            await comparePasswords(evt, 'password', 'confirm-password-error', 'submit-button'),
            'validation'
        )
    });

    // Terms and form submission (no delay needed)
    ['terms', 'privacy'].forEach(id =>
        addListener({ element: id, event: 'click', handler: () => getTerms(id) }));

    addListener({
        element: 'new-user-form',
        event: 'submit',
        handler: handleUserRegistration
    });
}

async function handleValidationResponse({ response, errorEle, inputEle }) {
    try {
        // Invalid formatting
        if (response) {
            safeDisplayMessage({
                elementId: errorEle,
                message: response,
                targetId: inputEle,
            });

            disableEnableSubmitButton('submit-button');
            return null;
        }
        return true;
    }
    catch (err) { }
}

async function handleFormatting({ target, format }) {
    try {
        if (format === 'phone') {
            const formattedPhone = formatPhone(target.value);
            if (!formattedPhone) {
                await handleValidationResponse({ response: `Invalid ${format} format.`, errorEle: `${target.id}-error`, inputEle: target });
                return false;
            };

            target.value = formattedPhone;
            clearMsg({ container: `${target.id}-error`, input: target });
            return true;
        }
        else if (format === 'email') {
            const formattedEmail = formatEmail(target.value);

            if (!formattedEmail) {
                await handleValidationResponse({ response: `Invalid ${format} format.`, errorEle: `${target.id}-error`, inputEle: target });
                return false;
            };
            clearMsg({ container: `${target.id}-error`, input: target });
            return true;
        }
    }
    catch (err) { }
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', initializeRegistrationForm);

