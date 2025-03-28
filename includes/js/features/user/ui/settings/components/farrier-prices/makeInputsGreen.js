import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.js";
import { addListener } from "../../../../../../core/utils/dom/listeners.js";

// Set up debug mode
const COMPONENT = 'Make Inputs Green';
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(`[${COMPONENT}]`, ...args);
    }
};

const GREEN_CLASS = 'w3-light-green';

/**
 * Adds green highlighting to form inputs when they contain values
 * @param {HTMLFormElement} form - The form containing inputs to monitor
 */
export default async function makeInputsGreen({form, componentId}) {
    try {
        debugLog('makeInputsGreen', {form, componentId});
        const elements = getAllFormIdElements(form);
        
        // Set the initial state of the form inputs
        Object.values(elements).forEach(input => {
            debugLog('input.value: ', input.value);
            if (input instanceof HTMLInputElement && input.value !== '') {
                input.classList.add(GREEN_CLASS);
            }
            else {
                input.classList.remove(GREEN_CLASS);
            }
        });
        console.log('makeInputsGreen');

        addListener({
            elementOrId: form,
            eventType: ['focusout'],
            handler: (evt) => handleInputBlur(evt),
            componentId
        });

        addListener({
            elementOrId: 'farrier-prices-form',
            eventType: 'focusin',
            handler: (evt) => handleInputFocus(evt),
            componentId
        });

    }
    catch (err) {
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: null,
        });
    }
}

/**
 * Handles blur event to add green highlight if input has value
 * @param {Event} evt - The blur event
 */
function handleInputBlur(evt) {
    if (evt.target instanceof HTMLInputElement) {
        const input = evt.target;

        if (input.value) {
            input.classList.add(GREEN_CLASS);
        } else {
            input.classList.remove(GREEN_CLASS);
        }
    }
}

/**
 * Handles focus event to remove green highlight while editing
 * @param {Event} evt - The focus event
 */
function handleInputFocus(evt) {
    if (evt.target instanceof HTMLInputElement) {
        evt.target.classList.remove(GREEN_CLASS);
    }
}