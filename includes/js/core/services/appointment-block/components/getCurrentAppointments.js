import { sortByTrimDateAndAppTime } from '../../../utils/date/dateUtils.min.js';
import appointmentBlockData from './appointmentBlockData.min.js';
import predictNextSessionNumberHorses from './predictNextSessionNumberHorses.min.js';

const COMPONENT = 'getCurrentAppointments';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Retrieves and processes the current appointments based on the provided date, schedule options, and date-time formats.
 * 
 * @param {string} appointmentDate - A string representing the appointment date.
 * @param {Object} scheduleOptions - An object containing scheduling options.
 * @param {number} scheduleOptions.avg_horses - The average number of horses per hour.
 * @param {number} scheduleOptions.avg_drive_time - The average drive time.
 * @param {Object} dateTimeFormats - An object containing date and time formats.
 * @param {string} dateTimeFormats.date_format - The date format.
 * @param {string} dateTimeFormats.time_format - The time format (12 or 24).
 * @param {Object|null} [manageClient=null] - An instance of the ManageClient class, or null if not used.
 * @returns {Promise<Object[]|null>} A promise that resolves to an array of appointment block data or null if no appointments are found.
 * @throws {Error} Throws an error if there's an issue retrieving or processing the appointment data.
 */
export default async function getCurrentAppointments({ appointmentDate, scheduleOptions, dateTimeFormats, manageClient = null }) {
	try {
		if (!scheduleOptions || !dateTimeFormats) throw new Error('No Schedule Options or Date/Time Options to create booked appointments. Please update your settings.');

		// const { avg_horses: avgHorses, avg_drive_time: avgDriveTime } = scheduleOptions;
		const { avg_drive_time: avgDriveTime, avg_trim: avgTrimTime, full_set: fullSetTime, half_set: halfSetTime } = scheduleOptions;

		const { date_format: dateFormat, time_format: timeFormat } = dateTimeFormats;
		let appList = [];

		const clientDataByTrimDate = await manageClient.getClientScheduleByTrimDate(appointmentDate);

		if (clientDataByTrimDate.length === 0) return null; // Return early if no dates

		// Sort the dates
		clientDataByTrimDate.sort((a, b) => sortByTrimDateAndAppTime(a, b, true));

		// Using Set to track unique client id's so we don't have more than one client showing up for appointments
		let clientsSet = new Set();

		for (let client of clientDataByTrimDate) {
			const { cID,
				primaryKey,
				active,
				client_name: clientName,
				city,
				horses,
				app_time: appTime,
			 } = client;

			// Don't show appointments for inactive clients
			if (active === 'no') {
				continue;
			}

			// If we have a client with the id, continue to the next one
			if (clientsSet.has(cID)) {
				continue;
			}

			// Add this client to the Set.
			clientsSet.add(cID);

			// Set the number of client horses or 1 as a default
			const clientHorses = horses.length > 0 ? horses.length : 1;
			debugLog('clientHorses: ', clientHorses);

			// Get prediction including time calculations
			const prediction = await predictNextSessionNumberHorses({ 
				clientData: { 
					...client, 
					scheduleOptions 
				}, 
				manageClient 
			});

			debugLog('prediction: ', prediction);

			const appointmentData = {
				cID,
				primary_key: primaryKey,
				client_name: clientName,
				city,
				num_horses: prediction.horses.length,
				predicted_time: prediction.totalTime,
				service_breakdown: prediction.serviceBreakdown,
				app_time: appTime,
				time_format: timeFormat,
				date_format: dateFormat,
			};
			debugLog('appointmentData: ', appointmentData);

			appList.push(await appointmentBlockData(appointmentData));
		}
		debugLog('appList: ', appList);
		return appList;
	}
	catch (err) {
		throw err;
	}
}