/**
 * Gets all form elements with non-empty id attributes.
 * @param {string|HTMLElement} form - The form element or its id.
 * @returns {Promise<Object>} An object containing references to all form elements with non-empty ids.
 * @throws {Error} Throws an error if the form is invalid or not found.
 */
export default async function getAllFormIdElements(form) {
    try {
        const formElement = typeof form === 'string' 
            ? document.getElementById(form)
            : form instanceof HTMLElement ? form : null;

        if (!formElement) {
            throw new Error(
                typeof form === 'string' 
                    ? `No form found with id: ${form}`
                    : 'Invalid form parameter'
            );
        }

        // Approach 1: Using specific selector for form elements
        return Object.fromEntries(
            Array.from(
                formElement.querySelectorAll('input[id], select[id], textarea[id]'),
                element => [element.id, element]
            )
        );
    } catch (err) {
        const { handleError } = await import("../error-messages/handleError.js");
        await handleError({
            filename: 'getAllFormIdElementsError',
            consoleMsg: 'Get all form ID elements error: ',
            err
        });
        throw err;
    }
}
