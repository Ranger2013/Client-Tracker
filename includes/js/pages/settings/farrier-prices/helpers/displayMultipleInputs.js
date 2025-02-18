
import { myError, top } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import buildInputBlocks from "./buildInputBlocks.js";

export default function displayMultipleInputs(fm, form) {
	try {
		// Set up the id's for the pads, packing and wedges
		const inputs = {
			pads: {
				eleId: 'num-pads',
				displayEle: 'display-pads'
			},
			packing: {
				eleId: 'num-packing',
				displayEle: 'display-packing'
			},
			wedges: {
				eleId: 'num-wedges',
				displayEle: 'display-wedges'
			},
		};

		for (const input in inputs) {
			addListener(inputs[input].eleId, 'input', (evt) => {
				buildInputBlocks(evt.target.value, input, form, inputs[input].displayEle)
			});
		}
	}
	catch (err) {
		console.warn('display multiple inputs error: ', err);
		myError(fm, 'There was an error building the accessory blocks.');
		top();
	}
}