import { buildElementsFromConfig } from '../../utils/dom/elements.js';

export default async function buildInvoicePaidCheckbox() {
	try {
		const PAGE_MAPPING = {
			container: { type: 'div', myClass: ['w3-container', 'w3-margin-bottom', 'w3-margin-top', 'w3-center'] },
			paidLabel: { type: 'label', myClass: ['w3-bold'], text: 'Invoice Paid: ' },
			paidCheckbox: { type: 'input', attributes: { id: 'paid', type: 'checkbox', name: 'paid', value: 'yes' } },
		};

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		// Put it all together and return
		const { container, paidLabel, paidCheckbox } = pageElements;
		paidLabel.appendChild(paidCheckbox);
		container.appendChild(paidLabel);
		return container;
	}
	catch (err) {
		const { handleError } = await import("../../../../../../error-messages/handleError.js");
		await handleError('buildInvoicePaidCheckboxError', 'Build invoice paid checkbox error: ', err);

		const container = buildEle({ type: 'div', myClass: ['w3-center', 'w3-text-red'], text: 'Could not build the invoice paid checkbox.' });
		return container;
	}
}