import { getReadableCurrentFutureDate } from '../../../../../utils/date/dateUtils.js';
import { buildEle, buildElementsFromConfig, buildElementTree } from '../../../../../utils/dom/elements.js';
import { buildPageContainer, buildSubmitButtonSection, buildTwoColumnInputSection, buildTwoColumnTextareaSection } from '../../../../../utils/dom/forms/buildUtils.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';

// Set up the debug mode
const COMPONENT = 'Build Add Trimming Page';
const DEBUG = true;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Setup the component id to track event listeners
const COMPONENT_ID = 'add-trimming';

export default async function buildAddTrimmingPage({ cID, primaryKey, mainContainer, manageUser, manageClient }) {
	try {
		// Clear any previous page messages
		clearMsg({ container: 'page-msg' });

		// If we don't have a cID or a primary key, throw new Error
		if (!cID || !primaryKey) throw new Error('Unable to build the add trimming page. Certain parameters are missing.');

		// Get all required Data
		const pageData = await fetchRequiredData({
			cID,
			primaryKey,
			manageClient,
			manageUser,
		});

		// Early return for no horses
		if (pageData.clientHorses.length === 0) {
			return await handleNoHorsesScenerio({
				cID,
				primaryKey,
				mainContainer,
				manageClient,
				manageUser
			});
		}

		const [pageComponents, formComponents, optionalComponents] = await Promise.all([
			buildPageComponents({ pageData, cID, primaryKey }),
			buildFormComponents({ pageData, cID, primaryKey }),
			buildOptionalComponents({ pageData, cID, primaryKey }),
		]);

		renderPage({ mainContainer, pageComponents, formComponents, optionalComponents });

		await initializeUIHandlers({ cID, primaryKey, mainContainer, manageClient, manageUser });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
}

async function fetchRequiredData({ cID, primaryKey, manageClient, manageUser }) {
	// Get data all at once
	const [mileageCharges, clientInfo] = await Promise.all([
		manageUser.getMileageCharges(),
		manageClient.getClientInfo({ primaryKey }),
	]);

	return {
		mileageCharges,
		clientInfo,
		clientName: cleanUserOutput(clientInfo.client_name) || 'No Name Found',
		clientHorses: clientInfo?.horses || [],
		clientDistance: clientInfo?.distance || 0,
		trimCycleWeeks: parseInt(clientInfo?.trim_cycle, 10) / 7,
	};
}

async function handleNoHorsesScenerio({ cID, primaryKey, mainContainer, manageClient, manageUser }) {
	const [{ default: buildNoHorsePage }, { default: addTrimmingNoHorse }] = await Promise.all([
		import("./components/buildNoHorsePage.js"),
		import("../../../../../../features/client/ui/add-trimming/addTrimmingNoHorseJS.js"),
	]);

	buildNoHorsePage({ cID, primaryKey, mainContainer });

	await addTrimmingNoHorse({ cID, primaryKey, manageClient, manageUser, mainContainer, componentId: COMPONENT_ID });

	return () => removeListeners(COMPONENT_ID);
}

async function buildPageComponents({ pageData, cID, primaryKey }) {
	const [container, card] = await buildPageContainer({
		pageTitle: 'Add Trimming for ',
		clientName: pageData.clientName,
		cID,
		primaryKey,
	});
	return { container, card };
}

async function buildFormComponents({ pageData, cID, primaryKey }) {
	const { clientInfo, trimCycleWeeks } = pageData;

	// Build the Mapping for extra form components
	const FORM_COMPONENTS_MAPPING = {
		form: {
			type: 'form',
			attributes: { id: 'trimming-form' },
		},
		optionalContainer: {
			type: 'div',
			attributes: { id: 'optional-container' },
		},
		numberHorseContainer: {
			type: 'div',
			myClass: ['w3-padding-small'],
			attributes: { id: 'number-horse-container' },
		}
	};

	const INVOICE_PAID_MAPPING = {
		type: 'div',
		myClass: ['w3-container', 'w3-margin-bottom', 'w3-margin-top', 'w3-center'],
		children: {
			label: {
				type: 'label',
				attributes: { for: 'paid' },
				myClass: ['w3-bold'],
				text: 'Invoice Paid: ',
				children: {
					checkbox: {
						type: 'input',
						attributes: {
							id: 'paid',
							type: 'checkbox',
							name: 'paid',
							value: 'yes',
						},
					}
				},
			},
		},
	}

	const { form, optionalContainer, numberHorseContainer } = buildElementsFromConfig(FORM_COMPONENTS_MAPPING);
	const invoicePaidContainer = buildElementTree(INVOICE_PAID_MAPPING);

	const [
		numberHorseSection,
		appointmentDateSection,
		nextAppointmentSection,
		appointmentTimeSection,
		sessionNotesSection,
		paymentSection,
		submitButtonSection,
	] = await Promise.all([
		// Number horse section
		buildTwoColumnInputSection({
			labelText: 'Number of Horses:',
			inputID: 'number-horses',
			inputType: 'number',
			inputName: 'number_horses',
			inputTitle: 'Number of Horses',
			required: true,
		}),
		// appointment date section
		buildTwoColumnInputSection({
			labelText: 'Appointment Date:',
			inputID: 'trim-date',
			inputType: 'date',
			inputName: 'trim_date',
			inputTitle: 'Date of Trimming',
			required: true,
			inputValue: new Date().toISOString().slice(0, 10),
			additionalElement: buildEle({
				type: 'div',
				myClass: ['w3-small', 'w3-text-red'],
				text: `Note: Client's appointment is set to ${trimCycleWeeks} weeks.`,
			}),
		}),
		// Next appointment section
		buildTwoColumnInputSection({
			labelText: 'Next Appointment:',
			inputID: 'next-trim-date',
			inputType: 'date',
			inputName: 'next_trim_date',
			inputTitle: 'Next Appointment Date',
			required: true,
			inputValue: getReadableCurrentFutureDate(clientInfo?.trim_cycle),
		}),
		// Appointment time section
		buildTwoColumnInputSection({
			labelText: 'Appointment Time:',
			inputID: 'app-time',
			inputType: 'time',
			inputName: 'app_time',
			inputTitle: 'Appointment Time',
			required: true,
			inputValue: clientInfo?.app_time || '09:00',
		}),
		// Session notes section
		buildTwoColumnTextareaSection({
			labelText: 'Trimming/Shoeing Session Notes:',
			textareaID: 'session-notes',
			textareaName: 'session_notes',
			textareaTitle: 'Session Notes',
			rows: 5,
		}),
		// Payment section
		buildTwoColumnInputSection({
			labelText: 'Amount Due:',
			inputID: 'payment',
			inputType: 'number',
			inputName: 'payment',
			inputTitle: 'Amount Due',
			required: true,
		}),
		// Submit button section
		buildSubmitButtonSection('Add Trimming/Shoeing'),
	]);

	return {
		form,
		numberHorseSection,
		numberHorseContainer,
		appointmentDateSection,
		nextAppointmentSection,
		appointmentTimeSection,
		optionalContainer,
		sessionNotesSection,
		paymentSection,
		invoicePaidContainer,
		submitButtonSection,
	};
}

async function buildOptionalComponents({ pageData, cID, primaryKey }) {
	const { clientDistance, mileageCharges, clientInfo } = pageData;

	const sections = {};

	const [{ default: getMileageCharges }, { default: buildFuelChargeCheckboxSection }] = await Promise.all([
		import('./components/getMileageCharges.js'),
		import('./components/buildFuelChargeCheckboxSection.js')
	]);


	// Check if the client has an email
	if (clientInfo?.email) {
		const { default: buildReceiptSection } = await import("./components/buildReceiptSection.js");
		sections.receiptSection = await buildReceiptSection();
	}

	// Check if the user is getting charged mileage
	const { inRange, cost } = getMileageCharges({ clientDistance, mileageCharges });
	if (inRange) {
		sections.fuelChargeSection = await buildFuelChargeCheckboxSection(cost);
	}

	return sections;
}

function renderPage({ mainContainer, pageComponents, formComponents, optionalComponents }) {
	const { container, card } = pageComponents;
	const { form, ...formElements } = formComponents;
	const { receiptSection, fuelChargeSection } = optionalComponents;

	form.append(...Object.values(formElements));
	if (receiptSection instanceof HTMLElement) formElements.optionalContainer.appendChild(receiptSection);
	if (fuelChargeSection instanceof HTMLElement) formElements.optionalContainer.appendChild(fuelChargeSection);
	card.appendChild(form);
	container.appendChild(card);

	// Clear the main container
	mainContainer.innerHTML = '';
	mainContainer.appendChild(container);
}

async function initializeUIHandlers({ cID, primaryKey, mainContainer, manageClient, manageUser }) {
	const { default: addTrimming } = await import("../../../../../../features/client/ui/add-trimming/addTrimmingJS.js");
	addTrimming({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });
}