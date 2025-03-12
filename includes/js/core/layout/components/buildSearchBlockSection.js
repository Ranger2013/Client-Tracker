import { buildEle, buildElementsFromConfig, buildGenericSelectOptions } from '../../utils/dom/elements.js';

/**
 * Configuration for search block UI elements
 * @typedef {Object} SearchBlockConfig
 * @property {Object} searchBlock - Main container configuration
 * @property {Object} searchMsg - Message display container
 * @property {Object} searchRow - Row container for inputs
 * @property {Object} filterCol - Column for filter select
 * @property {Object} filterSelect - Filter dropdown configuration
 * @property {Object} searchCol - Column for search input
 * @property {Object} searchInput - Search input configuration
 */
const PAGE_CONFIG = {
	searchBlock: {
		type: 'div',
		attributes: { id: 'search-block' },
		myClass: ['w3-padding'],
	},
	searchMsg: {
		type: 'div',
		attributes: { id: 'search-msg' },
		myClass: ['w3-center']
	},
	searchRow: {
		type: 'div',
		myClass: ['w3-row']
	},
	filterCol: {
		type: 'div',
		myClass: ['w3-col', 'm6', 'w3-padding-small'],
	},
	filterSelect: {
		type: 'select',
		attributes: {
			id: 'filter',
			name: 'filter',
			title: 'Filter Search'
		},
		myClass: ['w3-input', 'w3-border']
	},
	searchCol: {
		type: 'div',
		myClass: ['w3-col', 'm6', 'w3-padding-small'],
	},
	searchInput: {
		type: 'input',
		attributes: {
			id: 'search',
			type: 'search',
			name: 'search',
			placeholder: 'Search'
		},
		myClass: ['w3-input', 'w3-border']
	},
};

/**
 * Builds the search block with filter options and search input
 * @param {Object} filterOptions - Options configuration
 * @param {Array} filterOptions.list - Array of option items
 * @param {Function} filterOptions.value - Value extractor function
 * @param {Function} filterOptions.text - Text extractor function
 * @returns {Promise<HTMLElement>} The constructed search block
 * @throws {Error} If building elements fails
 */
export default async function buildSearchBlockSection(filterOptions) {
	try {
		const elements = buildElementsFromConfig(PAGE_CONFIG);

		// Build options separately
		const selectOptions = buildGenericSelectOptions(filterOptions);

		// Assembly
		elements.searchBlock.append(elements.searchMsg, elements.searchRow);
		elements.searchRow.append(elements.filterCol, elements.searchCol);
		elements.searchCol.appendChild(elements.searchInput);
		elements.filterCol.appendChild(elements.filterSelect);
		elements.filterSelect.append(...selectOptions);  // Append options to select

		return elements.searchBlock;
	}
	catch (err) {
		const { AppError } = await import("../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		});

		return buildEle({
			type: 'div',
			myClass: ['w3-center', 'w3-text-red'],
			text: 'Unable to build the search block.'
		});
	}
}
