// Populate the form if there is anything to populate
function populateFarrierPricesValues(farrierPrices) { 
	if (farrierPrices) {
		// Your array of keywords
		let keywords = ['trim', 'shoes'];

		// Construct a query string that matches any ID containing any of the keywords
		let query = keywords.map(keyword => `[id*='${keyword}']`).join(', ');

		// Use querySelectorAll to select all matching elements
		let elements = document.querySelectorAll(query);

		// Loop through all the elements and set the pricing values for the shoes
		for (let element of elements) {
			element.value = farrierPrices[hyphenToUnderscore(element.id)] !== '' && farrierPrices[hyphenToUnderscore(element.id)] !== '0.00' ? farrierPrices[hyphenToUnderscore(element.id)] : '';
			if (element.value) {
				element.classList.add('w3-light-green');
			}
		}

		// Set the accessories
		const accessories = farrierPrices.accessories;

		// Single costss
		const singleCost = ['casting', 'clips', 'rockers', 'sedation'];

		let accQuery = singleCost.map(keyword => `[id='${keyword}']`).join(', ');

		// Loop through the accessories to populate the form
		for(let key in accessories){
			if(accessories.hasOwnProperty(key)){
				const accessoryArray = accessories[key];

				// check if the key is in the single cost array
				if(singleCost.includes(key)) {
					accessoryArray.forEach(accessory => {
						let ele = document.getElementById(key);
						ele.value = accessory.productCost !== '' && accessory.productCost !== '0.00' ? accessory.productCost : '';
						
						if(ele.value){
							ele.classList.add('w3-light-green');
						}
					});
				}
				else {
					// Check if we have pads, packings or wedges
					if(accessories[key].length > 0){
						// Get the total of accessories for this product
						const total = accessories[key].length;

						// Set the id of the number element and the display
						const id = `num-${key}`;
						const displayEle = document.getElementById(`display-${key}`);

						// Define the element
						const numEle = document.getElementById(id);
						
						// Change the value and the color
						numEle.value = total;
						numEle.classList.add('w3-light-green');

						let x = 1;
						for(const accessoryObj of accessories[key]){
							// Call the function to display the product name and cost
							displayEle.appendChild(displayAccessoryInputAndCost(x, key, accessoryObj.productName, accessoryObj.productCost));
							x++; // Iterator
						}
					}
				}				
			}
		}
	}
}

// Get the form values and populate the form
(async function getFormValues() {
	mySuccess(fm, 'Loading Values...', 'w3-text-blue');

	let shouldDisableButton = false;

	// Handle the Mileage Costs data population first
	try {
		const fuelCharges = await manageUser.getMileageCharges();

		// Get mileage range and cost values
		if (fuelCharges) {
			populateMileageChargesValues(fuelCharges);
		}
	}
	catch (err) {
		if (err.message === 'Local settings storage is not properly set up.') {
			shouldDisableButton = true;
		}
	}

	// Handle the farrier prices data population
	try {
		// Get the user's farrier prices and mileage costs
		const farrierPrices = await manageUser.getFarrierPrices(getUserInfoAPI, { getFarrierPrices: true });

		if (farrierPrices) {
			populateFarrierPricesValues(farrierPrices);
		}
	}
	catch (err) {
		if (err.message === 'Local settings storage is not properly set up.') {
			shouldDisableButton = true;
		}
	}

	// Clear the messages
	clearMsg({ container: fm });

	// If the local storage is not set up, disable the buttons. This should not happen though.
	if (shouldDisableButton) {
		myError(fm, 'Local settings storage is not properly set up.<br>Please navigate to the home page.<br>This should automatically set up your local settings storage.<br>If this does not work, Please submit a new Help Desk Ticket for this issue.');
		// Disable the submit button since we are having issues.
		submitButton.disabled = true;
	}
})();

// Set an object to loop through the accessory inputs
const accessoryObject = {
	pads: {
		display: displayPads,
		element: numPads,
		name: 'pads',
	},
	packing: {
		display: displayPacking,
		element: numPacking,
		name: 'packing',
	},
	wedges: {
		display: displayWedges,
		element: numWedges,
		name: 'wedges',
	},
};

// Loop through to set our listeners
for (const listener in accessoryObject) {
	const obj = accessoryObject[listener];

	addListener(obj.element, 'input', (evt) => displayNumberedInputs(evt, obj.display, obj.name));
}

