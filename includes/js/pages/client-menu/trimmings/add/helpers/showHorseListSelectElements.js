
import { buildEle } from "../../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../../utils/event-listeners/listeners.js";
import calculateTotalCost from "./calculateTotalCost.js";

/**
 * Shows the horse list select elements.
 * 
 * @param {Object} params - The parameters for the function.
 * @param {number} params.iterator - The iterator for the elements.
 * @param {Array} params.horseListOptions - The options for the horse list select element.
 * @param {Array} params.farrierPricesOptions - The options for the farrier prices select element.
 * @param {Array} params.accessoryOptions - The options for the accessory select element.
 * @returns {Promise<HTMLElement>} The created row element containing the select elements.
 */
export default async function buildHorseListSelectElements({ iterator, horseListOptions, farrierPricesOptions, accessoryOptions }) {
	try {
		const i = iterator;

		// Outer div
		const row = buildEle({
			type: 'div',
			myClass: ['w3-row', 'w3-padding-small', 'w3-border-bottom', 'w3-margin-bottom'],
		});

		const firstCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
		});

		const firstColLabel = buildEle({
			type: 'label',
			attributes: { for: `horse-list-${i}` },
			text: 'Horse\'s Name:',
		});

		const secondCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
		});

		// Creates the select element for the list of horses
		const horseListSelect = createSelectElement({
			id: `horse-list-${i}`,
			name: `horse_list_${i}`,
			title: 'Select a Horse',
			options: horseListOptions,
			nullOptionText: '-- Select Horse --',
		});

		// Build the error element for the horse-list-x
		const horseListSelectError = buildEle({
			type: 'div',
			attributes: { id: `horse-list-${i}-error` },
		});

		// Creates the select element for the farrier's pricing
		const serviceCostSelect = createSelectElement({
			id: `service-cost-${i}`,
			name: `service_cost_${i}`,
			title: 'Type of Service',
			options: farrierPricesOptions,
		});

		// Creates the select element for the farrier's accessories pricing
		const accessoriesSelect = createSelectElement({
			id: `accessories-${i}`,
			name: `accessories_${i}`,
			title: 'Select the Accessories',
			options: accessoryOptions,
			nullOptionText: '-- Select Accessory --',
			multiple: true,
			disabled: true,
		});

		// Build the services container
		const servicesContainer = buildEle({
			type: 'div',
			attributes: { id: `services-container-${i}` },
			myClass: ['w3-padding-small', 'w3-hide'],
		});
		servicesContainer.appendChild(serviceCostSelect);

		// Build the accessories container
		const accessoriesContainer = buildEle({
			type: 'div',
			attributes: { id: `accessories-container-${i}` },
			myClass: ['w3-padding-small', 'w3-hide'],
		});
		accessoriesContainer.appendChild(accessoriesSelect);

		// Change cost check box container
		const changeCostCheckboxContainer = buildEle({
			type: 'div',
			attributes: { id: `checkbox-container-${i}` },
			myClass: ['w3-padding-small', 'w3-hide'],
			text: ' Change price of your service.',
		});

		const changeCostCheckbox = buildEle({
			type: 'input',
			attributes: {
				id: `checkbox-cost-${i}`,
				name: `checkbox_cost_${i}`,
				type: 'checkbox',
				value: '1',
				title: 'Change cost of your service',
			},
			myClass: ['w3-checkbox'],
		});

		const changeCostInputContainer = buildEle({
			type: 'div',
			attributes: { id: `change-cost-container-${i}` },
			myClass: ['w3-padding-small', 'w3-hide'],
		});

		const changeCostSpan = buildEle({
			type: 'span',
			myClass: ['w3-text-red', 'w3-small'],
			text: 'This does not change the accessory cost.',
		});

		const changeCostInput = buildEle({
			type: 'input',
			attributes: {
				id: `cost-change-${i}`,
				type: 'number',
				title: 'Change cost of selected service.',
				placeholder: 'Change service cost',
				disabled: 'disabled',
			},
			myClass: ['w3-input', 'w3-border'],
		});

		// Put it all together
		firstCol.appendChild(firstColLabel);
		secondCol.appendChild(horseListSelect);
		secondCol.appendChild(horseListSelectError);
		secondCol.appendChild(servicesContainer);
		secondCol.appendChild(accessoriesContainer);
		changeCostCheckboxContainer.prepend(changeCostCheckbox);
		secondCol.appendChild(changeCostCheckboxContainer);
		changeCostInputContainer.appendChild(changeCostSpan);
		changeCostInputContainer.appendChild(changeCostInput);
		secondCol.appendChild(changeCostInputContainer);

		row.appendChild(firstCol);
		row.appendChild(secondCol);

		// Set the event listener to show or hide the accessories if selected element is not trim
		addListener(serviceCostSelect, 'change', async (evt) => {
			// Show the accessories container if the service is not a trim
			handleShowingAccessoriesSelect(evt, accessoriesContainer, accessoriesSelect);

			// Update the change cost input field
			await updateChangeCostInput({ evt, changeCostInput });

			// Calculate the total cost
			await calculateTotalCost();
		});

		addListener(accessoriesSelect, 'change', async (evt) => {
			await calculateTotalCost();
		});

		// Set the event listener to show the change cost input if the checkbox is checked
		addListener(changeCostCheckbox, 'change', async (evt) => {
			// Show the change cost input container if the checkbox is checked

			if (changeCostInputContainer.classList.contains('w3-hide')) {
				changeCostInputContainer.classList.remove('w3-hide');
			}
			else {
				changeCostInputContainer.classList.add('w3-hide');
			}

			// Toggle showing the input field
			changeCostInput.disabled = !evt.target.checked;
		});

		// Add the event listener for when the farrier changes the cost of the selected service
		addListener(changeCostInput, 'input', async (evt) => {
			await changeServiceCost({ evt, serviceCostSelect });

			await calculateTotalCost();
		});

		return row;
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		handleError(
			'showHorseListSelectElementsError',
			'Show horse list select elements error: ',
			err,
			'We encountered an error. Unable to show the horse list select elements at this time.',
			'form-msg'
		);
	}
}

