import { buildEle } from '../../utils/dom/elements.min.js';
import { buildErrorDiv } from '../../utils/dom/forms/buildUtils.min.js';
import { cleanUserOutput } from '../../utils/string/stringUtils.min.js';

/**
 * Builds an HTML address section with specified fields.
 * @param {string} labelText - The text for the label.
 * @param {string} inputId - The ID for the input field.
 * @param {Object[]} fields - The fields for the address section.
 * @param {string} fields[].typeEle - The type of the element.
 * @param {string} fields[].inputId - The ID for the input field.
 * @param {string} fields[].inputType - The type for the input field.
 * @param {string} fields[].inputName - The name for the input field.
 * @param {string} fields[].inputTitle - The title for the input field.
 * @param {string} fields[].inputClass - The class for the input field.
 * @param {string} [fields[].inputRequired] - The required attribute for the input field.
 * @param {string} [fields[].inputPattern] - The pattern attribute for the input field.
 * @returns {Promise<HTMLElement>} The row element containing the address section.
 */
export default async function buildTwoColumnAddressSection(labelText, inputID, fields) {
    try {
        // Build base elements
        const [row, colOne, colTwo] = [
            { type: 'div', myClass: ['w3-row', 'w3-padding'] },
            { type: 'div', myClass: ['w3-col', 'm6'] },
            { type: 'div', myClass: ['w3-col', 'm6'] }
        ].map(config => buildEle(config));

        // Add label to first column
        colOne.appendChild(buildEle({ 
            type: 'label', 
            attributes: { for: inputID }, 
            text: labelText 
        }));

        // Process each field
        fields.forEach(field => {
            const padding = buildEle({ type: 'div', myClass: ['w3-padding-top'] });
            
            // Build input with cleaned attributes
            const input = buildEle({ 
                type: field.typeEle, 
                attributes: {
                    id: field.inputId,
                    type: field.inputType,
                    name: field.inputName,
                    title: field.inputTitle,
                    placeholder: field.inputTitle,
                    value: cleanUserOutput(field.inputValue),
                    ...(field.inputRequired && { required: true }),
                    ...(field.inputPattern && { pattern: field.inputPattern })
                },
                myClass: field.inputClass.split(' ')
            });

            // Add note if exists
            if (field.note) {
                padding.appendChild(buildEle({
                    type: 'div',
                    myClass: ['w3-text-blue', 'w3-padding-small', 'w3-small'],
                    text: field.note
                }));
            }

            // Build error div separately instead of in map
            const errorDiv = buildErrorDiv(field.inputId);

            padding.append(input, errorDiv);
            colTwo.appendChild(padding);
        });

        row.append(colOne, colTwo);
        return row;

    } catch (err) {
        const { AppError } = await import("../../errors/models/AppError.min.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
    }
}