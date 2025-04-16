// import { addListener } from "../../../core/utils/dom/listeners.js";
// import { ucwords } from "../../../core/utils/string/stringUtils.js";
// import { clearMsg, safeDisplayMessage } from "../../../core/utils/dom/messages.js";
// import { checkForDuplicate } from "../../services/duplicateCheck.js";
// import { formatEmail, formatPhone } from "../../../core/utils/dom/forms/validation.js";
// import { checkPasswordStrength, comparePasswords } from "../../utils/passwordValidation.js";
// import { getTerms, handleUserRegistration } from "./components/registerUserHelpers.js";
import { createAdaptiveHandler } from "../../../core/utils/dom/eventUtils.js";
// import { disableEnableSubmitButton } from "../../../core/utils/dom/elements.js";

import { disableEnableSubmitButton } from '../../../core/utils/dom/elements';
import { clearMsg, safeDisplayMessage } from '../../../core/utils/dom/messages';
import { ucwords } from '../../../core/utils/string/stringUtils';
import { formatEmail, formatPhone } from '../../../core/utils/dom/forms/validation';
import { checkForDuplicate } from '../../services/duplicateCheck';
import { checkPasswordStrength, comparePasswords } from '../../utils/passwordValidation.js';
import { getTerms, handleUserRegistration } from './components/registerUserHelpers.js';
import { addListener } from '../../../core/utils/dom/listeners.js';

const COMPONENT_ID = 'register-user-form';

/**
 * Initializes the registration form validation and event handlers
 * Primary entry point for registration functionality
 */
function initializeRegistrationForm() {
    // Create the debounced handler ONCE, outside the event mapping
    const debouncedUsernameCheck = createAdaptiveHandler(async (evt) => {
        await checkFieldForDuplicate({
            field: evt.target,
            column: 'username', 
            table: 'users'
        });
    }, 'validation');

    const staticEventHandlers = {
        'focusin:first-name': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:first-name': (evt) => handleFormatting({
            target: evt.target,
            format: 'first-name',
        }),
        'focusin:last-name': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:last-name': (evt) => handleFormatting({
            target: evt.target,
            format: 'last-name',
            }),
        'focusin:company-name': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:company-name': (evt) => handleFormatting({
            target: evt.target,
            format: 'company-name',
        }),
        'focusin:phone': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:phone': async (evt) => {
            await handleFormatting({ target: evt.target, format: 'phone' });
        },
        'focusout:phone': async (evt) => {
            await checkFieldForDuplicate({
                field: evt.target,
                column: 'phone', 
                table: 'users'
            });
        },
        'focusin:email': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:email': async (evt) => {
            await handleFormatting({ target: evt.target, format: 'email' });
        },
        'focusout:email': async (evt) => {
            await checkFieldForDuplicate({
                field: evt.target,
                column: 'email', 
                table: 'users'
            });
        },
        'focusin:username': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:username': (evt) => {
            // Use the pre-created debounced handler
            debouncedUsernameCheck(evt);
        },
        'focusin:password': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:password': async (evt) => {
            // Only validate if the password field has a value
            if (evt.target.value) {
                await checkPasswordStrength({
                    evt,
                    strengthBadge: 'password-strength-container',
                    errorContainer: 'password-error',
                    submitButton: 'submit-button',
                });
            }
        },
        'focusin:confirm-password': (evt) => clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target }),
        'input:confirm-password': async (evt) => {
            // Only validate if the confirm password field has a value
            if (evt.target.value) {
                await comparePasswords({
                    evt,
                    passwordFieldId: 'password',
                    errorContainer: 'confirm-password-error',
                    submitButton: 'submit-button',
                });
            }
        },
        'click:terms': async (evt) => await getTerms('terms'),
        'click:privacy': async (evt) => await getTerms('privacy'),
        'submit:new-user-form': async (evt) => await handleUserRegistration(evt),
    };

    addListener({
        elementOrId: 'new-user-form',
        eventType: ['focusin', 'input', 'focusout', 'click', 'submit'],
        handler: (evt) => {
            const keyPath = `${evt.type}:${evt.target.id}`;

            if (staticEventHandlers[keyPath]) {
                staticEventHandlers[keyPath](evt);
            }
        },
        componentId: COMPONENT_ID,
    });

    disableEnableSubmitButton('submit-button');
}

/**
 * Helper function to check if a field value already exists in the database
 * @param {Object} params - Parameters object
 * @param {HTMLElement} params.field - The input field element
 * @param {string} params.column - The database column to check
 * @param {string} params.table - The database table to check
 * @returns {Promise<boolean>} - True if duplicate found, false otherwise
 */
async function checkFieldForDuplicate({ field, column, table }) {
    const isDuplicate = await checkForDuplicate({
        value: field.value,
        column: column,
        table: table,
    });

    if (isDuplicate.status === 'duplicate') {
        return await handleValidationResponse({
            response: isDuplicate.msg,
            errorEle: `${field.id}-error`,
            inputEle: field
        });
    }
    
    // Clear any previous error messages if no duplicate
    clearMsg({ container: `${field.id}-error`, input: field });
    return false;
}

async function handleValidationResponse({ response, errorEle, inputEle }) {
    // Invalid formatting
    if (response) {
        safeDisplayMessage({
            elementId: errorEle,
            message: response,
            targetId: inputEle,
        });

        disableEnableSubmitButton('submit-button');
        return false;
    }
    return true;
}

async function handleFormatting({ target, format }) {
    const MAPPING = {
        'first-name': {
            action: (value) => {
                const formatted = ucwords(value);
                target.value = formatted;
                return true;
            }
        },
        'last-name': {
            action: (value) => {
                const formatted = ucwords(value);
                target.value = formatted;
                return true;
            }
        },
        'company-name': {
            action: (value) => {
                const formatted = ucwords(value);
                target.value = formatted;
                return true;
            }
        },
        phone: {
            action: async (value) => {
                const formattedPhone = formatPhone(value);
                if (!formattedPhone) {
                    await handleValidationResponse({
                        response: `Invalid phone format.`,
                        errorEle: `${target.id}-error`,
                        inputEle: target,
                    });
                    return false;
                }

                target.value = formattedPhone;
                clearMsg({ container: `${target.id}-error`, input: target });
                return true;
            }
        },
        email: {
            action: async (value) => {
                const formattedEmail = formatEmail(value);
                if (!formattedEmail) {
                    await handleValidationResponse({
                        response: `Invalid email format.`,
                        errorEle: `${target.id}-error`,
                        inputEle: target,
                    });
                    return false;
                }

                target.value = formattedEmail;
                clearMsg({ container: `${target.id}-error`, input: target });
                return true;
            }
        }
    };

    // If we have a specific format, use that, otherwise try to use the target id
    const handler = format ? MAPPING[format] : MAPPING[target.id];
    
    if (handler) {
        return await handler.action(target.value);
    }
    
    // No matching handler found
    console.warn(`No formatting handler for ${format || target.id}`);
    return false;
}

initializeRegistrationForm();