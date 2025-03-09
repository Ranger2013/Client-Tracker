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
		else if (text instanceof Node) {
			ele.appendChild(text);
		}
	}
	return ele;
}

/**
 * Enables or disables a submit button based on the presence of error elements.
 * @param {HTMLElement|string} button - The button element or its ID to enable/disable.
 */
export function disableEnableSubmitButton(button) {
    try {
        const buttonElement = getValidElement(button);
        const errors = document.querySelectorAll('.error');
        buttonElement.disabled = errors.length > 0;
    }
    catch (error) {
        // Let AppError handle all logging
        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                return new AppError('Submit button state update failed', {
                    originalError: error,
                    errorCode: AppError.Types.RENDER_ERROR,
                    shouldLog: true,
                    displayTarget: 'page-msg',
                    userMessage: null
                }).logError();
            })
            .catch(err => console.error('Error handler failed:', err));
    }
}

/**
 * Gets element by ID or validates HTMLElement
 * @throws {Error} If element is invalid or not found
 */
export function getValidElement(element) {
	if (typeof element === 'string') {
		const ele = document.getElementById(element);
		if (!ele) {
			throw new Error(`Element with ID "${element}" not found.`);
		}
		return ele;
	}

	if (!(element instanceof HTMLElement)) {
		throw new Error('The provided element is not valid.');
	}

	return element;
}

export function buildElementsFromConfig(config) {
	return Object.entries(config).reduce((acc, [key, value]) => {
		acc[key] = buildEle(value);
		return acc;
	}, {});
}

