
import ManageUser from "../../../../classes/ManageUser.js";
import { myError } from "../../../../utils/dom/domUtils.js";
import buildInputBlocks from "./buildInputBlocks.js";

export default async function populateFarrierPricesForm(fm, form) {
	try {
		const manageUser = new ManageUser();
		const farrierPrices = await manageUser.getFarrierPrices();
		
		if(farrierPrices){
			handleFarrierPrices(form, farrierPrices);
			handleAccessories(form, farrierPrices.accessories);
		}
	}
	catch (err) {
		console.warn('populate farrier prices form error: ', err);
		myError(fm, 'There was a problem populating the form with your current pricing.');
	}
}

function handleFarrierPrices(form, farrierPrices) {
	try {
		// Get the form elements
		form.querySelectorAll('input').forEach(input => {
			// This takes care of the farrier prices
			if (farrierPrices[input.name]) {
				input.value = farrierPrices[input.name];
			}
		});
	}
	catch (err) {
		console.warn('handle farrier prices error: ', err);
		throw err;
	}
}

function handleAccessories(form, accessoryPrices) {
	try {
		// Set the accessory inputs
		const accessories = [
			'pads',
			'packing',
			'wedges',
			'rockers',
			'clips',
			'casting',
			'sedation',
		];

		accessories.forEach(accessory => {
			const accessoryValues = accessoryPrices[accessory];
			if (accessoryValues) {
				const numberInput = document.getElementById(`num-${accessory}`);
				const displayElement = document.getElementById(`display-${accessory}`);
				const singleInput = document.getElementById(accessory);

				if (numberInput) {
					const valueLength = accessoryValues.length;
					numberInput.value = valueLength > 0 ? valueLength : '';

					if (valueLength > 0 && displayElement) {
						buildInputBlocks(valueLength, accessory, form, displayElement, accessoryValues);
					}
				} else if (singleInput && accessoryValues.length > 0) {
					singleInput.value = accessoryValues[0].cost;
				}
			}
		});
	}
	catch (err) {
		console.warn('handle accessories error: ', err);
		throw err;
	}
}