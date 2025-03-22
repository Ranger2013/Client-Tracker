import { getReadableCurrentFutureDate } from '../../../../../utils/date/dateUtils.min.js';
import { buildElementsFromConfig } from '../../../../../utils/dom/elements.min.js';
import { buildPageContainer, buildSubmitButtonSection, buildTwoColumnInputSection } from '../../../../../utils/dom/forms/buildUtils.min.js';
import { removeListeners } from '../../../../../utils/dom/listeners.min.js';
import { clearMsg } from '../../../../../utils/dom/messages.min.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.min.js';
import { buildFuelChargeCheckboxSection, buildInvoicePaidCheckbox, buildSessionNotesSection } from './components/buildUtils.min.js';
import getMileageCharges from './components/getMileageCharges.min.js';

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

		// Build the trimming page components
		const pageElements = await buildPageComponents({cID, primaryKey, pageData});

		renderPage(mainContainer, pageElements);

		return await initializeUIHandlers({
			cID,
			primaryKey,
			mainContainer,
			manageClient,
			manageUser,
		})

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
	buildNoHorsePage({ cID, primaryKey, mainContainer });
	const { default: addTrimming } = await import("../../../../../../features/client/ui/add-trimming/addTrimmingJS.js");
	addTrimming({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

	return () => removeListeners(COMPONENT_ID);
}

function buildNoHorsePage({ cID, primaryKey, mainContainer }) {
	try {
		const PAGE_MAPPING = {
			container: {
				type: 'div',
				myClass: ['w3-center'],
			},
			card: {
				type: 'div',
				myClass: ['w3-card'],
				attributes: { id: 'card' },
			},
			notice: {
				type: 'h4',
				myClass: ['w3-text-red'],
				text: 'This client does not have any horses Listed.',
			},
			linkContainer: {
				type: 'p',
				myClass: ['w3-margin-top', 'w3-padding-small'],
				text: 'Please ',
			},
			link: {
				type: 'a',
				attributes: {
					id: 'add-horse-link',
					href: `/tracker/client-horses/add/?cID=${cID}&primaryKey=${primaryKey}`,
					title: 'Add a Horse',
					'data-add-horse-navigation:': true, // This will give us something to look for when we create our event listeners in the UI file.
				},
				myClass: ['w3-text-blue'],
				text: 'add a horse',
			},
		};

		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { container, card, notice, linkContainer, link } = elements;

		// Add child elements first
		linkContainer.appendChild(link);
		// Append the elements
		card.append(notice, linkContainer);
		container.appendChild(card);

		mainContainer.innerHTML = '';
		mainContainer.appendChild(elements.container);
	}
	catch (err) {
		throw err;
	}
}

async function buildPageComponents({cID, primaryKey, pageData}) {
	const { clientInfo, clientName, trimCycleWeeks } = pageData;

	// Build the base page components
	const pageElements = createBaseStructure(trimCycleWeeks);

	// Build form components
	const formElements = await buildFormComponents({
		pageElements,
		clientInfo,
		clientName,
		cID,
		primaryKey,
	});
	const [container, card, ...updatedFormElements] = formElements;
	// Get the optional sections
	const optionalSections = await getOptionalSections(pageData);

	return { ...pageElements, container, card, updatedFormElements, ...optionalSections };
}

function createBaseStructure(trimCycleWeeks) {
	const PAGE_MAPPING = {
		trimmingForm: { type: 'form', attributes: { id: 'trimming-form' } },
		numberHorseContainer: { type: 'div', attributes: { id: 'number-horse-container' }, myClass: ['w3-padding-small'] },
		trimCycleNoteContainer: {
			type: 'div',
			myClass: ['w3-small', 'w3-text-red'],
			text: `Note: Client's appointment is set to ${trimCycleWeeks} weeks.`
		},
	};

	return buildElementsFromConfig(PAGE_MAPPING);
}

async function buildFormComponents({ pageElements, clientInfo, clientName, cID, primaryKey }) {
	const [
		[container, card],
		numberHorses,
		trimDate,
		nextTrimDate,
		appTime,
		sessionNotes,
		amountDue,
		invoicePaid,
		submit,
	] = await Promise.all([
		// Main page container and the card with the title
		buildPageContainer({
			pageTitle: 'Add Trimming for ',
			clientName,
			cID,
			primaryKey
		}),
		// Input for number of horses that were trimmed/shod
		buildTwoColumnInputSection({
			labelText: 'Number of Horses:',
			inputType: 'number',
			inputID: 'number-horses',
			inputName: 'number_horses',
			inputTitle: 'Number of Horses',
			required: true,
		}),
		// Date input for the trim date
		buildTwoColumnInputSection({
			labelText: 'Trim Date:',
			inputType: 'date',
			inputID: 'trim-date',
			inputName: 'trim_date',
			inputTitle: 'Trim Date',
			required: true,
			additionalElement: pageElements.trimCycleNoteContainer,
		}),
		// Next appointment date input
		buildTwoColumnInputSection({
			labelText: 'Next Trimming/Shoeing Date:',
			inputType: 'date',
			inputID: 'next-trim-date',
			inputName: 'next_trim_date',
			inputTitle: 'Next Trim Date',
			required: true,
			inputValue: getReadableCurrentFutureDate(clientInfo?.trim_cycle),
		}),
		// Time for the next appointment input
		buildTwoColumnInputSection({
			labelText: 'Appointment Time:',
			inputType: 'time',
			inputID: 'app-time',
			inputName: 'app_time',
			inputTitle: 'Appointment Time',
			required: true,
			inputValue: clientInfo?.app_time,
		}),
		// Session Notes
		buildSessionNotesSection(),
		// Amount due input
		buildTwoColumnInputSection({
			labelText: 'Amount Due:',
			inputType: 'number',
			inputID: 'payment',
			inputName: 'payment',
			inputTitle: 'Payment',
			required: true,
		}),
		// Invoice Paid Checkbox
		buildInvoicePaidCheckbox(),
		// Submit button
		buildSubmitButtonSection('Add Trimming/Shoeing'),
	]);

	return [
		container,
		card,
		numberHorses,
		pageElements.numberHorseContainer,
		trimDate,
		nextTrimDate,
		appTime,
		sessionNotes,
		amountDue,
		invoicePaid,
		submit,
	];
}

async function getOptionalSections({clientInfo, clientDistance, mileageCharges}){
	const sections = {};

	// Check if the client has an email
	if(clientInfo?.email){
		const { default: buildReceiptSection } = await import("./components/buildReceiptSection.js");
		sections.receiptSection = await buildReceiptSection();
	}

	// Check if the user is getting charged mileage
	const { inRange, cost } = getMileageCharges({ clientDistance, mileageCharges });
	if(inRange){
		sections.fuelChargeSection = await buildFuelChargeCheckboxSection(cost);
	}

	return sections;
}

function renderPage(mainContainer, { container, card, trimmingForm, updatedFormElements, receiptSection, fuelChargeSection }) {
	// Put it all together
	trimmingForm.append(...updatedFormElements);

	// Add optional sections
	if(receiptSection instanceof HTMLElement) trimmingForm.appendChild(receiptSection);
	if(fuelChargeSection instanceof HTMLElement) trimmingForm.appendChild(fuelChargeSection);
	card.appendChild(trimmingForm);
	container.appendChild(card);

	// Clear the main container
	mainContainer.innerHTML = '';
	mainContainer.appendChild(container);
}

async function initializeUIHandlers({ cID, primaryKey, mainContainer, manageClient, manageUser }){
	const { default: addTrimming } = await import("../../../../../../features/client/ui/add-trimming/addTrimmingJS.min.js");
	addTrimming({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

	return () => removeListeners(COMPONENT_ID);
}