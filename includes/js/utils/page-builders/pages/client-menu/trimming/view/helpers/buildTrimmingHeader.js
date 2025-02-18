import { buildEle } from "../../../../../../dom/domUtils";

/**
 * Build the trimming header.
 * @returns {Promise<HTMLElement>} The trimming header element.
 */
export default async function buildTrimmingHeader() {
	try {
		const displayContainer = buildEle({
			type: 'div',
			attributes: { id: 'display-trimming-container' },
			myClass: ['w3-margin-top'],
		});

		const row = buildEle({
			type: 'div',
			myClass: ['w3-row', 'w3-light-grey', 'w3-border-bottom', 'w3-border-top'],
		});

		const trimDateCol = createColumn(['w3-col', 's4', 'w3-padding-small'], 'Trim Dates', 'Dates');
		const trimCostsCol = createColumn(['w3-col', 's4', 'w3-padding-small'], 'Type Trim/Cost', '# Horses');

		const paymentCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 's4', 'w3-padding-small'],
		});

		const payment = buildEle({
			type: 'div',
			myClass: ['w3-center', 'w3-bold'],
			text: 'Payment',
		});

		paymentCol.appendChild(payment);
		row.appendChild(trimDateCol);
		row.appendChild(trimCostsCol);
		row.appendChild(paymentCol);
		displayContainer.appendChild(row);

		return displayContainer;
	} catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError('buildTrimmingHeader', 'Error building trimming header: ', err);
		throw err;
	}
}

/**
 * Helper function to create a column with specified classes and text.
 * @param {Array} colClasses - The classes for the column.
 * @param {string} bigText - The text for larger screens.
 * @param {string} smallText - The text for smaller screens.
 * @returns {HTMLElement} The column element.
 */
function createColumn(colClasses, bigText, smallText) {
	const col = buildEle({
		type: 'div',
		myClass: colClasses,
	});

	const bigElement = buildEle({
		type: 'div',
		myClass: ['w3-hide-small', 'w3-center', 'w3-bold'],
		text: bigText,
	});

	const smallElement = buildEle({
		type: 'div',
		myClass: ['w3-hide-large', 'w3-hide-medium', 'w3-center', 'w3-bold'],
		text: smallText,
	});

	col.appendChild(bigElement);
	col.appendChild(smallElement);

	return col;
}

