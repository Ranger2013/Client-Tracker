import { buildEle } from '../../../utils/dom/elements.js';
 
/**
 * Builds and displays a block indicating no appointments for the provided date.
 * 
 * @param {HTMLElement} appointmentContainer - The container element where the no appointments block will be displayed.
 * @param {string} date - The date for which there are no appointments.
 * @returns {Promise<void>} A promise that resolves when the no appointments block is built and displayed.
 * @throws {Error} Throws an error if there's an issue building the no appointments block.
 */
export default async function buildNoAppointmentsBlock({appointmentContainer, date}) {
	try {
		const blockContainer = buildEle({
			type: 'div',
			myClass: ['w3-padding-small', 'w3-light-green']
		});

		const notice = buildEle({
			type: 'h6',
			myClass: ['w3-center', 'w3-text-black'],
			text: `No Bookings for ${date}`
		});

		blockContainer.appendChild(notice);

		appointmentContainer.innerHTML = '';
		appointmentContainer.appendChild(blockContainer);
	}
	catch (err) {
		throw err;
	}
}