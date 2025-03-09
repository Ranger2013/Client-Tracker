import getBlockOfTime from './getBlockOfTime.js';

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
export default async function getProjectedAppointments({appointmentDate, trimCycle, clientInfo, scheduleOptions, manageClient}) {
	console.log('In getProjectedAppointments:');
	try {
		let cID = clientInfo?.cID || null;
		
		const trimCycleValue = clientInfo?.trim_cycle || (trimCycle.options[trimCycle.selectedIndex].value !== 'null' ? trimCycle.options[trimCycle.selectedIndex].value : null);
		
		console.log('In getProjectedAppointments: before trimCycleValue: ', trimCycleValue);
		if(!trimCycleValue) return null;
		console.log('In getProjectedAppointments: after trimCycleValue: ', trimCycleValue);

		// Set up the Dates
		const [year, month, day] = appointmentDate.value.split('-');
		const nextTrim = new Date(year, month - 1, day);
		nextTrim.setHours(0,0,0,0);
 
		// Array of trim cycle days
		const trimCycleDays = [7, 14, 21, 28, 35, 42, 49, 56, 63, 70];
		const projectedBookingsData = [];

		for(const cycleDays of trimCycleDays){
			const pastDate = new Date(nextTrim);
			pastDate.setDate(nextTrim.getDate() - cycleDays);
			const formatedPastDate = pastDate.toISOString().slice(0,10);

			// Get the trim dates from the db
			console.log('In getProjectedAppointments.js: before trimDates: ', formatedPastDate);
			const trimDates = await manageClient.getClientScheduleByTrimDate(formatedPastDate);
			console.log('In getProjectedAppointments.js: after trimDates: ', trimDates);
			// const trimDates = await indexed.getAllStoreByIndexPromise(db, indexed.stores.CLIENTLIST, 'trim_date', formatedPastDate);

			console.log('In getProjectedAppointments.js, trimDates: ', trimDates);
			// Loop through the trim dates
			if(trimDates && trimDates.length > 0){
				for(const trimDate of trimDates){
					// Do not show the current client for projected dates or inactive clients or clients that do not match up with the trim cycle days
					if(trimDate.cID === cID || trimDate.active === 'no' || trimDate.trim_cycle !== cycleDays.toString()) continue;

					// const clientTrimming = await indexed.getStorePromise(db, indexed.stores.TRIMMING, trimDate.cID);
					const clientTrimming = await manageClient.getClientTrimmingInfo(trimDate.cID);
					let numHorses = trimDate.horses?.length || 1;
					let newClientMsg = '';

					if(clientTrimming?.trimmings?.length > 0){
						numHorses = clientTrimming.trimmings[clientTrimming.trimmings.length - 1].horses.length;
					}
					else if(!trimDate.horses || trimDate.horses.length === 0){
						newClientMsg = 'New Client.';
					}

					const bookingData = {
						client_name: trimDate.client_name,
						city: trimDate.city,
						num_horses: numHorses,
						new_client: newClientMsg,
						time_block: await getBlockOfTime({avgHorses: scheduleOptions.avg_horses, numberHorses: numHorses, avgDriveTime: scheduleOptions.avg_drive_time}),
					};

					projectedBookingsData.push(bookingData);
				}
			}
		}

		return projectedBookingsData.length > 0 ? projectedBookingsData : null;
	}
	catch (err) {
		throw err;
	}
}