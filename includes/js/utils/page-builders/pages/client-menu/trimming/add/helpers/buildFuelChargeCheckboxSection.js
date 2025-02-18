import calculateTotalCost from "../../../../../../../pages/client-menu/trimmings/add/helpers/calculateTotalCost.js";
import { buildEle } from "../../../../../../dom/domUtils.js";
import { addListener } from "../../../../../../event-listeners/listeners.js";

export default async function buildFuelChargeCheckboxSection(cost) {
	try {
		const container = buildEle({ type: 'div', myClass: ['w3-row'] });
		const emptyCol = buildEle({ type: 'div', myClass: ['w3-col', 'm6'], attributes: { style: 'height: 5px' }, text: '&nbsp;' });
		const fuelCol = buildEle({ type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-center'] });
		const fuelLabel = buildEle({ type: 'label', text: 'Remove Mileage Charge: ' });
		const fuelCheckBox = buildEle({ type: 'input', attributes: { id: 'mileage', type: 'checkbox', name: 'fuel_charges', value: 'yes' } });
		const fuelHiddenInput = buildEle({ type: 'input', attributes: { id: 'mileage-charges', type: 'hidden', name: 'mileage_cost', value: cost } });
		const errorContainer = buildEle({ type: 'div', attributes: { id: 'mileage-charges-error'}});

		// Put it all together
		fuelLabel.appendChild(fuelCheckBox);
		fuelCol.appendChild(fuelLabel);
		fuelCol.appendChild(fuelHiddenInput);
		fuelCol.appendChild(errorContainer);
		container.appendChild(emptyCol);
		container.appendChild(fuelCol);

		// Add the event listener to remove the fuel charges
		addListener(fuelCheckBox, 'change', async () => {
			fuelHiddenInput.disabled = !fuelHiddenInput.disabled;
			await calculateTotalCost(); // This function is declared, but I have not yet finished building it
		});

		return container;
	}
	catch (err) {
		const { handleError } = await import("../../../../../../error-messages/handleError.js");
		await handleError('buildFuelChargeCheckboxSectionError', 'Build fuel charge checkbox section error: ', err);
	}
}
