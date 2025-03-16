import { getReadableCurrentFutureDate } from '../../../../../utils/date/dateUtils.js';
import { buildElementsFromConfig } from '../../../../../utils/dom/elements.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';
import buildFuelChargeCheckboxSection from '../../../../components/buildFuelChargeCheckboxSection.js';
import buildInvoicePaidCheckbox from '../../../../components/buildInvoicePageCheckbox.js';
import buildPageContainer from '../../../../components/buildPageContainer.js';
import buildSessionNotesSection from '../../../../components/buildSessionNotesSection.js';
import buildSubmitButtonSection from '../../../../components/buildSubmitButtonSection.js';
import buildTwoColumnInputSection from '../../../../components/buildTwoColumnInputSection.js';
import getMileageCharges from './components/getMileageCharges.js';

// Setup the component id to track event listeners
const COMPONENT_ID = 'add-trimming';

export default async function buildAddTrimmingPage({ cID, primaryKey, mainContainer, manageUser, manageClient }) {
	try {
		// Clear any previous page messages
		clearMsg({ container: 'page-msg' });

		// If we don't have a cID or a primary key, throw new Error
		if (!cID || !primaryKey) throw new Error('Unable to build the add trimming page. Certain parameters are missing.');

		// Get the user's mileage charge information if he has any
		const mileageCharges = await manageUser.getMileageCharges();

		// Get the client's information
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientName = cleanUserOutput(clientInfo.client_name) || 'No Name Found';
		const clientHorses = clientInfo?.horses || [];
		const clientDistance = clientInfo?.distance || 0;

		// If the user has no horses, then show the no horse page so the user can directly navigate to the add horse page
		if (clientHorses.length === 0) {
			buildNoHorsePage({ cID, primaryKey, mainContainer });
			// Initialize the UI handler file
			const { default: addTrimming } = await import("../../../../../../features/client/ui/add-trimming/addTrimmingJS.js");
			addTrimming({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

			return () => removeListeners(COMPONENT_ID);
		}

		// Define our page variables
		const weeks = parseInt(clientInfo.trim_cycle, 10) / 7;

		const PAGE_MAPPING = {
			trimmingForm: { type: 'form', attributes: { id: 'trimming-form' } },
			numberHorseContainer: { type: 'div', attributes: { id: 'number-horse-container' }, myClass: ['w3-padding-small'] },
			trimCycleNoteContainer: { type: 'div', myClass: ['w3-small', 'w3-text-red'], text: `Note: This client's trimming cycle is set to ${weeks} weeks.` },
		};

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		// Optional sections
		let showSendRecieptSection, showFuelChargeCheckboxSection;

		if (clientInfo?.email) {
			const { default: buildReceiptSection } = await import("../../../../components/buildReceiptSection.js");
			showSendRecieptSection = await buildReceiptSection();
		}

		const { inRange, cost } = getMileageCharges({ clientDistance, mileageCharges });
		if (inRange) {
			showFuelChargeCheckboxSection = await buildFuelChargeCheckboxSection(cost);
		}

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

		// Put it all together
		card.appendChild(pageElements.trimmingForm);
		pageElements.trimmingForm.append(
			numberHorses,
			pageElements.numberHorseContainer,
			trimDate,
			nextTrimDate,
			appTime,
		);
		if (showSendRecieptSection instanceof HTMLElement) pageElements.trimmingForm.appendChild(showSendRecieptSection);
		if (showFuelChargeCheckboxSection instanceof HTMLElement) pageElements.trimmingForm.appendChild(showFuelChargeCheckboxSection);
		pageElements.trimmingForm.append(sessionNotes, amountDue, invoicePaid, submit);
		container.appendChild(card);

		// Clear the main container and append the new elements
		mainContainer.innerHTML = '';
		mainContainer.appendChild(container);

		// Initialize the UI handler file
		const { default: addTrimming } = await import("../../../../../../features/client/ui/add-trimming/addTrimmingJS.js");
		addTrimming({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
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