
import { buildEle, clearMsg } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";

export default function buildFuelRangeSection(iteration, values = {}) {
	try {
		const row = buildEle({
			type: 'div',
			myClass: ['w3-row', 'w3-padding-small'],
		});

		const colOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
			text: `Mileage Range ${iteration}`,
		});

		const colTwo = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
		});

		const rangeInput = buildMileageRangeInput(iteration, values.range);
		const costInput = buildCostInput(iteration, values.cost);

		row.appendChild(colOne);
		colTwo.appendChild(rangeInput);
		colTwo.appendChild(costInput);
		row.appendChild(colTwo);

		return row;
	}
	catch (err) {
		console.warn('build fuel range section error: ', err);		
	}
}

function buildMileageRangeInput(iteration, value) {
	const p1 = buildEle({
		type: 'p',
	});

	const rangeLabel = buildEle({
		type: 'label',
		attributes: { for: `mileage-range-${iteration}` },
		text: 'Mileage Range'
	});

	const rangeSpan = buildEle({
		type: 'span',
		myClass: ['w3-small'],
		text: '(format: 50-59)',
	});

	const rangeInput = buildEle({
		type: 'input',
		attributes: {
			id: `mileage-range-${iteration}`,
			type: 'text',
			title: 'Mileage Range: e.g. 50-59',
			placeholder: 'Mileage Range: 50-59',
			name: `mileage_range_${iteration}`,
			required: 'required',
			value: value || ''
		},
		myClass: ['w3-input', 'w3-border'],
	});

	const rangeInputError = buildEle({
		type: 'div',
		attributes: { id: `mileage-range-${iteration}-error` }
	});

	p1.appendChild(rangeLabel);
	p1.appendChild(rangeSpan);
	p1.appendChild(rangeInput);
	p1.appendChild(rangeInputError);

	// Add an event listener to clear any error messages
	addListener(rangeInput, 'focus', () => {
		clearMsg({ container: rangeInputError, input: rangeInput });
	});

	return p1;
}

function buildCostInput(iteration, value) {
	const p1 = buildEle({
		type: 'p',
	});

	const rangeLabel = buildEle({
		type: 'label',
		attributes: { for: `fuel-cost-${iteration}` },
		text: 'Fuel Cost'
	});

	const rangeInput = buildEle({
		type: 'input',
		attributes: {
			id: `fuel-cost-${iteration}`,
			type: 'number',
			title: 'Fuel Costs',
			placeholder: 'Fuel Costs',
			name: `fuel_cost_${iteration}`,
			required: 'required',
			value: value || ''
		},
		myClass: ['w3-input', 'w3-border'],
	});

	const rangeInputError = buildEle({
		type: 'div',
		attributes: { id: `fuel-cost-${iteration}-error` }
	});

	p1.appendChild(rangeLabel);
	p1.appendChild(rangeInput);
	p1.appendChild(rangeInputError);

	// Add an event listener to clear any error messages
	addListener(rangeInput, 'focus', () => {
		clearMsg({ container: rangeInputError, input: rangeInput });
	});

	return p1;
}