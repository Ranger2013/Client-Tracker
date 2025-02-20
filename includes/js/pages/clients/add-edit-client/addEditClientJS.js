import { createDebouncedHandler, getOptimalDelay } from "../../../utils/event-listeners/eventUtils.js";
import { clearMsg, disableEnableSubmitButton, myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import checkAppointment from "../../../utils/appointment-block/checkAppointment.js";
import getAllFormIdElements from "../../../utils/dom/getAllFormIDElements.js";
import checkClientFormValidity from "../../../utils/validation/checkClientFormValidity.js";
import { helpDeskTicket } from "../../../utils/error-messages/errorMessages.js";

const COMPONENT_ID = 'add-edit-client';
const FORM_MSG = 'form-msg';
const FORM_FIELDS = [
    'client-name', 'street', 'city', 'state', 
    'zip', 'distance', 'phone', 'email', 'trim-cycle'
];

/**
 * Initializes the add/edit client functionality
 * @param {string|null} cID - Client ID for editing, null for new clients
 * @param {string|null} primaryKey - Database primary key for editing
 * @param {Object|null} clientInfo - Existing client information for editing
 * @returns {Promise<Function>} Cleanup function to remove event listeners
 */
export default async function addEditClient(cID, primaryKey, clientInfo = null) {
    try {
        const elements = await getAllFormIdElements('client-form');
        initializeAppointmentCheck(elements, clientInfo);
        setupFormValidation(cID, primaryKey, clientInfo);
        
        return () => removeListeners(COMPONENT_ID);
    } catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError(err);
    }
}

/**
 * Sets up appointment checking functionality
 * @param {Object} elements - Form elements object
 * @param {Object|null} clientInfo - Client information for existing clients
 */
function initializeAppointmentCheck(elements, clientInfo) {
    const appointmentParams = {
        trimDate: elements['trim-date'],
        trimCycle: elements['trim-cycle'],
        appBlock: elements['appointment-block'],
        projAppBlock: elements['projected-appointment-block'],
        clientInfo
    };

    checkAppointment(appointmentParams);

    // Watch trim date changes
    addListener('trim-date', 'change', 
        () => checkAppointment(appointmentParams), 
        COMPONENT_ID
    );
}

/**
 * Sets up form validation and submission handlers
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @param {Object|null} clientInfo - Client information
 */
function setupFormValidation(cID, primaryKey, clientInfo) {
    const form = document.getElementById('client-form');
    if (!form) return;

    // Delegate all input validation to form level
    addListener(form, 'input', async (evt) => {
        const field = evt.target;
        if (FORM_FIELDS.includes(field.id)) {
            const debouncedValidation = createDebouncedHandler(
                () => handleFormValidation(evt, field.id, cID, primaryKey),
                getOptimalDelay('validation')
            );
            debouncedValidation();
        }
    }, COMPONENT_ID);

    // Handle form submission
    addListener(form, 'submit', async (evt) => {
        evt.preventDefault();
        const elements = await getAllFormIdElements('client-form');
        
        if (elements['trim-cycle'].value === 'null') {
            myError('trim-cycle-error', 'Please select a trim cycle.', 'trim-cycle');
            return;
        }

        await handleFormSubmission(evt, elements, cID, primaryKey, clientInfo);
    }, COMPONENT_ID);
}

/**
 * Handles individual form field validation
 * @param {Event} evt - Input event object
 * @param {string} field - Field ID being validated
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @returns {Promise<void>}
 * @throws {Error} If validation fails
 */
async function handleFormValidation(evt, field, cID, primaryKey) {
    try {
        const error = await checkClientFormValidity({ evt, cID, primaryKey });
        const errorContainer = `${field}-error`;

        if (error) {
            myError(errorContainer, error, field);
            addListener(field, 'focus', 
                () => clearMsg({ container: errorContainer, hide: true, input: field }),
                COMPONENT_ID
            );
        } else {
            clearMsg({ container: errorContainer, hide: true, input: field });
        }

        await disableEnableSubmitButton('submit-button');
    } catch (err) {
        throw err;
    }
}

/**
 * Validates all form fields before submission
 * @param {Object} elements - Form elements object
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @returns {Promise<boolean>} True if all fields are valid, false otherwise
 */
async function validateAllFormFields(elements, cID, primaryKey) {
    let hasErrors = false;
    
    for (const fieldId of FORM_FIELDS) {
        const field = elements[fieldId];
        if (!field) continue;

        const evt = { target: field };
        const error = await checkClientFormValidity({ evt, cID, primaryKey });
        
        if (error) {
            myError(`${fieldId}-error`, error, fieldId);
            hasErrors = true;
        }
    }
    
    return !hasErrors;
}

/**
 * Handles the form submission process
 * @param {Event} evt - Form submission event
 * @param {Object} elements - Form elements object
 * @param {string|null} cID - Client ID
 * @param {string|null} primaryKey - Database primary key
 * @param {Object|null} clientInfo - Client information
 * @returns {Promise<void>}
 */
async function handleFormSubmission(evt, elements, cID, primaryKey, clientInfo) {
    evt.preventDefault();
    try {
        // Do a quick check for the trim cycle since the form considers null as a value.
        if (elements['trim-cycle'].value === 'null') {
            myError('trim-cycle-error', 'Please select a trim cycle.', 'trim-cycle');
            addListener('trim-cycle', 'focus', () => clearMsg({ container: 'trim-cycle-error', hide: true, input: 'trim-cycle' }));
            return;
        }

        // Validate all form fields before submission
        const isValid = await validateAllFormFields(elements, cID, primaryKey);
        if (!isValid) {
            top();
            myError(FORM_MSG, 'Please correct all errors before submitting.');
            disableEnableSubmitButton('submit-button');
            return;
        }

        const { default: formSubmission } = await import("./addEditFormSubmission.js");
        const response = await formSubmission({ evt, cID, primaryKey });
        
        if (response.status === true) {
            top();
            if (response.type === 'add-client') {
                mySuccess(FORM_MSG, response.msg);
                evt.target.reset();
                checkAppointment({
                    trimDate: elements['trim-date'],
                    trimCycle: elements['trim-cycle'],
                    appBlock: elements['appointment-block'],
                    projAppBlock: elements['projected-appointment-block'],
                    clientInfo,
                });
                return;
            }
            else if (response.type === 'edit-client') {
                mySuccess(FORM_MSG, response.msg);
                checkAppointment({
                    trimDate: elements['trim-date'],
                    trimCycle: elements['trim-cycle'],
                    appBlock: elements['appointment-block'],
                    projAppBlock: elements['projected-appointment-block'],
                    clientInfo,
                });
                return;
            }
            else if(response.type === 'delete-client') {
                mySuccess(FORM_MSG, response.msg);
                evt.target.remove();
                return;
            }
            else {
                myError(FORM_MSG,'Unknown Error. Please try again later.');
                return;
            }
        }

        top();
        myError(FORM_MSG, response.msg);
        return;
    }
    catch (err) {
        console.warn(err);
        
        top();
        const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
        myError(FORM_MSG, `There was an issue submitting the form.<br>${helpDeskTicket}`);
        await errorLogs('addEditClientError', 'Add edit client error: ', err);
        return;
    }
}