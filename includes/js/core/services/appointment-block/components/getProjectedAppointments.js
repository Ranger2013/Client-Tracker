import getBlockOfTime from './getBlockOfTime.js';
import predictNextSessionNumberHorses from './predictNextSessionNumberHorses.js';

const COMPONENT = 'Get Projected Appointments';
const DEBUG = true;

const debugLog = (...args) => {
	if(DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Retrieves and processes projected appointments based on the provided trim date, trim cycle, client information, and schedule options.
 * 
 * @param {Object} trimDate - An object representing the trim date.
 * @param {HTMLSelectElement} trimCycle - The HTML select element for the trim cycle.
 * @param {Object} clientInfo - An object containing client information.
 * @param {string} clientInfo.cID - The client's ID.
 * @param {string} clientInfo.trim_cycle - The client's trim cycle.
 * @param {Object} scheduleOptions - An object containing scheduling options.
 * @param {number} scheduleOptions.avg_horses - The average number of horses per hour.
 * @param {number} scheduleOptions.avg_drive_time - The average drive time.
 * @returns {Promise<Object[]|null>} A promise that resolves to an array of projected booking data or null if no projections are found.
 * @throws {Error} Throws an error if there's an issue retrieving or processing the projected appointments.
 */
export default async function getProjectedAppointments({ appointmentDate, trimCycle, clientInfo, scheduleOptions, manageClient }) {
	try {
		let cID = clientInfo?.cID || null;
		const trimCycleValue = clientInfo?.trim_cycle || (trimCycle.options[trimCycle.selectedIndex].value !== 'null' ? trimCycle.options[trimCycle.selectedIndex].value : null);

		if (!trimCycleValue) return null;

		// Set up the Dates
		const [year, month, day] = appointmentDate.value.split('-');
		const nextTrim = new Date(year, month - 1, day);
		nextTrim.setHours(0, 0, 0, 0);
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);

		const projectedBookingsData = [];
		const processedClients = new Set();

		for (const cycleDays of [7, 14, 21, 28, 35, 42, 49, 56, 63, 70]) {
			const pastDate = new Date(nextTrim);
			pastDate.setDate(nextTrim.getDate() - cycleDays);

			// If we've gone past current date, no need to look further back
			if (pastDate <= currentDate) {
				return projectedBookingsData.length > 0 ? projectedBookingsData : null;
			}

			debugLog('Past Date: ', pastDate);
			debugLog('Past Date to ISO String: ', pastDate.toISOString());
			const formattedPastDate = pastDate.toISOString().slice(0, 10);
			debugLog('Formatted Past Date: ', formattedPastDate);
			const trimDates = await manageClient.getClientScheduleByTrimDate(formattedPastDate);
			debugLog('Trim Dates: ', trimDates);
			if (trimDates?.length > 0) {
				for (const trimDate of trimDates) {
					if (processedClients.has(trimDate.cID) ||
						trimDate.cID === cID ||
						trimDate.active === 'no' ||
						trimDate.trim_cycle !== cycleDays.toString()) {
						continue;
					}

					processedClients.add(trimDate.cID);
					const bookingData = await buildProjectedBookingData(trimDate, manageClient, scheduleOptions);
					if (bookingData) {
						projectedBookingsData.push(bookingData);
					}
				}
			}
		}

		return projectedBookingsData.length > 0 ? projectedBookingsData : null;
	}
	catch (err) {
		throw err;
	}
}

async function buildProjectedBookingData(trimDate, manageClient, scheduleOptions) {
    debugLog('Building projected booking data for:', trimDate);

	 // Use predictNextSessionNumberHorses to get actual service predictions
    const prediction = await predictNextSessionNumberHorses({ 
        clientData: { 
            ...trimDate, 
            scheduleOptions 
        }, 
        manageClient 
    });
    debugLog('Prediction result:', prediction);

    // Validate time_block value
    const timeBlock = prediction?.totalTime || 0;
    debugLog('Time block calculation:', {
        predictionTotalTime: prediction?.totalTime,
        finalTimeBlock: timeBlock
    });

    return {
        client_name: trimDate.client_name,
		  cID: trimDate.cID,
		  primaryKey: trimDate.primaryKey,
        city: trimDate.city,
        num_horses: prediction?.horses?.length || 0,
        new_client: (!trimDate.horses || trimDate.horses.length === 0) ? 'New Client.' : '',
        predicted_services: prediction?.serviceBreakdown || { trims: 0, halfSets: 0, fullSets: 0 },
        time_block: timeBlock
    };
}