import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.min.js";
import { addListener } from "../../../../../../core/utils/dom/listeners.min.js";

const GREEN_CLASS = 'w3-light-green';

/**
 * Adds green highlighting to form inputs when they contain values
 * @param {HTMLFormElement} form - The form containing inputs to monitor
 */
export default function makeInputsGreen(form, componentId) {
    try {
        const elements = getAllFormIdElements(form);
        
        Object.entries(elements).forEach(([_, input]) => {
            if (input instanceof HTMLInputElement) {
                // Add listeners with component tracking
                addListener({
                    elementOrId: input,
                    eventType: 'blur',
                    handler: handleInputBlur,
                    componentId
                });

                addListener({
                    elementOrId: input,
                    eventType: 'focus',
                    handler: handleInputFocus,
                    componentId
                });

                // Set initial state
                if (input.value) {
                    input.classList.add(GREEN_CLASS);
                }
            }
        });
    }
    catch (err) {
        import("../../../../../../core/errors/models/AppError.min.js")
        .then(({AppError}) => {
           AppError.handleError(err, {
               errorCode: AppError.Types.RENDER_ERROR,
               userMessage: null,
           });
        })
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