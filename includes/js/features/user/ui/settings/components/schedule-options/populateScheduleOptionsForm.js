import { getValidElement } from "../../../../../../core/utils/dom/elements.js";
import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.js";

/**
 * Populates schedule options form with existing user settings
 * @param {Object} params - Function parameters
 * @param {HTMLFormElement|string} params.form - Form element or form ID
 * @param {ManageUser} params.manageUser - ManageUser instance
 * @returns {Promise<void>}
 */
export default async function populateScheduleOptionsForm({ form, manageUser }) {
    try {
        form = getValidElement(form);
        const scheduleOptions = await manageUser.getScheduleOptions();
        
        if (!scheduleOptions || Object.keys(scheduleOptions).length === 0) return;

        const elements = getAllFormIdElements(form);
        
        // Populate form fields with existing values
        Object.entries(elements).forEach(([_, element]) => {
            if (scheduleOptions[element.name] != null) {
                element.value = scheduleOptions[element.name];
            }
        });
    }
    catch (err) {
        // Die silently
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_POPULATION_ERROR,
            userMessage: null,
        });
    }
}