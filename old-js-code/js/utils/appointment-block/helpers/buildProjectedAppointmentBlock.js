import { buildEle } from "../../dom/domUtils.js";
 
/**
 * Builds and displays the projected appointment block in the provided container.
 * 
 * @param {HTMLElement} appointmentContainer - The container element where the projected appointment block will be displayed.
 * @param {Object[]} projAppData - An array of projected appointment objects.
 * @param {string} projAppData[].client_name - The client's name.
 * @param {string} projAppData[].city - The client's city.
 * @param {number} projAppData[].num_horses - The number of horses the client has.
 * @param {string} projAppData[].time_block - The time block of the appointment.
 * @param {string} date - The date of the projected appointments.
 * @returns {Promise<void>} A promise that resolves when the projected appointment block is built and displayed.
 * @throws {Error} Throws an error if there's an issue building the projected appointment block.
 */
export default async function buildProjectedAppointmentBlock(appointmentContainer, projAppData, date) {
	try {
		// If no projected dates, clear the container and return early
		if (projAppData?.length === 0) {
			appointmentContainer.innerHTML = '';
			return;
		}

		const parent = buildEle({
			type: 'div',
			myClass: ['w3-blue', 'w3-padding-small']
		});

		const header = buildEle({
			type: 'h6',
			myClass: ['w3-center'],
			text: `Projected Bookings for ${date}`
		});

		parent.appendChild(header);

		projAppData.forEach(appointment => {
			const p = buildEle({
				type: 'p',
				myClass: ['w3-border-bottom', 'w3-padding-small'],
				text: `${appointment.client_name} from ${appointment.city}<br>Usually has ${appointment.num_horses} horse(s).<br>Time Block: ${appointment.time_block}`
			});

			parent.appendChild(p);
		});

		appointmentContainer.innerHTML = '';
		appointmentContainer.appendChild(parent);
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('buildProjectedAppointmentBlockError', 'Build projected appointment block error:', err);
		throw err;
	}
}