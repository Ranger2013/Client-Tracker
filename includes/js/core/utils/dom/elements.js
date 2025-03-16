const COMPONENT = 'Elements.js';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
}

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
		throw new Error(`The provided element "${element}" is not valid.`);
	}

	return element;
}

export function buildElementsFromConfig(config) {
	return Object.entries(config).reduce((acc, [key, value]) => {
		acc[key] = buildEle(value);
		return acc;
	}, {});
}

/**
 * Generates an array of option elements based on the provided configuration.
 *
 * @param {Object} config - The configuration object for building select options.
 * @param {Array} config.list - The array of options to be processed.
 * @param {function(Object): string} config.value - A function that returns the value for each option element.
 * @param {function(Object): string} config.text - A function that returns the text for each option element.
 * 
 * @returns {Array} - An array of option elements.
 *
 * @example
 * const config = {
 *   list: [
 *     { id: 1, name: 'Option 1' },
 *     { id: 2, name: 'Option 2' }
 *   ],
 *   value: opt => opt.id,
 *   text: opt => opt.name
 * };
 * const options = buildGenericSelectOptions(config);
 * // options will be an array of option elements with the specified value and text.
 */
export function buildGenericSelectOptions(config) {
	debugLog('Building select options with config:', config);
	return config.list.map(opt => {
		// Set the value and the text of the option
		const value = config.value(opt);
		const text = config.text(opt);

		// Return the option element
		return buildEle({
			type: 'option',
			attributes: { value },
			text
		});
	});
}

/**
 * Updates a select element with new options generated from an array of items
 * 
 * @param {string|HTMLElement} select - The select element or its ID
 * @param {Array} items - An array of data objects to convert into options
 * @param {Object} config - Configuration for generating options
 * @param {function(Object): string|number} config.valueMapper - Function that extracts the value attribute for each option
 * @param {function(Object): string} config.textMapper - Function that extracts the display text for each option
 * @param {*} [config.selectedValue=null] - The value to select after updating options (optional)
 * @returns {void}
 */
export function updateSelectOptions(select, items, { valueMapper, textMapper, selectedValue = null, preserveFirst = true }) {
	// Get the valid element
	const selectedElement = getValidElement(select);

	// Save the first option unless we're not preserving it
	const firstOption = preserveFirst && selectedElement.options.length > 0
		? selectedElement.options[0].cloneNode(true)
		: null;

	// Build the options
	const options = buildGenericSelectOptions({
		list: items,
		value: valueMapper,
		text: textMapper,
	});

	const fragment = document.createDocumentFragment();

	// Add the preserved first option if it exists
	if (firstOption) {
		fragment.appendChild(firstOption);
	}

	// Add the new options
	options.forEach(option => fragment.appendChild(option));

	selectedElement.innerHTML = '';
	selectedElement.appendChild(fragment);

	if (selectedValue !== null) {
		selectedElement.value = selectedValue;
	}
}