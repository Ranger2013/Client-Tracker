
export default async function showAccessoriesSelectElement(evt, iterator) {
	try {
		// Get the service cost element
		const service = document.getElementById(`service-cost-${iterator}`);

		document.getElementById(`accessories-container-${iterator}`)
			.classList.toggle('w3-hide', service.options[service.selectedIndex].value.includes('trim'));
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		handleError(
			'showAccessoriesSelectElementError',
			'Show accessories select element error: ',
			err,
			'We encountered an error. Unable to show accessories at this time.',
			`accessories-container-${iterator}`
		)
	}
}