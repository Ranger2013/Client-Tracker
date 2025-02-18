import { getCurrentTime, getReadableCurrentFutureDate } from "../../date/dateUtils.js";
import { buildEle } from "../../dom/domUtils.js";
import { cleanUserOutput } from "../../string/stringUtils.js";
import buildErrorDiv from "./buildErrorDiv.js";

const INPUT_TYPES = {
    date: {
        getDefaultValue: () => getReadableCurrentFutureDate()
    },
    time: {
        getDefaultValue: () => getCurrentTime()
    },
    number: {
        attributes: { step: '.01' }  // Only number type has attributes defined
    }
};

/**
 * Builds an HTML section with a specified input field.
 * @param {string} labelText - The text for the label.
 * @param {string} inputId - The ID for the input field.
 * @param {string} inputType - The type for the input field.
 * @param {string} inputName - The name for the input field.
 * @param {string} inputTitle - The title for the input field.
 * @param {boolean} [required=true] - Whether the input field is required.
 * @param {string} inputValue - The value for the input element.
 * @param {HTMLElement} [additionalElement=null] - An additional element to append to the input column.
 * @returns {Promise<HTMLElement>} The row element containing the section.
 */
export default async function buildTwoColumnInputSection({
    labelText,
    inputID,
    inputType,
    inputName,
    inputTitle,
    required = undefined,
    inputValue = undefined,
    additionalElement = null
}) {
    try {
        // Simplified attributes object
        const inputAttributes = {
            id: inputID,
            type: inputType,
            name: inputName,
            placeholder: inputTitle,
            title: inputTitle,
            required,  // if undefined, won't be included in the object
            value: (cleanUserOutput(inputValue) || undefined) || INPUT_TYPES[inputType]?.getDefaultValue?.() || undefined,
            ...INPUT_TYPES[inputType]?.attributes  // if undefined, nothing will be spread
        };

        Object.keys(inputAttributes).forEach(key => inputAttributes[key] === undefined && delete inputAttributes[key]);

        // Build base elements separately from error div
        const [row, colLabel, colInput, input] = [
            { type: 'div', myClass: ['w3-row', 'w3-padding'] },
            { type: 'div', myClass: ['w3-col', 'm6'] },
            { type: 'div', myClass: ['w3-col', 'm6'] },
            { type: 'input', attributes: inputAttributes, myClass: ['w3-input', 'w3-border', 'input'] }
        ].map(config => buildEle(config));

        // Build error div separately
        const errorDiv = buildErrorDiv(inputID);

        // Build label
        const label = buildEle({ 
            type: 'label', 
            attributes: { for: inputID }, 
            text: labelText 
        });

        // Special handling for appointment time
        if (inputID === 'app-time') {
            const [appointmentBlock, projectedBlock] = ['appointment-block', 'projected-appointment-block']
                .map(id => buildEle({
                    type: 'div',
                    attributes: { id },
                    myClass: ['w3-margin-small']
                }));
            
            colInput.append(input, errorDiv, appointmentBlock, projectedBlock);
        } else {
            colInput.append(input, errorDiv);
        }

        // Add any additional elements
        if (additionalElement) {
            colInput.appendChild(additionalElement);
        }

        // Assemble and return
        colLabel.appendChild(label);
        row.append(colLabel, colInput);
        
        return row;

    } catch (err) {
        const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
        await errorLogs('buildTwoColumnInputSectionError', 'Build Two Column Input Section Error:', err);
        throw err;
    }
}