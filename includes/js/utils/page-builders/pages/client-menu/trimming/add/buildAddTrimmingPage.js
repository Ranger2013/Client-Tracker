import ManageClient from "../../../../../../classes/ManageClient.js";
import ManageUser from "../../../../../../classes/ManageUser.js";
import { getReadableCurrentFutureDate } from "../../../../../date/dateUtils.js";
import { buildEle, clearMsg } from "../../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../../event-listeners/listeners.js";
import buildPageContainer from "../../../../helpers/buildPageContainer.js";
import buildSubmitButtonSection from "../../../../helpers/buildSubmitButtonSection.js";
import buildTwoColumnInputSection from "../../../../helpers/buildTwoColumnInputSection.js";
import buildFuelChargeCheckboxSection from "./helpers/buildFuelChargeCheckboxSection.js";
import buildInvoicePaidCheckbox from "./helpers/buildInvoicePaidCheckboxSection.js";
import buildReceiptSection from "./helpers/buildReceiptSection.js";
import buildSessionNotesSection from "./helpers/buildSessionNotesSection.js";
import getMileageCharges from "./helpers/getMileageCharges.js";

export default async function buildAddTrimmingPage({ cID, primaryKey, mainContainer }) {
	try {
		// Clear any page msgs
		clearMsg({ container: 'page-msg' });

		if (!cID || !primaryKey) throw new Error('No cID or primary key provided.');

		// Get the user information
		const manageUser = new ManageUser();
		const userMileageCharges = await manageUser.getMileageCharges();

		// Get the client information
		const manageClient = new ManageClient();
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientName = clientInfo?.client_name || 'No Name';
		const clientHorses = clientInfo?.horses || [];
		const clientDistance = clientInfo?.distance || 0;

		// If the client doesn't have any horses, build the redirect page
		if (clientHorses.length === 0) {
			// Only import the function if the client has no horses
			const { default: buildNoHorsesPage } = await import("./helpers/buildNoHorsesPage.js");
			await buildNoHorsesPage(mainContainer, cID, primaryKey);
			return;
		}

		// Build the form container
		const trimmingForm = buildEle({
			type: 'form',
			attributes: { id: 'trimming-form' },
		});

		// Build the number of horses container, which will show the horse select elements
		const numberHorseContainer = buildEle({
			type: 'div',
			attributes: { id: 'number-horse-container' },
			myClass: ['w3-padding-small'],
		});

		// A note container about the clients trim cycle. This will be appended to the trim date input section
		const weeks = parseInt(clientInfo.trim_cycle, 10) / 7;

		const trimCycleNoteContainer = buildEle({
			type: 'div',
			myClass: ['w3-small', 'w3-text-red'],
			text: `NOTE: This client trim cycle is ${weeks} weeks.`,
		});

		// Variable to hold the receipt section if client has an email
		let buildSendRecieptSection;

		// Check if the client has an email
		if (clientInfo?.email) {
			// Import the function only if the client has an email
			// const { default: buildReceiptSection } = await import("./helpers/buildReceiptSection.js");
			buildSendRecieptSection = await buildReceiptSection();
		}

		// Get the mileage costs if any
		const mileageCost = getMileageCharges(clientDistance, userMileageCharges);

		let fuelChargeCheckboxSection;

		// If they are in range, then build the checkbox to negate fuel costs
		if (mileageCost.inRange) {
			// Import the function only if the client is in fuel range
			// const { default: buildFuelChargeCheckboxSection } = await import("./helpers/buildFuelChargeCheckboxSection.js");
			fuelChargeCheckboxSection = await buildFuelChargeCheckboxSection(mileageCost.cost);
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
			submit] = await Promise.all([
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
					additionalElement: trimCycleNoteContainer,
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



		// Append elements to the card and container
		card.appendChild(trimmingForm);
		trimmingForm.appendChild(numberHorses);
		trimmingForm.appendChild(numberHorseContainer);
		trimmingForm.appendChild(trimDate);
		trimmingForm.appendChild(nextTrimDate);
		trimmingForm.appendChild(appTime);
		if (buildSendRecieptSection instanceof HTMLElement) trimmingForm.appendChild(buildSendRecieptSection);
		if (fuelChargeCheckboxSection instanceof HTMLElement) trimmingForm.appendChild(fuelChargeCheckboxSection);
		trimmingForm.appendChild(sessionNotes);
		trimmingForm.appendChild(amountDue);
		trimmingForm.appendChild(invoicePaid);
		trimmingForm.appendChild(submit);
		container.appendChild(card);

		mainContainer.innerHTML = '';
		mainContainer.appendChild(container);

		// Include the add trimming JS file
		const { default: addTrimming } = await import("../../../../../../pages/client-menu/trimmings/add/addTrimmingJS.js");
		await addTrimming({ clientInfo });

		return removeAllListeners;
	}
	catch (err) {
		console.warn('Build add trimming page error: ', err);
		
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError(
			'buildAddTrimmingPageError',
			'Build add trimming page error: ',
			err,
			'Unable to show the add trimming page. Please try again later.',
			'page-msg'
		);
	}
}





