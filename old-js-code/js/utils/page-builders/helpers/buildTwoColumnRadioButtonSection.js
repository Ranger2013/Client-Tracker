import { buildEle } from "../../dom/domUtils.js";

/**
 * Builds an HTML section with two columns, where the second column contains radio buttons.
 * @param {Object} params - The parameters for the function.
 * @param {string} params.labelText - The text for the label in the first column.
 * @param {boolean} [params.required=true] - Whether the radio buttons are required.
 * @param {Array} params.buttons - An array of button objects, each representing a radio button.
 * @param {string} params.buttons[].name - The name attribute for the radio button.
 * @param {string} params.buttons[].value - The value attribute for the radio button.
 * @param {string} params.buttons[].labelText - The text label for the radio button.
 * @param {boolean} [params.buttons[].checked] - Whether the radio button is checked.
 * @returns {Promise<HTMLElement>} A promise that resolves to the row element containing the section.
 */
export default async function buildTwoColumnRadioButtonSection({ labelText, required = undefined, buttons }) {
    try {
        // Build base elements
        const [row, colOne, colTwo] = [
            { type: 'div', myClass: ['w3-row', 'w3-padding'] },
            { type: 'div', myClass: ['w3-col', 'm6'], text: labelText },
            { type: 'div', myClass: ['w3-col', 'm6'] }
        ].map(config => buildEle(config));

        // Build radio buttons
        buttons?.forEach(button => {
            const label = buildEle({ 
                type: 'label', 
                myClass: ['w3-block'], 
                text: `${button.labelText} ` 
            });

            const radioButton = buildEle({
                type: 'input',
                attributes: {
                    type: 'radio',
                    name: button.name,
                    value: button.value,
                    ...(button.checked && { checked: true }),
                    ...(required && { required: true })
                }
            });

            label.appendChild(radioButton);
            colTwo.appendChild(label);
        });

        row.append(colOne, colTwo);
        return row;

    } catch (err) {
        const { handleError } = await import("../../error-messages/handleError.js");
        await handleError({
            filename: 'buildTwoColumnRadioButtonSectionError',
            consoleMsg: 'Build Two Column Radio Button Section Error:',
            err,
            userMsg: 'Unable to create radio buttons.',
            errorEle: 'page-msg'
        });
        throw err;
    }
}
