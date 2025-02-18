import setupCalendarElements from "./helpers/setupCalendarElements.js";
import updateCalendar from "./helpers/updateCalendar.js";
import addNavigationListeners from "./helpers/addNavigationListeners.js";

let cleanup = null;

export default async function buildCalendar(storedDates, fm, onUpdate) {
	try {
		// Set up the calendar elements, the storedDates gets passed along for the generate calendar
		const calendarElements = await setupCalendarElements(storedDates, fm); // Returns the element node of the calendar. Basically the skeleton of the calendar

		// Stored Dates
		let currentMonth = new Date().getMonth();
		let currentYear = new Date().getFullYear();

		// Add the navigation listeners for moving through the months
		await addNavigationListeners(calendarElements, storedDates, onUpdate);
		
		// Update the calendar
		await updateCalendar({currentMonth, currentYear, storedDates, calendar: calendarElements, onUpdate});
		
		// Return the calendar elements
		return calendarElements;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../utils/error-messages/errorLogs.js");
		await errorLogs('buildCalendarError', 'Build Calendar Error: ', err);
	}
}