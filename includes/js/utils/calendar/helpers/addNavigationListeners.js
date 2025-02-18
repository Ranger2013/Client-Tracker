import { addListener } from "../../event-listeners/listeners.js";
import updateCalendar from "./updateCalendar.js";

export default async function addNavigationListeners(calendar, storedDates, onUpdate) {
	try {
		let currentMonth = new Date().getMonth();
		let currentYear = new Date().getFullYear();

		const prevButton = calendar.querySelector('#prev-button');
		const nextButton = calendar.querySelector('#next-button');

		addListener(prevButton, 'click', async () => {
			currentMonth--;

			if (currentMonth < 0) {
				currentMonth = 11;
				currentYear--;
			}

			await updateCalendar({currentMonth, currentYear, storedDates, calendar, onUpdate});
		});

		addListener(nextButton, 'click', async () => {
			currentMonth++;

			if (currentMonth > 11) {
				currentMonth = 0;
				currentYear++;
			}
			
			await updateCalendar({currentMonth, currentYear, storedDates, calendar, onUpdate});
		});
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('addNavigationListenersError', 'Add Navigation Listeners Error: ', err);
		throw err;
	}
}
