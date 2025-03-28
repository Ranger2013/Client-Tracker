import { buildEle } from '../elements.js';

// Set up debugging
const COMPONENT = 'Create Select Element';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Creates a select element with options.
 * 
 * @param {string} id - The ID of the select element.
 * @param {string} name - The name of the select element.
 * @param {string} title - The title of the select element.
 * @param {Array} options - The options to be added to the select element.
 * @param {string} nullOptionText - The text for the null option.
 * @param {boolean} [multiple=false] - Whether the select element allows multiple selections.
 * @param {boolean} [disabled=false] - Whether the select element is disabled.
 * @returns {HTMLElement} The created select element.
 */
export default function createSelectElement({ id, name, title, options, nullOptionText, required, multiple = false, disabled = false }) {
	const attributes = {
		id,
		name,
		title,
		required: required ? 'required' : undefined,
		multiple: multiple ? 'multiple' : undefined,
		disabled: disabled ? 'disabled' : undefined,
	};

	// Removed undefined attributes
	Object.keys(attributes).forEach(key => attributes[key] === undefined && delete attributes[key]);

	const selectElement = buildEle({
		type: 'select',
		attributes,
		myClass: ['w3-input', 'w3-border'],
	});

	if (nullOptionText) {
		const nullOption = buildEle({
			type: 'option',
			attributes: {
				value: 'null',
				disabled: 'disabled',
				selected: 'selected',
			},
			text: nullOptionText,
		});

		selectElement.appendChild(nullOption);
	}

	debugLog('In createSelectElement: options: ', options);
	options.forEach(option => {
		debugLog('In createSelectElement: foreach loop: option: ', option);
		const clonedOption = option.cloneNode(true);
		selectElement.appendChild(clonedOption);
	});

	debugLog('In createSelectElement: options: ', options);
	return selectElement;
}

