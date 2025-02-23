import ManageUser from "../../../../classes/ManageUser.js";
import getAllFormIdElements from "../../../../utils/dom/getAllFormIDElements.js";

/**
 * Populates schedule options form with existing user settings
 * @param {Object} params - Function parameters
 * @param {HTMLFormElement|string} params.form - Form element or form ID
 * @param {ManageUser} params.manageUser - ManageUser instance
 * @returns {Promise<void>}
 */
export default async function populateScheduleOptionsForm({ form, manageUser }) {
    try {
        if (typeof form === 'string') {
            form = document.getElementById(form);
        }

        const scheduleOptions = await manageUser.getScheduleOptions();
        if (!scheduleOptions) return;

        const elements = await getAllFormIdElements(form);
        
        // Populate form fields with existing values
        Object.entries(elements).forEach(([fieldId, element]) => {
            if (scheduleOptions[fieldId] != null) {
                element.value = scheduleOptions[fieldId];
            }
        });
    }
    catch (err) {
        const { handleError } = await import("../../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'populateScheduleOptionsFormError',
            consoleMsg: 'Error populating schedule options form: ',
            err,
            userMsg: 'Unable to load saved schedule options',
            errorEle: 'form-msg'
        });
    }
}