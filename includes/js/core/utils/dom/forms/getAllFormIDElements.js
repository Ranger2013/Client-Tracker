import { getValidElement } from '../elements.min';

/**
 * Gets all form elements with non-empty id attributes.
 * @param {string|HTMLElement} form - The form element or its id.
 * @returns {Promise<Object>} An object containing references to all form elements with non-empty ids.
 * @throws {Error} Throws an error if the form is invalid or not found.
 */
export default function getAllFormIdElements(form) {
    try {
        const formElement = getValidElement(form);

        // Approach 1: Using specific selector for form elements
        return Object.fromEntries(
            Array.from(
                formElement.querySelectorAll('input[id], select[id], textarea[id]'),
                element => [element.id, element]
            )
        );
    }
    catch (err) {
        throw err;
    }
}
