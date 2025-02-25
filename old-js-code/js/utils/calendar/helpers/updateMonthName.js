
export default async function updateMonthName(currentMonth, currentYear, calendar) {
	try {
		const monthName = calendar.querySelector('#month-name');
		monthName.textContent = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('updateMonthNameError', 'Update Month Name Error: ', err);
		throw err;
	}
}
