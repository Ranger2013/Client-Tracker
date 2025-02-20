import { buildEle } from "../../dom/domUtils.js";

/**
 * Builds a submit button section with optional color.
 * @param {string} buttonText - The text to display on the button.
 * @param {string} [buttonColor=null] - Optional CSS class for button color.
 * @returns {Promise<HTMLElement>} The button container element.
 */
export default async function buildSubmitButtonSection(buttonText, buttonColor = null) {
    try {
        if (!buttonText) throw new Error('Button Text is required');

        // Build all elements at once
        const [container, button] = [
            {
                type: 'div',
                attributes: { id: 'button-section' },
                myClass: ['w3-margin-top', 'w3-padding-bottom', 'w3-center']
            },
            {
                type: 'button',
                attributes: {
                    id: 'submit-button',
                    type: 'submit',
                    name: 'submit'
                },
                myClass: ['w3-button', 'w3-round-large', buttonColor || 'w3-black'],
                text: buttonText
            }
        ].map(config => buildEle(config));

        container.appendChild(button);
        return container;

    } catch (err) {
        const { handleError } = await import("../../error-messages/handleError.js");
        await handleError({
            filename: 'buildSubmitButtonSectionError',
            consoleMsg: 'Build submit button section error: ',
            err,
            userMsg: 'Unable to create form button',
            errorEle: 'page-msg'
        });
        throw err;
    }
}