async function displayNumberedInputs(evt, ele, name) {
	const fragment = document.createDocumentFragment();
	const numberPads = evt.target.value === '' ? null : Number(evt.target.value);
	const children = ele.children.length;

	// Return early if value is empty
	if (numberPads === null) return;

	if (children === 0 && numberPads > 0) {
		// children should be empty, so we just add x amount of pads
		for (let i = 1; i <= numberPads; i++) {
			fragment.appendChild(displayAccessoryInputAndCost(i, name));
		}
	}
	// We have children, and number is higher than children, so we need to add more children
	else if (children > 0 && numberPads > children) {
		// Need to add x amount to append the new list
		const difference = numberPads - children;

		for (let i = children; i < (difference + children); i++) {
			// Need to add a +1 to the iterator to make up the correct index
			fragment.appendChild(displayAccessoryInputAndCost(i + 1, name));
		}
	}
	// We have children, but number is lower than children, so we need to remove the last children
	else if (children > 0 && numberPads < children && numberPads > 0) {
		// Need to remove the last x amount of pads
		for (let i = children; i > numberPads; i--) {
			document.getElementById(`block-${i}`).remove();
		}
	}
	else if (numberPads === 0) {
		// Remove all children
		ele.innerHTML = '';
	}

	ele.appendChild(fragment);
}

if (deleteRange && deleteRange.length > 0) {
	deleteRange.forEach(range => {
		range.addEventListener('click', deleteMileageRange);
	});
}

async function deleteMileageRange(evt) {
	// Confirm the deletion
	const shouldDelete = confirm('Are you sure you want to delete this mileage range?');

	if (shouldDelete) {
		const mileageBlock = evt.target.parentElement.parentElement.parentElement;
		mileageBlock.remove();

		const children = fuelRangeContainer.children;

		for (let i = 0; i < children.length; i++) {
			// Get the first div which contains the label and text
			let firstDiv = children[i].children[0];
			// Update the text content
			firstDiv.childNodes[0].textContent = `Mileage Range ${i + 1}`;

			// Get the second div which contains the inputs
			let secondDiv = children[i].children[1];
			// Update the ids and names of the inputs
			secondDiv.querySelector(`input[id^="mileage-range-"]`).id = `mileage-range-${i + 1}`;
			secondDiv.querySelector(`input[id^="mileage-range-"]`).name = `mileage_range_${i + 1}`;
			secondDiv.querySelector(`input[id^="fuel-cost-"]`).id = `fuel-cost-${i + 1}`;
			secondDiv.querySelector(`input[id^="fuel-cost-"]`).name = `fuel_cost_${i + 1}`;
		}

		fuelRanges.value = children.length;

		makeInputEleGreen(fpf);
	}
}

/**
 * Adds or removes a CSS class to form elements based on their value.
 * 
 * @function makeInputEleGreen
 * @param {HTMLFormElement} form - The form element to process.
 */
function makeInputEleGreen(form) {
	Array.from(form.elements).forEach(input => {
		if (input.name !== 'submit') {
			if (input.value && input.value !== '') {
				input.classList.add('w3-light-green');
			}
			else {
				input.classList.remove('w3-light-green');
			}
		}
	});
}

