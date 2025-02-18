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

		 // Use Object.fromEntries for better performance than reduce
		 return Object.fromEntries(
			  Array.from(
					formElement.querySelectorAll('[id]'),
					element => [element.id, element]
			  )
		 );

	} catch (err) {
		 const { default: errorLogs } = await import('../error-messages/errorLogs.js');
		 await errorLogs('getAllFormIdElementsError', 'Get all form id elements error:', err);
		 throw err;
	}
}
