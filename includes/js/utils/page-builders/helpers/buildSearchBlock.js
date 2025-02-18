import { buildEle } from "../../dom/domUtils.js";

/**
 * Builds the search block with filter options and search input.
 * @param {Array<Object>} filterOptions - Array of filter options for the select element.
 * @param {string} filterOptions[].value - The value attribute for the option element.
 * @param {string} filterOptions[].text - The text content for the option element.
 * @returns {HTMLElement} The constructed search block element.
 */
export default async function buildSearchBlock(filterOptions) {
	// Build the search block container
	const searchBlock = buildEle({
		type: 'div',
		attributes: { id: 'search-block' },
		myClass: ['w3-padding']
	});

	try {
		// Build and append the search message container
		const searchMsg = buildEle({
			type: 'div',
			attributes: { id: 'search-msg' },
			myClass: ['w3-center']
		});
		searchBlock.appendChild(searchMsg);

		// Build and append the search row container
		const searchRow = buildEle({ type: 'div', myClass: ['w3-row'] });
		searchBlock.appendChild(searchRow);

		// Build and append the filter column
		const filterCol = buildEle({ type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small'] });
		searchRow.appendChild(filterCol);

		// Build and append the filter select element
		const filterSelect = buildEle({
			type: 'select',
			attributes: {
				id: 'filter',
				name: 'filter',
				title: 'Filter Search'
			},
			myClass: ['w3-input', 'w3-border']
		});
		filterCol.appendChild(filterSelect);

		// Add options to the filter select element
		filterOptions.forEach(option => {
			const optionElement = buildEle({
				type: 'option',
				attributes: { value: option.value },
				text: option.text
			});
			filterSelect.appendChild(optionElement);
		});

		// Build and append the search input column
		const searchCol = buildEle({ type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small'] });
		searchRow.appendChild(searchCol);

		// Build and append the search input element
		const searchInput = buildEle({
			type: 'input',
			attributes: {
				id: 'search',
				type: 'search',
				name: 'search',
				placeholder: 'Search'
			},
			myClass: ['w3-input', 'w3-border']
		});
		searchCol.appendChild(searchInput);

		return searchBlock;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('buildSearchBlockError', 'Build search block error: ', err);
		
		const errorEle = buildEle({
			type: 'div',
			myClass: ['w3-text-red'],
			text: 'An error occurred while building the search block.',
		});

		searchBlock.appendChild(errorEle);
		return searchBlock;
	}
}