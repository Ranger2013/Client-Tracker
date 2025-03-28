import displayFormValidationErrors from '../../../../core/utils/dom/forms/displayFormValidationErrors.js';
import { addListener } from '../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../core/utils/dom/messages.js';
import { top } from '../../../../core/utils/window/scroll.js';
import ManageUser from '../../models/ManageUser.js';
import populateColorOptionsForm from './components/color-options/populateColorOptions.js';

const COMPONENT_ID = 'color-options';

const manageUser = new ManageUser();

/**
 * Populate the form fields with the user's current color options
 * @returns {void}
 */
populateColorOptionsForm({ form: 'color-options-form', manageUser});

/**
 * Validates color input values against hex color format
 * @param {Object} userData - Form data object containing color values
 * @returns {Array|null} Array of validation errors or null if valid
 * @example
 * validateColor({ text_color: '#000000', background: 'invalid' })
 * // Returns [{ input: 'background', msg: 'Invalid color format.' }]
 */
function validateColor(userData) {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    const errors = [];

    for (const [field, color] of Object.entries(userData)) {
        if (!hexColorRegex.test(color)) {
            errors.push({ input: field, msg: "Invalid color format." });
        }
    }

    return errors.length > 0 ? errors : null;
}

/**
 * Handles the submission of the color options form
 * Validates colors and updates user settings
 * @param {SubmitEvent} evt - Form submission event
 * @returns {Promise<void>}
 * @throws {Error} If settings update fails
 */
async function handleColorOptionFormSubmission(evt) {
    evt.preventDefault();
    
    try {
        clearMsg({ container: 'form-msg' });

        // @ts-ignore
        const userData = Object.fromEntries(new FormData(evt.target));
        
        const validate = validateColor(userData);
        if (validate) {
            await displayFormValidationErrors(validate);
            return;
        }

        const stores = manageUser.getStoreNames();

        if (await manageUser.updateLocalUserSettings({
            userData,
            settingsProperty: 'color_options',
            backupStore: stores.COLOROPTIONS,
            backupAPITag: 'add_colorOptions'
        })) {
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Color Options have been saved',
                isSuccess: true,
            });
            top();
            return;
        }

        safeDisplayMessage({
            elementId: 'form-msg',
            message: 'Unable to save color options at this time.',
        });

        top();
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
            userMessage: AppError.BaseMessages.forms.submissionFailed,
            displayTarget: 'form-msg',
        });
    }
}

// Initialize listener - that's all we need
addListener({
    elementOrId: 'color-options-form',
    eventType: 'submit',
    handler: handleColorOptionFormSubmission,
    componentId: COMPONENT_ID
});
