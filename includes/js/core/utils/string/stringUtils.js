/**
 * Removes the underscore and replaces it with a hyphen, then it adds the -error to the string
 * 
 * @param {string} str - The string to remove underscores and replace with a hyphen. Adds -error to the string
 * @returns {string} - The string that has been transformed.
 */
export function underscoreToHyphenPlusError(str) { 
	return str.replace(/_/g, '-') + '-error';
}

/**
 * Converts all underscores to hyphens in a string
 * 
 * @param {string} str - The string to convert all underscores to hyphens
 * @returns {string} - The transformed string
 */
export function underscoreToHyphen(str) {
	return str.replace(/_/g, '-');
}

/**
 * Converts all hyphens to underscores in a string
 * 
 * @param {string} str - The string to transform all hyphens to underscores
 * @returns {string} - The transformed string
 */
export function hyphenToUnderscore(str) {
	return str.replace(/-/g, '_');
}

/**
 * Converts all hyphens to spaces in a string
 * 
 * @param {string} str - The string to transform all hyphens to spaces
 * @returns {string} - The transformed string
 */

export function hyphenToSpaces(str){
	return str.replace(/-/g, ' ');
}

/**
 * Convert all underscores to spaces
 * 
 * @param {string} str - The string to convert all underscores to spaces
 * @returns {string} - The transformed string
 */
export function underscoreToSpaces(str) {
	return str.replace(/_/g, ' ');
}

/**
 * Convert all spaces in the string to underscores
 * 
 * @param {string} str - The string to transform all spaces to underscores
 * @returns {string} - The transformed string
 */
export function spacesToUnderscores(str) {
	return str.replace(/ /g, '_');
}

/**
 * Converts the first character of each word in a string to uppercase
 * 
 * @param {string} str - The string to be transformed
 * @returns {string} - The transformed string with each word capitalized
 */
export function ucwords(str, allCaps = true) {
	if (allCaps) {
		return (str + '').replace(/^(.)|\s+(.)/g, function ($1) {
			return $1.toUpperCase();
		});
	}
	else {
		return (str + '').replace(/\b\w/g, function ($1,offset) {
			return offset === 0 ? $1.toLowerCase() : $1.toUpperCase();
		});
	}
}

export function cleanUserOutput(output) {
    if (!output && output !== 0) return '';
    
    return String(output)
        .replace(/&/g, '&amp;')      // Must be first to not double-escape
        .replace(/</g, '&lt;')       // Prevents script injection
        .replace(/>/g, '&gt;')       // Prevents script injection
        .replace(/"/g, '&quot;')     // Handles quotes
        .replace(/'/g, '&#039;')     // Handles single quotes
        .replace(/(\r\n|\n\r|\r|\n)/g, '<br>') // Handle line breaks
        .trim();
}
