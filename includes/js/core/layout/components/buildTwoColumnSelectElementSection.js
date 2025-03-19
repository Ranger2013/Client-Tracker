import { buildEle } from '../../utils/dom/elements.js';
import buildErrorDiv from './buildErrorDiv.js';

// Set up the debugging component and function
const COMPONENT = 'Two Column Select Element Section';
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(`[${COMPONENT}]`, ...args);
    }
};

/**
 * Builds an HTML section with two columns, where the second column contains a select element with options.
 * @param {Object} params - The parameters for the function.
 * @param {string} params.labelText - The text for the label in the first column.
 * @param {string} params.selectID - The ID for the select element.
 * @param {string} params.selectName - The name attribute for the select element.
 * @param {string} params.selectTitle - The title attribute for the select element.
 * @param {boolean} [params.required=true] - Whether the select element is required.
 * @param {Array} params.options - An array of option objects for the select element.
 * @param {string} params.options[].value - The value attribute for the option element.
 * @param {boolean} [params.options[].disabled] - Whether the option element is disabled.
 * @param {boolean} [params.options[].selected] - Whether the option element is selected.
 * @param {string} params.options[].text - The display text for the option element.
 * @returns {Promise<HTMLElement>} A promise that resolves to the row element containing the section.
 */
export default async function buildTwoColumnSelectElementSection({
    labelText,
    selectID,
    selectName,
    selectTitle,
    required = undefined,
    options
}) {
    try {
        // Build base elements all at once - only configurations
        const [row, colOne, colTwo, select] = [
            { type: 'div', myClass: ['w3-row', 'w3-padding'] },
            { type: 'div', myClass: ['w3-col', 'm6'] },
            { type: 'div', myClass: ['w3-col', 'm6'] },
            {
                type: 'select',
                attributes: {
                    id: selectID,
                    name: selectName,
                    title: selectTitle,
                    required
                },
                myClass: ['w3-input', 'w3-border']
            }
        ].map(config => buildEle(config));

        // Build error div separately since it's already a built element
        const errorDiv = buildErrorDiv(selectID);

        // Add label
        colOne.appendChild(buildEle({
            type: 'label',
            attributes: { for: selectID },
            text: labelText
        }));

        // Add options if they exist
        debugLog('Options:', options);
        if (options?.length > 0) {
            options.forEach(option => {
                debugLog('Option:', option);
                const { value, disabled, selected, text, ...otherAttributes } = option;
                select.appendChild(buildEle({
                    type: 'option',
                    attributes: {
                        ...otherAttributes,  // Spread any additional attributes
                        value,
                        ...(disabled && { disabled: true }),
                        ...(selected && { selected: true })
                    },
                    text
                }));
            });
        }

        // Assemble and return
        colTwo.append(select, errorDiv);
        row.append(colOne, colTwo);
        return row;

    }
    catch (err) {
        const { AppError } = await import("../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
    }
}