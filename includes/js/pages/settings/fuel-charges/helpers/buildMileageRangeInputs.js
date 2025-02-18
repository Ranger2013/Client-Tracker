
import buildSubmitButtonSection from "../../../../utils/page-builders/helpers/buildSubmitButtonSection.js";
import buildFuelRangeSection from "./buildFuelRangeSection.js";

export default async function buildMileageRangeInputs(evt, rangeContainer, values) {
	try {
		const ranges = parseInt(evt.target.value, 10);
		const currentChildren = rangeContainer.children.length;

		// Clear the container if ranges is explicitly set to 0
		if (ranges === 0) {
			rangeContainer.innerHTML = '';
			await handleSubmitButtonVisibility(rangeContainer, 0);
			return;
		}

		// Add or remove range sections as needed
		if (ranges > currentChildren) {
			for (let i = currentChildren; i < ranges; i++) {
				const rangeSection = buildFuelRangeSection(i + 1, values?.[i] || {});
				rangeContainer.appendChild(rangeSection);
			}
		} else if (ranges < currentChildren && ranges !== 0 && evt.target.value !== '') {
			for (let i = currentChildren; i > ranges; i--) {
				rangeContainer.removeChild(rangeContainer.lastChild);
			}
		}

		// Handle the submit button visibility
		await handleSubmitButtonVisibility(rangeContainer, ranges);
	}
	catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('buildMileageRangeInputsError', 'Build mileage range input error: ', err);
	}
}

async function handleSubmitButtonVisibility(container, numberChildren) {
	// Create the submit button
	const buttonSection = document.getElementById('button-section');
	
	// If we don't have the submit button, add it.
	if (!buttonSection && numberChildren > 0) {
		const submitButton = await buildSubmitButtonSection('Add Fuel Charges');
		// Add the submit button
		container.parentElement.appendChild(submitButton);
	}
	// If number children is 0, remove the submit button
	else if (numberChildren === 0 && buttonSection) {
		buttonSection.remove();
	}
}