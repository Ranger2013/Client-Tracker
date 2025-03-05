import { buildGenericSelectOptions } from '../../../../../utils/dom/forms/buildGenericSelectOptions.js';
import { buildElementsFromConfig } from './utilities.js';

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

export default async function buildSearchBlockSection(filterOptions) {
	try {
		const elements = buildElementsFromConfig(PAGE_CONFIG);

		// Building options seperately
		const selectOptions = buildGenericSelectOptions(filterOptions);

		// Assemble the DOM structure
		elements.searchBlock.append(elements.searchMsg, elements.searchRow);
		elements.searchRow.append(elements.filterCol, elements.searchCol);
		elements.searchCol.appendChild(elements.searchInput);
		elements.filterCol.appendChild(elements.filterSelect);
		elements.filterSelect.append(...selectOptions);

		return elements.searchBlock;
	}
	catch (err) {
		console.log(err);
	}
}