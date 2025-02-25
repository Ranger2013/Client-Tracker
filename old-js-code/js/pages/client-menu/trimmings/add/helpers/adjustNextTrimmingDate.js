export default async function adjustNextTrimmingDate({ clientInfo }) {
	try {
		// DOM Elements
		const nextTrimDate = document.getElementById('next-trim-date');
		const trimDate = document.getElementById('trim-date');

		// Get the clients trim cycle
		const trimCycle = clientInfo.trim_cycle;

		// Change the next trim date value.
		const newDate = await adjustTrimDate(trimDate, trimCycle);

		nextTrimDate.value = await adjustTrimDate(trimDate, trimCycle);
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'adjustNextTrimmingDateError',
			'Adjust next trimming date error: ',
			err,
		);
	}
}

async function adjustTrimDate(trimDate, trimCycle) {
	try {
		const today = new Date(trimDate.value);

		// Add the trimCycle (number of days) to the date
		today.setDate(today.getDate() + parseInt(trimCycle, 10));

		// Format the new date
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		handleError(
			'adjustTrimDateError',
			'Adjust trim date error: ',
			err,
		);
	}
}