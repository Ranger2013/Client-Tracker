import selectPage from '../../../navigation/services/selectPage.js';
import { buildEle } from '../../../utils/dom/elements.js';
import { addListener } from '../../../utils/dom/listeners.js';

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
 * @param {Object} manageClient - The manageClient instance.
 * @param {Object} manageUser - The manageUser instance.
 * @param {string} componentId - The component ID.
 * @returns {Promise<void>} A promise that resolves when the appointment block is built and displayed.
 * @throws {Error} Throws an error if there's an issue building the appointment block.
 */
export default async function buildAppointmentBlock({appointmentContainer, appointments, date, manageClient, manageUser, componentId}) {
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
			text: 'Appointment block times use a prediction algorithm based on your clients service history plus your drive time. Predictions could be inaccurate.'
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
				text: ` from ${obj.city}<br>
				Predicted ${obj.num_horses} horse(s)<br>
				${obj.prediction_message}<br>
				Appointment starts at: ${obj.start}<br>
				Appointment ends at: ${obj.end}`
			});

			// Set the event listener
			addListener({
				elementOrId: clientAnchor,
				eventType: 'click',
				handler: async (evt) => selectPage({ evt, page: 'singleClient', cID: obj.cID, primaryKey: obj.primaryKey, manageClient, manageUser }),
				componentId
			});

			appointmentDetails.prepend(clientAnchor);
			parent.appendChild(appointmentDetails);
		});

		appointmentContainer.innerHTML = '';
		appointmentContainer.appendChild(parent);
	}
	catch (err) {
		throw err;
	}
}