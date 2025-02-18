import { buildEle } from "../../../../../../dom/domUtils.js";

/**
 * Builds the receipt section for the form.
 * 
 * @returns {Promise<HTMLElement>} - The receipt section element.
 */
export default async function buildReceiptSection() {
	try {
		const receiptSection = buildEle({
			type: 'div',
			myClass: ['w3-row'],
		});

		const emptyCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
			attributes: { style: 'height: 5px' },
			text: '&nbsp;',
		});

		const receiptCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-center']
		});

		const receiptLabel = buildEle({
			type: 'label',
			text: ' Send Client Receipt: '
		});

		const receiptCheckBox = buildEle({
			type: 'input',
			attributes: {
				id: 'receipt',
				type: 'checkbox',
				name: 'receipt',
				value: 'yes'
			}
		});

		// Put it together
		receiptLabel.appendChild(receiptCheckBox);
		receiptCol.appendChild(receiptLabel);
		receiptSection.appendChild(emptyCol);
		receiptSection.appendChild(receiptCol);

		return receiptSection;
	}
	catch (err) {
		const { handleError } = await import("../../../../../../error-messages/handleError.js");
		await handleError('buildReceiptSectionError', 'Build receipt section error: ', err);

		// Build a small note indicating that the receipt section could not be built
		const noReceiptBuilt = buildEle({
			type: 'div',
			myClass: ['w3-text-red', 'w3-center'],
			text: 'Could not build receipt section.',
		});

		return noReceiptBuilt;
	}
}
