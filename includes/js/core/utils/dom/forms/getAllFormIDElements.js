/**
 * Gets all form elements with non-empty id attributes.
 * @param {string|HTMLElement} form - The form element or its id.
 * @returns {Promise<Object>} An object containing references to all form elements with non-empty ids.
 * @throws {Error} Throws an error if the form is invalid or not found.
 */
export default function getAllFormIdElements(form) {
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
    }
    catch (err) {
        import("../../../errors/models/AppError.js")
        .then(({AppError}) => {
            throw new AppError('Get all form ID elements error: ', {
                originalError: err,
                shouldLog: true,
                userMessage: null,
                errorCode: 'RENDER_ERROR',
            }).logError();
        })
        .catch(err => console.error('Error handler failed:', err));
    }
}