/**
 * Creates a select element with options.
 * 
 * @param {string} id - The ID of the select element.
 * @param {string} name - The name of the select element.
 * @param {string} title - The title of the select element.
 * @param {Array} options - The options to be added to the select element.
 * @param {string} nullOptionText - The text for the null option.
 * @param {boolean} [multiple=false] - Whether the select element allows multiple selections.
 * @param {boolean} [disabled=false] - Whether the select element is disabled.
 * @returns {HTMLElement} The created select element.
 */
function createSelectElement({ id, name, title, options, nullOptionText, multiple = false, disabled = false }) {
	const attributes = {
		id,
		name,
		title,
		required: 'required',
		multiple: multiple ? 'multiple' : undefined,
		disabled: disabled ? 'disabled' : undefined,
	};

	// Removed undefined attributes
	Object.keys(attributes).forEach(key => attributes[key] === undefined && delete attributes[key]);

	const selectElement = buildEle({
		type: 'select',
		attributes,
		myClass: ['w3-input', 'w3-border'],
	});

	if (nullOptionText) {
		const nullOption = buildEle({
			type: 'option',
			attributes: {
				value: 'null',
				disabled: 'disabled',
				selected: 'selected',
			},
			text: nullOptionText,
		});

		selectElement.appendChild(nullOption);
	}

	options.forEach(option => {
		const clonedOption = option.cloneNode(true);
		selectElement.appendChild(clonedOption);
	});

	return selectElement;
}

async function updateChangeCostInput({ evt, changeCostInput }) {
	try {
		const selectElements = document.querySelectorAll('select[id^="service-cost-"]');
		const originalServiceCostValue = evt.target.value;
		changeCostInput.value = originalServiceCostValue.split(':')[1];
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'updateChangeCostInputError',
			'Update change cost input error: ',
			err,
		);
	}
}

async function changeServiceCost({ evt, serviceCostSelect }) {
	try {
		const newCost = evt.target.value;
		// Get the name of the service
		const serviceName = serviceCostSelect.options[serviceCostSelect.selectedIndex].value.split(':')[0];
		// Change the value of the selected service
		serviceCostSelect.options[serviceCostSelect.selectedIndex].value = `${serviceName}:${newCost}`;
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'changeServiceCostError',
			'Change service cost error: ',
			err,
		);
	}
}

function handleShowingAccessoriesSelect(evt, container, select) {
	// Show the accessories container if the service is not a trim
	container.classList.toggle('w3-hide', evt.target.value.includes('trim'));

	// Disable the accessories select if the service is a trim
	select.disabled = evt.target.value.includes('trim');
}
