import { buildElementsFromConfig } from '../../../../../../utils/dom/elements.js';

export async function buildSessionNotesSection() {
	try {
		const PAGE_MAPPING = {
			container: { type: 'div', myClass: ['w3-container', 'w3-margin-bottom'] },
			notesLabel: { type: 'label', attributes: { for: 'session-notes' }, text: 'Trimming/Shoeing Session Notes: ' },
			sessionNotes: {
				type: 'textarea',
				attributes: {
					id: 'session-notes',
					title: 'Trimming/Shoeing Session Notes',
					name: 'session_notes',
					placeholder: 'Trimming/Shoeing Session Notes',
					rows: '5',
				},
				myClass: ['w3-input', 'w3-border']
			},
		};

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		// Put it all together and return;
		const { container, notesLabel, sessionNotes } = pageElements;
		notesLabel.appendChild(sessionNotes);
		container.append(notesLabel);
		return container;
	}
	catch (err) {
		throw err;
	}
}

export async function buildInvoicePaidCheckbox() {
		const PAGE_MAPPING = {
			container: { type: 'div', myClass: ['w3-container', 'w3-margin-bottom', 'w3-margin-top', 'w3-center'] },
			paidLabel: { type: 'label', myClass: ['w3-bold'], text: 'Invoice Paid: ' },
			paidCheckbox: { type: 'input', attributes: { id: 'paid', type: 'checkbox', name: 'paid', value: 'yes' } },
		};

	try {
		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		// Put it all together and return
		const { container, paidLabel, paidCheckbox } = pageElements;
		paidLabel.appendChild(paidCheckbox);
		container.appendChild(paidLabel);
		return container;
	}
	catch (err) {
		const { AppError } = await import("../../../../../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: null,
		});

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		pageElements.container.innerHTML = 'Could not build the invoice paid checkbox.';
		pageElements.container.classList.add('w3-text-red');

		return pageElements.container;
	}
}

export async function buildFuelChargeCheckboxSection(cost) {
	const PAGE_MAPPING = {
		container: { type: 'div', myClass: ['w3-row'] },
		emptyCol: { type: 'div', myClass: ['w3-col', 'm6'], attributes: { style: 'height: 5px' }, text: '&nbsp;' },
		fuelCol: { type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-center'] },
		fuelLabel: { type: 'label', text: 'Remove Mileage Charge: ' },
		fuelCheckBox: { type: 'input', attributes: { id: 'mileage', type: 'checkbox', name: 'fuel_charges', value: 'yes' } },
		costDisplay: { type: 'div', attributes: { id: 'fuel-cost-display' }, myClass: ['w3-padding-small'], text: `Mileage Charge: $${cost}` },
		fuelHiddenInput: { type: 'input', attributes: { id: 'mileage-charges', type: 'hidden', name: 'mileage_cost', value: cost } },
		errorContainer: { type: 'div', attributes: { id: 'mileage-charges-error' } },
	};

	try {
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
		const { AppError } = await import("../../../../../../errors/models/AppError.js");
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