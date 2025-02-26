import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.js";
import { addListener } from "../../../../../../core/utils/dom/listeners.js";

const GREEN_CLASS = 'w3-light-green';
const COMPONENT_ID = 'farrier-inputs';

/**
 * Adds green highlighting to form inputs when they contain values
 * @param {HTMLFormElement} form - The form containing inputs to monitor
 */
export default async function makeInputsGreen(form) {
    try {
        const elements = await getAllFormIdElements(form);
        
        Object.entries(elements).forEach(([_, input]) => {
            if (input instanceof HTMLInputElement) {
                // Add listeners with component tracking
                addListener(input, 'blur', handleInputBlur, COMPONENT_ID);
                addListener(input, 'focus', handleInputFocus, COMPONENT_ID);

                // Set initial state
                if (input.value) {
                    input.classList.add(GREEN_CLASS);
                }
            }
        });
    }
    catch (err) {
        const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'makeInputsGreenError',
            consoleMsg: 'Make inputs green error: ',
            err
        });
    }
}

/**
 * Handles blur event to add green highlight if input has value
 * @param {Event} evt - The blur event
 */
function handleInputBlur(evt) {
    const input = evt.target;
    if (input.value) {
        input.classList.add(GREEN_CLASS);
    } else {
        input.classList.remove(GREEN_CLASS);
    }
}

/**
 * Handles focus event to remove green highlight while editing
 * @param {Event} evt - The focus event
 */
function handleInputFocus(evt) {
    evt.target.classList.remove(GREEN_CLASS);
}