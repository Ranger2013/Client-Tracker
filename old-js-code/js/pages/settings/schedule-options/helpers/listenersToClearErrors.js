import { clearMsg } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import { underscoreToHyphenPlusError } from "../../../../utils/string/stringUtils.js";

/**
 * Sets up focus listeners to clear error messages
 * @param {Object} params - Function parameters
 * @param {HTMLFormElement} params.form - Form containing inputs
 * @param {string} params.componentId - Component ID for event tracking
 */
export default async function listenersToClearErrors({ form, componentId }) {
    try {
        const inputs = form.querySelectorAll('input');

        inputs.forEach(input => {
            addListener(
                input, 
                'focus', 
                () => clearMsg({
                    container: underscoreToHyphenPlusError(input.id), 
                    input
                }),
                componentId
            );
        });
    }
    catch (err) {
        const { handleError } = await import("../../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'listenersToClearErrorsError',
            consoleMsg: 'Error setting up error clear listeners: ',
            err
        });
    }
}