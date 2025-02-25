
import addListenersToDateCells from "./addListenersToDateCells.js";
import generateCalendar from "./generateCalendar.js";
import updateMonthName from "./updateMonthName.js";

export default async function updateCalendar({currentMonth, currentYear, storedDates, calendar, onUpdate}) {
	try {
		// Clear the calendar body. These are the rows of days in the table
		const calendarBody = calendar.querySelector('#calendar-body');

		calendarBody.innerHTML = '';

		// Generate the calendar
		calendarBody.appendChild(await generateCalendar(currentMonth, currentYear, storedDates));

		// Update the month name
		await updateMonthName(currentMonth, currentYear, calendar);

		// Add listeners to each day
		await addListenersToDateCells(storedDates, calendar, onUpdate);
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('updateCalendarError', 'Update Calendar Error: ', err);
	}
}