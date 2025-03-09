import { buildEle } from '../../utils/dom/elements.js';

/**
 * Builds a section containing submit and delete buttons.
 * @param {Object} params - The parameters for the buttons.
 * @param {string} params.submitButtonText - The text for the submit button.
 * @param {string} params.deleteButtonText - The text for the delete button.
 * @returns {Promise<HTMLElement>} The row containing both buttons.
 */
export default async function buildSubmitDeleteButtonSection({ submitButtonText, deleteButtonText }) {
    try {
        // Build all elements at once
        const [row, submitCol, deleteCol] = [
            { type: 'div', myClass: ['w3-row'] },
            { type: 'div', myClass: ['w3-col', 's6', 'w3-padding-small', 'w3-center'] },
            { type: 'div', myClass: ['w3-col', 's6', 'w3-padding-small', 'w3-center'] }
        ].map(config => buildEle(config));

        // Build both buttons
        const [submitButton, deleteButton] = [
            {
                type: 'button',
                attributes: {
                    id: 'submit-button',
                    type: 'submit',
                    name: 'submit'
                },
                myClass: ['w3-button', 'w3-round-large', 'w3-black'],
                text: submitButtonText
            },
            {
                type: 'button',
                attributes: {
                    id: 'delete-button',
                    type: 'submit',
                    name: 'delete'
                },
                myClass: ['w3-button', 'w3-round-large', 'w3-red'],
                text: deleteButtonText
            }
        ].map(config => buildEle(config));

        // Assemble and return
        submitCol.appendChild(submitButton);
        deleteCol.appendChild(deleteButton);
        row.append(submitCol, deleteCol);
        
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