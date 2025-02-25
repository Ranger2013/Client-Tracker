import checkAppointment from "../../../../utils/appointment-block/checkAppointment.js";
import { buildEle } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import buildTwoColumnInputSection from "../../../../utils/page-builders/helpers/buildTwoColumnInputSection.js";
import buildTwoColumnSelectElementSection from "../../../../utils/page-builders/helpers/buildTwoColumnSelectElementSection.js";
import { trimCycleConfigurations } from "../../../../utils/configurations/trimCycleConfigurations.js";

/**
 * Builds the rest of the form for duplicating a client. Includes the Trim Cycle, Next Trim Date, and Appointment Time select elements.
 * @param {Event} evt - The event object.
 * @param {HTMLElement} clientContainer - The container to show the trimming cycle, next trim and appointment time select elements
 * @returns {Promise<void>} - A promise that resolves when the function is complete.
 * @throws {Error} - Throws an error if there is an issue building the duplicate client elements.
 */
export default async function buildDuplicateClientElements(evt, clientContainer){
	try{
		const fragment = document.createDocumentFragment();

		const [trimmingCycle, appointmentDate, appointmentTime] = await Promise.all([
			buildTwoColumnSelectElementSection({
				labelText: 'Trimming/Shoeing Cycle:',
				selectID: 'trim-cycle',
				selectName: 'trim_cycle',
				selectTitle: 'Select Trimming Cycle',
				required: true,
				options: trimCycleConfigurations(),
			}),
			buildTwoColumnInputSection({
				labelText: 'Next Appointment:',
				inputID: 'next-trim-date',
				inputType: 'date',
				inputName: 'next_trim_date',
				inputTitle: 'Next Appointment',
				required: true,
			}),
			buildTwoColumnInputSection({
				labelText: 'Appointment Time:',
				inputID: 'app-time',
				inputType: 'time',
				inputName: 'app_time',
				inputTitle: 'Appointment Time',
				required: true,
			}),
		]);

		const row = buildEle({
			type: 'div',
			myClass: ['w3-row', 'w3-padding'],
		});

		const colOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
			text: '&nbsp;',
		});

		const colTwo = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6'],
		});

		const bookingContainer = buildEle({
			type: 'div',
			attributes: { id: 'booking-container' },
		});

		const projectedBookingContainer = buildEle({
			type: 'div',
			attributes: { id: 'projected-booking-container' },
		});

		clientContainer.innerHTML = '';

		fragment.appendChild(trimmingCycle);
		fragment.appendChild(appointmentDate);
		fragment.appendChild(appointmentTime);
		fragment.appendChild(row);
		row.appendChild(colOne);
		row.appendChild(colTwo);
		colTwo.appendChild(bookingContainer);
		colTwo.appendChild(projectedBookingContainer);
		clientContainer.appendChild(fragment);

		checkAppointment({
			trimDate: 'next-trim-date',
			trimCycle: 'trim-cycle',
			appBlock: bookingContainer,
			projAppBlock: projectedBookingContainer,
		});

		addListener('next-trim-date', 'change', () => checkAppointment({
			trimDate: 'next-trim-date',
			trimCycle: 'trim-cycle',
			appBlock: bookingContainer,
			projAppBlock: projectedBookingContainer,
		}));
	}
	catch(err){
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('buildDuplicateClientElementsError', 'Error building duplicate client elements: ', err, 'Unable to build the duplicate client form elements.', clientContainer);
	}
}