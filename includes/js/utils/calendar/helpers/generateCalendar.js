import { buildEle } from "../../dom/domUtils.js";

export default async function generateCalendar(month, year, storedDates = []) {
	try {
		// DOM Elements
		const fragment = document.createDocumentFragment();;

		// Clear the calendar
		// calendarBody.innerHTML = '';

		const firstDay = new Date(year, month).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		let cellDate = 1;
		let completed = false; // To break out of the loop if we reach the end

		// Creating the rows for the calendar
		for (let i = 0; i < 6; i++) {
			if (completed) break; // Break the loop if it is finished

			const row = buildEle({
				type: 'tr',
			});

			// Creating the cells in the row
			for (let x = 0; x < 7; x++) {
				if (i === 0 && x < firstDay) {
					const cell = buildEle({
						type: 'td',
						myClass: ['empty-cell'],
					});

					row.appendChild(cell);
				}
				else if (cellDate > daysInMonth) {
					break;
				}
				else {
					const cell = buildEle({
						type: 'td',
						myClass: ['day', 'w3-pointer'],
						text: cellDate,
						attributes: {
							'data-date': new Date(year, month, cellDate).toISOString().split('T')[0]
						}
					});
					
					// Check if the date is in storedDates and mark as selected if it is
					if (storedDates.includes(cell.dataset.date)) {
						cell.classList.add('selected');
					}

					row.appendChild(cell);
					cellDate++;
				}
			}
			
			fragment.appendChild(row);
		}

		return fragment;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('generateCalendarError', 'Generate Calendar Error: ', err);
	}
}
