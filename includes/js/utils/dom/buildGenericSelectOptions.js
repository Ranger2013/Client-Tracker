
import { buildEle } from "./domUtils.js";

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
