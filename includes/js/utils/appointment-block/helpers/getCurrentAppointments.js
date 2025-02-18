import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
import { sortByTrimDateAndAppTime } from "../../date/dateUtils.js";
import appointmentBlockData from "./appointmentBlockData.js";
import predictNextSessionNumberHorses from "./predictNextSessionNumberHorses.js";

/**
 * Retrieves and processes the current appointments based on the provided date, schedule options, and date-time formats.
 * 
 * @param {Object} appointmentDate - An object representing the appointment date.
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
export default async function getCurrentAppointments(appointmentDate, scheduleOptions, dateTimeFormats, manageClient = null) {
	try {
		if (!scheduleOptions || !dateTimeFormats) throw new Error('No Schedule Options or Date/Time Options to create booked appointments. Please update your settings.');

		const { avg_horses, avg_drive_time } = scheduleOptions;
		const { date_format, time_format } = dateTimeFormats;

		let appList = [];
 
		// IDB Operations
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();
		const clientDataByTrimDate = await indexed.getAllStoreByIndexPromise(db, indexed.stores.CLIENTLIST, 'trim_date', appointmentDate.value);

		// Sort the dates
		clientDataByTrimDate.sort(sortByTrimDateAndAppTime);

		// If no dates, return early
		if (clientDataByTrimDate.length === 0) {
			return null;
		}

		// Using Set to track unique client id's so we don't have more than client showing up for appointments
		let clientsSet = new Set();

		for (let client of clientDataByTrimDate) {
			// Don't show appointments for inactive clients
			if (client.active === 'no') {
				continue;
			}

			// If we have a client with the id, continue to the next one
			if (clientsSet.has(client.cID)) {
				continue;
			}

			// Add this client to the Set.
			clientsSet.add(client.cID);

			// Set the number of client horses or 1 as a default
			const clientHorses = client.horses.length > 0 ? client.horses.length : 1;

			// Using a prediction algorythm to determine how many horses we may be doing at the next appointment
			const numberHorses = await predictNextSessionNumberHorses(client.cID, manageClient, clientHorses);

			const appointmentData = {
				cID: client.cID,
				primary_key: client.primaryKey,
				client_name: client.client_name,
				city: client.city,
				num_horses: numberHorses,
				avg_horses: avg_horses,
				avg_drive_time: avg_drive_time,
				app_time: client.app_time,
				time_format: time_format,
				date_format: date_format,
			};

			appList.push(await appointmentBlockData(appointmentData));
		}

		return appList;
	} catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('getCurrentAppointmentsError', 'Get Current Appointments Error: ', err);
		throw err;
	}
}