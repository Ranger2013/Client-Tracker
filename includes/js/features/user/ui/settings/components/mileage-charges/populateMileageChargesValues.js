export default function populateMileageChargesValues(mileageRanges) {
	if (mileageRanges) {
		// Set the number of fuel ranges the user has
		fuelRanges.value = mileageRanges.length;

		// Create a fragment to attach the DOM elements from inside the for loop
		const fragment = document.createDocumentFragment();

		// Loop through the array to show all the ranges and fuel costs
		for (let i = 0; i < mileageRanges.length; i++) {
			const row = buildEle({
				type: 'div',
				myClass: ['w3-row', 'w3-padding-small']
			});

			const firstCol = buildEle({
				type: 'div',
				myClass: ['w3-col', 'm6'],
				text: `Mileage Range ${i + 1}`
			});

			const deleteRangeContainer = buildEle({
				type: 'div',
				myClass: ['w3-small', 'w3-text-red']
			});

			const deleteRangeLabel = buildEle({
				type: 'label',
				attributes: { for: `delete-range-${i + 1}` },
				text: 'Delete this Range: '
			});

			const deleteCheckBox = buildEle({
				type: 'input',
				attributes: {
					id: `delete-range-${i + 1}`,
					type: 'checkbox',
					value: `${i + 1}`
				}
			});

			// Put the first row together
			deleteRangeContainer.appendChild(deleteRangeLabel);
			deleteRangeContainer.appendChild(deleteCheckBox);
			firstCol.appendChild(deleteRangeContainer);
			row.appendChild(firstCol);

			// Set an event listener for the deleteCheckBox
			deleteCheckBox.addEventListener('change', deleteMileageRange)

			// Start building the 2nd column
			const secondCol = buildEle({
				type: 'div',
				myClass: ['w3-col', 'm6']
			});

			const mileageParagraph = buildEle({
				type: 'p',
			});

			const rangeLabel = buildEle({
				type: 'label',
				attributes: { for: `mileage-range-${i + 1}` },
				text: 'Mileage Range:'
			});

			const rangeSpan = buildEle({
				type: 'span',
				myClass: ['w3-small'],
				text: ' (format: 51-60)'
			});

			const rangeInput = buildEle({
				type: 'input',
				attributes: {
					id: `mileage-range-${i + 1}`,
					type: 'text',
					title: 'Mileage Range: e.g. 51-60',
					placeholder: 'Mileage Range: 51-60',
					name: `mileage_range_${i + 1}`,
					value: cleanUserOutput(mileageRanges[i].range),
					required: 'required'
				},
				myClass: ['w3-input', 'w3-border', 'w3-light-green']
			});

			const rangeInputError = buildEle({
				type: 'div',
				attributes: { id: `mileage-range-error-${i + 1}` }
			});

			mileageParagraph.appendChild(rangeLabel);
			mileageParagraph.appendChild(rangeSpan);
			mileageParagraph.appendChild(rangeInput);
			mileageParagraph.appendChild(rangeInputError);
			secondCol.appendChild(mileageParagraph);

			const fuelCostParagraph = buildEle({
				type: 'p'
			});

			const fuelCostLabel = buildEle({
				type: 'label',
				attributes: { for: `fuel-cost-${i + 1}` },
				text: 'Fuel Cost:'
			});

			const fuelCostInput = buildEle({
				type: 'input',
				attributes: {
					id: `fuel-cost-${i + 1}`,
					type: 'number',
					title: 'Fuel Cost',
					placeholder: 'Fuel Cost',
					name: `fuel_cost_${i + 1}`,
					value: cleanUserOutput(mileageRanges[i].cost),
					required: 'required'
				},
				myClass: ['w3-input', 'w3-border', 'w3-light-green']
			});

			const fuelCostInputError = buildEle({
				type: 'div',
				attributes: { id: `fuel-cost-error-${i + 1}` }
			});

			// Put it together
			fuelCostParagraph.appendChild(fuelCostLabel);
			fuelCostParagraph.appendChild(fuelCostInput);
			fuelCostParagraph.appendChild(fuelCostInputError);
			secondCol.appendChild(fuelCostParagraph);
			row.appendChild(secondCol);
			fragment.appendChild(row);
		}

		fuelRangeContainer.innerHTML = '';
		fuelRangeContainer.appendChild(fragment);
	}
}

