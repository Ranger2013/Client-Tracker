import { disableEnableSubmitButton } from '../../../../core/utils/dom/elements.min.js';
import { addListener, removeListeners } from "../../../../core/utils/dom/listeners.min.js";
import { clearMsg, safeDisplayMessage } from "../../../../core/utils/dom/messages.min.js";
import { underscoreToHyphen, underscoreToHyphenPlusError } from "../../../../core/utils/string/stringUtils.min.js";
import { isNumeric } from "../../../../core/utils/validation/validators.min.js";
import ManageUser from "../../models/ManageUser.min.js";
import populateScheduleOptionsForm from "./components/schedule-options/populateScheduleOptionsForm.min.js";

const manageUser = new ManageUser();
const COMPONENT_ID = 'schedule-options';

(async function init() {
    // Populate form with local data if any
    await populateScheduleOptionsForm({ 
        form: 'schedule-options-form', 
        manageUser 
    });

    // Initialize event handlers
    await initializeEventHandlers();
})();

async function initializeEventHandlers() {
    try {
        // Helper functions to reduce duplication
        const handleNumericValidation = (fieldId) => (evt) => {
            const isValidated = isNumeric(evt.target.value);
            if (!isValidated) {
                safeDisplayMessage({
                    elementId: `${fieldId}-error`,
                    message: 'Please enter a valid number',
                    targetId: fieldId
                });
                disableEnableSubmitButton('submit-button');
            }
        };

        const handleFieldFocus = (fieldId) => () => {
            clearMsg({ 
                container: `${fieldId}-error`, 
                hide: true, 
                input: fieldId 
            });
            disableEnableSubmitButton('submit-button');
        };

        // Array-based approach
        const fields = ['avg-trim', 'half-set', 'full-set', 'avg-drive-time'];
        const eventHandlers = fields.reduce((acc, fieldId) => {
            acc[`input:${fieldId}`] = handleNumericValidation(fieldId);
            acc[`focusin:${fieldId}`] = handleFieldFocus(fieldId);
            return acc;
        }, {
            'submit:schedule-options-form': handleScheduleFormSubmission
        });

        addListener({
            elementOrId: 'schedule-options-form',
            eventType: ['input', 'focusin', 'submit'],
            handler: (evt) => {
                const handlerKey = `${evt.type}:${evt.target.id}`;
                eventHandlers[handlerKey]?.(evt);
            },
            componentId: COMPONENT_ID,
        });
    }
    catch(err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.min.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: AppError.BaseMessages.system.initialization,
        });

        disableEnableSubmitButton('submit-button');
    }
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
        const { AppError} = await import("../../../../core/errors/models/AppError.min.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
            userMessage: AppError.BaseMessages.system.formSubmission,
            displayTarget: 'form-msg',
        });
    }
}
