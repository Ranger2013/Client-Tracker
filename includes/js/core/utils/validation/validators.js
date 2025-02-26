/**
 * Core validation utilities used across the application
 */

/**
 * Checks if a given value is numeric with up to two decimal places.
 * Allows for an optional empty string based on the `allowEmpty` parameter.
 *
 * @param {string} num - The value to check.
 * @param {boolean} [allowEmpty=false] - Whether to allow empty strings.
 * @return {boolean} - Returns true if the value is numeric (with up to two decimal places) or an allowed empty string.
 */
export function isNumeric(num, allowEmpty = false) {
	// Regex to check for numeric values with up to two decimal places or spaces (used when allowEmpty is true)
	const regexAllowEmpty = /^(?:\d+|\d*\.\d{1,2}|\s*)$/;
	
	// Regex to check for numeric values with up to two decimal places (no spaces allowed, used when allowEmpty is false)
	const regexNoEmpty = /^(?:\d+|\d*\.\d{1,2})$/;

	// Use the appropriate regex based on the allowEmpty parameter
	return allowEmpty ? regexAllowEmpty.test(num) : regexNoEmpty.test(num);
}

/**
 * Ensure the input is a valid date in the format 'YYYY-MM-DD'.
 * @param {String} date - The date to validate
 * @returns {Boolean} - Returns true if the date is valid, otherwise false
 */
export function validateDate(date) {
	const pattern = /^\d{4}-\d{2}-\d{2}$/;
	return pattern.test(date);
}