function addFuelRangeInputs(evt) {
	const sections = evt.target.value;
	const fragment = document.createDocumentFragment();

	// Clear the green background if sections value is empty or 0
	if (sections === '0' || sections === '') {
		evt.target.classList.remove('w3-light-green');
	}

	for (let i = 0; i < sections; i++) {
		const sectionCol = buildEle({
			type: 'div',
			myClass: ['w3-row', 'w3-padding-small']
		});

		const sectionOneRow = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
			text: `Mileage Range ${i + 1}:`
		});

		const sectionTwoRow = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6']
		});

		const sectionTwoRangeP = buildEle({
			type: 'p',
		});

		const sectionTwoLabel = buildEle({
			type: 'label',
			attributes: {
				for: `mileage-range-${i + 1}`
			},
			text: 'Mileage Range'
		});

		const sectionTwoRangeSpan = buildEle({
			type: 'span',
			myClass: ['w3-small'],
			text: '(format: 50-59)'
		});

		const sectionTwoRangeInput = buildEle({
			type: 'input',
			attributes: {
				id: `mileage-range-${i + 1}`,
				type: 'text',
				title: 'Mileage Range: e.g. 50-59',
				placeholder: 'Mileage Range: 50-59',
				name: `mileage_range_${i + 1}`,
				required: 'required',
			},
			myClass: ['w3-input', 'w3-border']
		});

		const sectionTwoRangeError = buildEle({
			type: 'div',
			attributes: { id: `mileage-range-error-${i + 1}` }
		});

		// Set the event listener to validate proper input for the range
		sectionTwoRangeInput.addEventListener('input', (evt) => checkMileageRangeFormat(evt, sectionTwoRangeError));

		const sectionTwoFuelP = buildEle({
			type: 'p',
		});

		const sectionTwoFuelLabel = buildEle({
			type: 'label',
			attributes: {
				for: `fuel-cost-${i + 1}`
			},
			text: 'Fuel Cost:'
		});

		const sectionTwoFuelInput = buildEle({
			type: 'input',
			attributes: {
				id: `fuel-cost-${i + 1}`,
				type: 'number',
				title: 'Fuel Cost',
				placeholder: 'Fuel Cost',
				name: `fuel_cost_${i + 1}`,
				required: 'required',
			},
			myClass: ['w3-input', 'w3-border']
		});

		const sectionTwoFuelError = buildEle({
			type: 'div',
			attributes: { id: `fuel-cost-error-${i + 1}` }
		});

		// Set the event listener to validate proper input for the fuel cost
		sectionTwoFuelInput.addEventListener('input', (evt) => checkFuelCostFormat(evt, sectionTwoFuelError));


		// Put it all together
		sectionTwoRow.appendChild(sectionTwoRangeP);
		sectionTwoRangeP.appendChild(sectionTwoLabel);
		sectionTwoRangeP.appendChild(sectionTwoRangeSpan);
		sectionTwoRangeP.appendChild(sectionTwoRangeInput);
		sectionTwoRangeP.appendChild(sectionTwoRangeError);
		sectionTwoRow.appendChild(sectionTwoFuelP);
		sectionTwoFuelP.appendChild(sectionTwoFuelLabel);
		sectionTwoFuelP.appendChild(sectionTwoFuelInput);
		sectionTwoFuelP.appendChild(sectionTwoFuelError);

		sectionCol.appendChild(sectionOneRow);
		sectionCol.appendChild(sectionTwoRow);

		fragment.appendChild(sectionCol);
	}

	fuelRangeContainer.innerHTML = '';
	fuelRangeContainer.appendChild(fragment);
}

function checkMileageRangeFormat(evt, errContainer) {
	const userRange = evt.target.value;
	let pattern = /^(\d{1,3})-(\d{1,3}\+?)$/;
	let match = userRange.match(pattern);

	// Remove the error messages
	if (userRange === '') {
		clearMsg({ container: errContainer, input: evt.target });
	}
	else if (match) {
		// Make sure the first number is smaller than the second number
		const firstNumber = parseInt(match[1], 10);
		const secondNumber = parseInt(match[2], 10);

		if (firstNumber < secondNumber) {
			// Lets check to make sure we don't have duplicate ranges
			// how many ranges do we have?
			const duplicateRanges = checkForDuplicateRanges(userRange, evt.target);

			if (!duplicateRanges) {
				// Remove any error messages
				clearMsg({ container: errContainer, input: evt.target });
				checkFormForErrors();
			}
			else {
				// Show the error
				myError(errContainer, 'This range is already being used.', evt.target);

				// Disable the submit button
				checkFormForErrors();
			}

		}
		else {
			// Show the error
			myError(errContainer, 'First number must be smaller than second number.', evt.target);

			// Disable the submit button
			checkFormForErrors();
		}
	}
	else {
		// Range is not of proper format
		myError(errContainer, 'Please use the correct format: xx-xx', evt.target);

		// Disable the submit button
		checkFormForErrors();
	}
}

function checkFuelCostFormat(evt, errContainer) {
	if (isNumeric(evt.target.value)) {
		// clear the message
		clearMsg({ container: errContainer, input: evt.target });

		checkFormForErrors();
	}
	else {
		myError(errContainer, 'Fuel cost must be a number.', evt.target);

		// Disable the submit button
		checkFormForErrors();
	}
}

function checkFormForErrors() {
	const errors = fpf.querySelectorAll('.error');

	// Check the length, if more than 0, disable submit
	if (errors.length > 0) {
		submitButton.disabled = true;
	}
	else {
		submitButton.disabled = false;
	}
}

function checkForDuplicateRanges(userRange, currentElement) {
	const rangeElements = fpf.querySelectorAll('input[id^="mileage-range-"]');

	for (let range of rangeElements) {
		if (range === currentElement) continue; // Skip the current element

		if (userRange === range.value) {
			return true;
		}
	}

	return false;
}
