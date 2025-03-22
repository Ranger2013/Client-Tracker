import { buildElementsFromConfig } from '../../../../../../utils/dom/elements.min.js';

const PAGE_MAPPING = {
	receiptSection: {
		type: 'div',
		myClass: ['w3-row'],
	},
	emptyCol: {
		type: 'div',
		myClass: ['w3-col', 'm6'],
		attributes: { style: 'height: 5px' },
		text: '&nbsp;',
	},
	receiptCol: {
		type: 'div',
		myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-center'],
	},
	receiptLabel: {
		type: 'label',
		text: ' Send Client Receipt: '
	},
	receiptCheckbox: {
		type: 'input',
		attributes: {
			id: 'receipt',
			type: 'checkbox',
			name: 'receipt',
			value: 'yes',
			'data-receipt-checkbox': true,
		},
	},

};

export default async function buildReceiptSection() {
	try {
		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		// Append the elements
		pageElements.receiptLabel.appendChild(pageElements.receiptCheckbox);
		pageElements.receiptCol.append(pageElements.receiptLabel);
		pageElements.receiptSection.append(pageElements.emptyCol, pageElements.receiptCol);

		return pageElements.receiptSection;
	}
	catch (err) {
		const { AppError } = await import("../../../../../../errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		});

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		pageElements.receiptCol.innerHTML = 'Error building the send receipt checkbox.';
		pageElements.receiptSection.classList.add('w3-text-red');
		
		// Append the elements
		pageElements.receiptSection.append(pageElements.emptyCol, pageElements.receiptCol);
		return pageElements.receiptSection;
	}
}