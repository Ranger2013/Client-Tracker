
import { buildEle } from "../../../../utils/dom/domUtils.js";
import makeInputsGreen from "./makeInputsGreen.js";

export default function buildInputBlocks(numBlocks, inputName, form, display, value = null) {
	try {
		if (typeof display === 'string') {
			display = document.getElementById(display);
			if (!display) {
				console.warn('Display element not found:', display);
				return;
			}
		}

		const children = display.children.length;

		if (numBlocks > children) {
			// Add input blocks
			for (let i = children; i < numBlocks; i++) {
				const iterationValue = (value && value.length > i) ? value[i] : null;
				display.appendChild(buildBlock(i + 1, inputName, iterationValue));
			}
		} else if (numBlocks < children && numBlocks !== 0 && numBlocks !== '') {
			// Remove excess blocks
			for (let i = children; i > numBlocks; i--) {
				display.removeChild(display.lastChild);
			}
		}

		if (numBlocks === 0) {
			display.innerHTML = '';
		}

		// Apply green class to inputs
		makeInputsGreen(form);
	}
	catch (err) {
		console.warn('build input blocks error: ', err);
		throw err;
	}
}

function buildBlock(i, name, value = null) {
	const block = buildEle({
		type: 'div',
		attributes: { id: `${name}-block-${i}` },
		myClass: ['w3-margin-top-small', 'w3-padding-small'],
	});

	const productNameLabel = buildEle({
		type: 'label',
		myClass: ['w3-margin-top-small', 'w3-small'],
		text: 'Product Name:',
	});

	const productNameInput = buildEle({
		type: 'input',
		attributes: {
			id: `${name}-name-${i}`,
			type: 'text',
			name: `${name}_name_${i}`,
			required: 'required',
			placeholder: 'Name of Product',
			title: 'Name of Product',
		},
		myClass: ['w3-input', 'w3-border', 'w3-medium'],
	});

	// Input the name value if we have one
	productNameInput.value = value && value.name ? value.name : '';

	const productCostLabel = buildEle({
		type: 'label',
		myClass: ['w3-small'],
		text: 'Product Cost',
	});

	const productCostInput = buildEle({
		type: 'input',
		attributes: {
			id: `${name}-cost-${i}`,
			type: 'number',
			name: `${name}_cost_${i}`,
			required: 'required',
			placeholder: 'Cost of Product',
			title: 'Cost of Product'
		},
		myClass: ['w3-input', 'w3-border', 'w3-medium']
	});

	// Input the cost value if we have one
	productCostInput.value = value && value.cost ? value.cost : '';

	productNameLabel.appendChild(productNameInput);
	productCostLabel.appendChild(productCostInput);
	block.appendChild(productNameLabel);
	block.appendChild(productCostLabel);

	return block;
}