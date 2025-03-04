import { addListener, removeListeners } from "../../../../core/utils/dom/listeners.js";
import { clearMsg, safeDisplayMessage } from "../../../../core/utils/dom/messages.js";
import { underscoreToHyphen, underscoreToHyphenPlusError } from "../../../../core/utils/string/stringUtils.js";
import { isNumeric } from "../../../../core/utils/validation/validators.js";
import ManageUser from "../../models/ManageUser.js";
import populateScheduleOptionsForm from "./components/schedule-options/populateScheduleOptionsForm.js";

const manageUser = new ManageUser();
const COMPONENT_ID = 'schedule-options';
const ERROR_COMPONENT = 'schedule-options-error';
const scheduleOptionsForm = document.getElementById('schedule-options-form');

// Populate form with local data if any
await populateScheduleOptionsForm({ 
    form: scheduleOptionsForm, 
    manageUser 
});

/**
 * Validates schedule options form data
 * @param {Object} userData - Form data to validate
 * @returns {Array<{input: string, msg: string}>} Array of validation errors
 */
function validateFormInputs(userData) {
    const errors = [];

    // Remove previous listeners before assigning new ones.
    removeListeners(ERROR_COMPONENT);
    
    Object.entries(userData).forEach(([key, value]) => {
        if (value === '' || !isNumeric(value)) {
            errors.push({
                input: key,
                msg: 'Field must be a valid number'
            });

            // Add event listener to clear error messages on focus
            addListener({
                elementOrId: underscoreToHyphen(key),
                eventType: 'focus',
                handler: () => clearMsg({ container: `${underscoreToHyphenPlusError(key)}`, input: underscoreToHyphen(key)}),
                componentId: ERROR_COMPONENT,
            });
        }
    });

    return errors;
}

/**
 * Handles schedule options form submission
 * @param {SubmitEvent} evt - Form submission event
 */
async function handleScheduleFormSubmission(evt) {
    evt.preventDefault();

    try {
        clearMsg({ container: 'form-msg' });
        const userData = Object.fromEntries(new FormData(evt.target));

        const validationErrors = validateFormInputs(userData);
        
        if (validationErrors.length > 0) {
            const { default: displayFormValidationErrors } = await import("../../../../core/utils/dom/forms/displayFormValidationErrors.js");
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
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Schedule Options have been saved.',
                isSuccess: true,
            })
            return;
        }

        throw new Error('Failed to save schedule options');
    }
    catch (err) {
        const { AppError} = await import("../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
            userMessage: AppError.BaseMessages.system.formSubmission,
            displayTarget: 'form-msg',
        });
    }
}

// Add form submission listener
addListener({
    elementOrId: scheduleOptionsForm,
    eventType: 'submit',
    handler: handleScheduleFormSubmission,
    componentId: COMPONENT_ID
});
