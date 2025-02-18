import { addListener } from "../../event-listeners/listeners.js";

export default async function addListenersToDateCells(storedDates, calendar, onUpdate) {
	try {
		const dayCells = calendar.querySelectorAll('.day');
		
		dayCells.forEach(cell => {
			const date = cell.dataset.date;
			const index = storedDates.indexOf(date);
			addListener(cell, 'click', () => {
				
				if (index > -1) {
					// If the date is selected, remove it from the array and update the class
					storedDates.splice(index, 1);
					cell.classList.remove('selected');
				}
				else {
					// If the date is not selected, add it to the array and update the class
					storedDates.push(date);
					cell.classList.add('selected');
				}
				
				onUpdate(storedDates);
			});
		});
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('addListenersToDateCellsError', 'Add Listeners to Date Cells Error: ', err);
	}
}