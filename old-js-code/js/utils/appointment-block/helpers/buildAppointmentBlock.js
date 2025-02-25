import { buildEle } from "../../dom/domUtils.js";
import { addListener } from "../../event-listeners/listeners.js";
import selectPage from "../../navigation/selectPage.js";
 
/**
 * Builds and displays the appointment block in the provided container.
 * 
 * @param {HTMLElement} appointmentContainer - The container element where the appointment block will be displayed.
 * @param {Object[]} appointments - An array of appointment objects.
 * @param {string} appointments[].client_name - The client's name.
 * @param {string} appointments[].city - The client's city.
 * @param {number} appointments[].num_horses - The number of horses the client has.
 * @param {string} appointments[].cID - The client ID.
 * @param {string} appointments[].primaryKey - The primary key for the appointment.
 * @param {string} appointments[].start - The start time of the appointment.
 * @param {string} appointments[].end - The end time of the appointment.
 * @param {string} date - The date of the appointments.
 * @returns {Promise<void>} A promise that resolves when the appointment block is built and displayed.
 * @throws {Error} Throws an error if there's an issue building the appointment block.
 */
export default async function buildAppointmentBlock(appointmentContainer, appointments, date) {
	try {
		const parent = buildEle({
			type: 'div',
			myClass: ['w3-yellow', 'w3-padding-small']
		});

		const header = buildEle({
			type: 'h6',
			myClass: ['w3-center'],
			text: `Bookings for ${date}`
		});

		const reminder = buildEle({
			type: 'div',
			myClass: ['w3-center', 'w3-small'],
			text: 'Remember times include your average drive time also.'
		});

		parent.appendChild(header);
		parent.appendChild(reminder);

		appointments.forEach(obj => {
			const clientAnchor = buildEle({
				type: 'a',
				myClass: ['w3-underline'],
				attributes: { href: `/tracker/clients/appointments/?cID=${obj.cID}&key=${obj.primaryKey}` },
				text: obj.client_name
			});

			const appointmentDetails = buildEle({
				type: 'p',
				myClass: ['w3-border-bottom', 'w3-padding-small'],
				text: ` from ${obj.city}<br>Usually has ${obj.num_horses} horse(s)<br>Appointment starts at: ${obj.start}<br>Appointment ends at: ${obj.end}`
			});

			// Set the event listener
			addListener(clientAnchor, 'click', (evt) => selectPage({ evt, page: 'singleClient', cID: obj.cID, primaryKey: obj.primaryKey }));

			appointmentDetails.prepend(clientAnchor);
			parent.appendChild(appointmentDetails);
		});

		appointmentContainer.innerHTML = '';
		appointmentContainer.appendChild(parent);
	} catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('buildAppointmentBlockError', 'Build appointment Block Error: ', err);
		throw err;
	}
}