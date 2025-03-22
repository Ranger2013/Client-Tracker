import selectPage from '../../../navigation/services/selectPage.min.js';
import { buildEle } from '../../../utils/dom/elements.min.js';
import { addListener } from '../../../utils/dom/listeners.min.js';

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
export default async function buildProjectedAppointmentBlock({ appointmentContainer, data, date, manageClient, manageUser, componentId }) {
	try {
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

		data.forEach(obj => {
			console.log('in data foreach: obj: ', obj);
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
                ${obj.new_client ? 'New Client.<br>' : ''}
                Predicted services: ${formatServiceBreakdown(obj.predicted_services)}<br>
                Time Block: ${formatTimeBlock(obj.time_block)}`
			});

			console.log('clientAnchor: ', clientAnchor);

			// Set the event listener for the client anchor
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

function formatServiceBreakdown(breakdown) {
	const services = [];
	if (breakdown.trims > 0) services.push(`${breakdown.trims} trim${breakdown.trims > 1 ? 's' : ''}`);
	if (breakdown.halfSets > 0) services.push(`${breakdown.halfSets} half set${breakdown.halfSets > 1 ? 's' : ''}`);
	if (breakdown.fullSets > 0) services.push(`${breakdown.fullSets} full set${breakdown.fullSets > 1 ? 's' : ''}`);
	return services.join(', ');
}

function formatTimeBlock(minutes) {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}