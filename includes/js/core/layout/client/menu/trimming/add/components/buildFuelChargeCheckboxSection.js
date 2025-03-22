import { buildElementsFromConfig } from '../../../../../../utils/dom/elements.min.js';

export default async function buildFuelChargeCheckboxSection(cost) {
	try {
		const PAGE_MAPPING = {
			container: { type: 'div', myClass: ['w3-row'] },
			emptyCol: { type: 'div', myClass: ['w3-col', 'm6'], attributes: { style: 'height: 5px' }, text: '&nbsp;' },
			fuelCol: { type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-center'] },
			fuelLabel: { type: 'label', text: 'Remove Mileage Charge: ' },
			fuelCheckBox: { type: 'input', attributes: { id: 'mileage', type: 'checkbox', name: 'fuel_charges', value: 'yes' } },
			costDisplay: { type: 'div', attributes: { id: 'fuel-cost-display'}, myClass: ['w3-padding-small'], text: `Mileage Charge: $${cost}` },
			fuelHiddenInput: { type: 'input', attributes: { id: 'mileage-charges', type: 'hidden', name: 'mileage_cost', value: cost } },
			errorContainer: { type: 'div', attributes: { id: 'mileage-charges-error' } },
		};

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);
		const {
			container,
			emptyCol,
			fuelCol,
			fuelLabel,
			fuelCheckBox,
			costDisplay,
			fuelHiddenInput,
			errorContainer,
		} = pageElements;

		// Put it all together
		fuelLabel.appendChild(fuelCheckBox);
		fuelCol.append(fuelLabel, costDisplay, fuelHiddenInput, errorContainer);
		container.append(emptyCol, fuelCol);

		return container;
	}
	catch (err) {
		const { AppError } = await import("../../../../../../errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		});

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		pageElements.fuelCol.innerHTML = 'Error building the fuel charge checkbox.';
		pageElements.container.classList.add('w3-text-red');

		// Append the elements
		pageElements.container.append(pageElements.emptyCol, pageElements.fuelCol);
		return pageElements.container;
	}
}