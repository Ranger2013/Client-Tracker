import ManageUser from "../../../classes/ManageUser.js";
import { clearMsg, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import { isNumeric } from "../../../utils/validation/validationUtils.js";
import listenersToClearErrors from "./helpers/listenersToClearErrors.js";
import populateScheduleOptionsForm from "./helpers/populateScheduleOptionsForm.js";

const COMPONENT_ID = 'schedule-options';
const manageUser = new ManageUser();
const scheduleOptionsForm = document.getElementById('schedule-options-form');

// Initialize form
await populateScheduleOptionsForm({ 
    form: scheduleOptionsForm, 
    manageUser 
});

listenersToClearErrors({ 
    form: scheduleOptionsForm, 
    componentId: COMPONENT_ID 
});

/**
 * Validates schedule options form data
 * @param {Object} userData - Form data to validate
 * @returns {Array<{input: string, msg: string}>} Array of validation errors
 */
function validateFormInputs(userData) {
    const errors = [];
    
    Object.entries(userData).forEach(([key, value]) => {
        if (value === '' || !isNumeric(value)) {
            errors.push({
                input: key,
                msg: 'Field must be a valid number'
            });
        }
    });

    return errors;
}

/**
 * Handles schedule options form submission
 * @param {SubmitEvent} evt - Form submission event
 */
async function handleScheduleFormSubmission({ evt }) {
    evt.preventDefault();

    try {
        clearMsg({ container: 'form-msg' });
        const userData = Object.fromEntries(new FormData(evt.target));

        const validationErrors = validateFormInputs(userData);
        
        if (validationErrors.length > 0) {
            const { default: displayFormValidationErrors } = 
                await import("../../../utils/dom/displayFormValidationErrors.js");
            await displayFormValidationErrors(validationErrors);
            return;
        }

        const stores = manageUser.getStoreNames();
        const success = await manageUser.updateLocalUserSettings({
            userData,
            settingsProperty: 'schedule_options',
            backupStore: stores.SCHEDULINGOPTIONS,
            backupAPITag: 'add_scheduleOptions'
        });

        if (success) {
            mySuccess('form-msg', 'Schedule Options have been saved.');
            top();
            return;
        }

        throw new Error('Failed to save schedule options');
    }
    catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'handleScheduleFormSubmissionError',
            consoleMsg: 'Schedule form submission error: ',
            err,
            userMsg: 'Unable to save schedule options at this time',
            errorEle: 'form-msg'
        });
    }
}

// Add form submission listener
addListener(
    scheduleOptionsForm, 
    'submit', 
    evt => handleScheduleFormSubmission({ evt }), 
    COMPONENT_ID
);