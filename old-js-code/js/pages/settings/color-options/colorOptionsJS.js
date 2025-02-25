import { addListener } from "../../../utils/event-listeners/listeners.js";
import { clearMsg, myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import ManageUser from "../../../classes/ManageUser.js";
import displayFormValidationErrors from "../../../utils/dom/displayFormValidationErrors.js";

const COMPONENT_ID = 'color-options';

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
 * @param {Event} evt - Form submission event
 * @returns {Promise<void>}
 * @throws {Error} If settings update fails
 */
async function handleColorOptionFormSubmission(evt) {
    evt.preventDefault();
    
    try {
        clearMsg({ container: 'form-msg' });
        const userData = Object.fromEntries(new FormData(evt.target));
        
        const validate = validateColor(userData);
        if (validate) {
            await displayFormValidationErrors(validate);
            return;
        }

        const manageUser = new ManageUser();
        const stores = manageUser.getStoreNames();

        if (await manageUser.updateLocalUserSettings({
            userData,
            settingsProperty: 'color_options',
            backupStore: stores.COLOROPTIONS,
            backupAPITag: 'add_colorOptions'
        })) {
            mySuccess('form-msg', 'Color Options have been saved');
            top();
            return;
        }

        myError('form-msg', 'Unable to save color options at this time.');
    }
    catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'colorOptionsFormError',
            consoleMsg: 'Color options form submission error: ',
            err,
            userMsg: 'Unable to save color options',
            errorEle: 'form-msg'
        });
    }
}

// Initialize listener - that's all we need
addListener('color-options-form', 'submit', handleColorOptionFormSubmission, COMPONENT_ID);