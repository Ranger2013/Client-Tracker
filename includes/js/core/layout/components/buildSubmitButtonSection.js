import { buildEle } from '../../utils/dom/elements.js';

/**
 * Builds a submit button section with optional color.
 * @param {string} buttonText - The text to display on the button.
 * @param {string} [buttonColor=null] - Optional CSS class for button color.
 * @returns {Promise<HTMLElement>} The button container element.
 */
export default async function buildSubmitButtonSection(buttonText, buttonColor = null, id = null) {
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
                    id: id || 'submit-button',
                    type: 'submit',
                    name: 'submit'
                },
                myClass: ['w3-button', 'w3-round-large', buttonColor || 'w3-black'],
                text: buttonText
            }
        ].map(config => buildEle(config));

        container.appendChild(button);
        return container;

    }
    catch (err) {
        const { AppError } = await import("../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
    }
}