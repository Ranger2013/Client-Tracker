/**
 * @typedef {Object} BuildEleArgs
 * @property {string} type - The type of the element to create
 * @property {Object.<string, string>} [attributes] - The attributes to set on the element. Object pairs.
 * @property {string[]} [myClass] - The classes to add to the element. Array of class names.
 * @property {string} [text] - The text content of the element.
 * @param {BuildEleArgs} args - The arguments to build the element
 */
export function buildEle({ type, attributes, myClass, text }) {
	const ele = document.createElement(type);

	if (attributes) {
		for (const key in attributes) {
			ele.setAttribute(key, attributes[key]);
		}
	}
	if (myClass) {
		ele.classList.add(...myClass);
	}
	
	if (text) {
		if (typeof text === 'string' || typeof text === 'number') {
			ele.innerHTML = text;			
		}
		else if (text instanceof HTMLElement) {
			ele.appendChild(text);
		}
	}
	return ele;
}

/**
 * Enables or disables a submit button based on the presence of error elements.
 * 
 * @param {HTMLElement|string} button - The button element or its ID to enable/disable.
 */
export async function disableEnableSubmitButton(button) {
	try {
		if (typeof button === 'string') {
			button = document.getElementById(button);

			if (!button) {
				throw new Error(`Submit button with ID "${button} not found.`);
			}
		}
		else if (!(button instanceof HTMLElement)) {
			throw new Error('Button is not valid.');
		}

		// Check if there are any error elements
		const errors = document.querySelectorAll('.error');
		
		button.disabled = errors.length > 0;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../old-js-code/js/utils/error-messages/errorLogs.js");
		await errorLogs('disableEnableSubmitButtonError', 'Disable/Enable submit button error: ', err);
		throw err;
	}
}

