import { sortByTrimDateAndAppTime } from '../../../utils/date/dateUtils.js';
import appointmentBlockData from './appointmentBlockData.js';
import predictNextSessionNumberHorses from './predictNextSessionNumberHorses.js';

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
	console.log('In getCurrentAppointments:');
	try {
		if (!scheduleOptions || !dateTimeFormats) throw new Error('No Schedule Options or Date/Time Options to create booked appointments. Please update your settings.');
		
		const { avg_horses, avg_drive_time } = scheduleOptions;
		const { date_format, time_format } = dateTimeFormats;

		let appList = [];
		const clientDataByTrimDate = await manageClient.getClientScheduleByTrimDate(appointmentDate);

		if (clientDataByTrimDate.length === 0) return null; // Return early if not dates

		// Sort the dates
		clientDataByTrimDate.sort((a, b) => sortByTrimDateAndAppTime(a, b, true));

		// Using Set to track unique client id's so we don't have more than client showing up for appointments
		let clientsSet = new Set();

		for (let client of clientDataByTrimDate) {
			const { cID,
				primaryKey,
				active,
				client_name: clientName,
				city,
				horses,
				avg_horses: avgHorses,
				avg_drive_time: avgDriveTime,
				app_time: appTime,
				time_format: timeFormat,
				date_format: dateFormat } = client;

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

			// Using a prediction algorythm to determine how many horses we may be doing at the next appointment
			console.log('In getCurrentAppointments: before predictNextSessionOfHorses: ', cID, clientHorses);
			const nextSessionOfHorses = await predictNextSessionNumberHorses({ clientId: cID, manageClient, totalHorses: clientHorses });
			console.log('In getCurrentAppointments: after nextSessionOfHorses: ', nextSessionOfHorses);
			const appointmentData = {
				cID,
				primary_key: primaryKey,
				client_name: clientName,
				city,
				num_horses: nextSessionOfHorses,
				avg_horses: avgHorses,
				avg_drive_time: avgDriveTime,
				app_time: appTime,
				time_format: timeFormat,
				date_format: dateFormat,
			};

			appList.push(await appointmentBlockData(appointmentData));
		}
		console.log('In getCurrentAppointments: pushing appList:');
		return appList;
	}
	catch (err) {
		throw err;
	}
}
