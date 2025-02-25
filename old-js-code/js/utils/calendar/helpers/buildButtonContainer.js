import { buildEle } from "../../dom/domUtils.js";

export default async function buildButtonContainer(datesArray, fm) {
	try {
		const submitButtonContainer = buildEle({
			type: 'div',
			myClass: ['w3-margin-top', 'w3-center'],
			attributes: {
				id: 'button-container',
			}
		});

		const submitButton = buildEle({
			type: 'button',
			myClass: ['w3-button', 'w3-black', 'w3-margin-right'],
			attributes: {
				id: 'submit-button',
			},
			text: 'Submit',
		});

		const clearDatesButton = buildEle({
			type: 'button',
			myClass: ['w3-button', 'w3-red', 'w3-margin-left'],
			attributes: {
				id: 'clear-dates-button',
			},
			text: 'Clear All Dates',
		});

		submitButtonContainer.appendChild(submitButton);
		submitButtonContainer.appendChild(clearDatesButton);

		return submitButtonContainer;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('buildButtonContainerError', 'Build Button Container Error: ', err);
	}
}	
