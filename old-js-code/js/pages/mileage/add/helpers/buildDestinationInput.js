import { buildEle } from "../../../../utils/dom/domUtils.js";

export default async function buildDestinationInput(container) {
	try {
		// Get the destination input
		const input = buildEle({
			type: 'input',
			attributes: {
				type: 'text',
				name: 'destination',
				title: 'Your Destination',
				placeholder: 'Destination',
				required: true,
			},
			myClass: ['w3-input', 'w3-border'],
		});

		container.innerHTML = '';
		container.appendChild(input);
	}
	catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('buildDestinationInputError', 'Build destination input error: ', err, 'Unable to build the destination input.', container);
	}
}