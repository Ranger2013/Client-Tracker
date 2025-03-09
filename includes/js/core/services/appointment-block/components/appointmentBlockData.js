import { formatTime } from '../../../utils/date/dateUtils.js';
import { cleanUserOutput } from '../../../utils/string/stringUtils.js';
import getBlockOfTime from './getBlockOfTime.js';


/**
 * Processes appointment data and returns an object with formatted appointment block details.
 * 
 * @param {Object} data - The appointment data.
 * @param {string} data.client_name - The client's name.
 * @param {number} data.num_horses - The number of horses for the appointment.
 * @param {number} data.avg_horses - The average number of horses per hour.
 * @param {number} data.avg_drive_time - The average drive time.
 * @param {string} data.time_format - The time format (12 or 24).
 * @param {string} data.app_time - The appointment time.
 * @param {string} data.primary_key - The primary key of the appointment.
 * @returns {Promise<Object>} The formatted appointment block data.
 * @throws {Error} Throws an error if there's an issue processing the appointment data.
 */
export default async function appointmentBlockData(data) {
	try {
		// Destructure the data
		let {
			client_name: clientName,
			num_horses: numberOfClientHorses,
			avg_horses: avgNumHorsesPerHour,
			avg_drive_time: avgDriveTime,
			time_format: timeFormat,
			app_time: appTime,
			primary_key: primaryKey
		} = data;


		// Get the block of time
		const timeBlock = await getBlockOfTime({ avgHorses: avgNumHorsesPerHour, numberHorses: numberOfClientHorses, avgDriveTime, time: appTime });

		// Set the start and end times according to the format
		const startTime = parseInt(timeFormat) === 12 ? formatTime(appTime, 12) : formatTime(appTime, 24);
		const endTime = parseInt(timeFormat) === 12 ? formatTime(timeBlock, 12) : formatTime(timeBlock, 24);

		return {
			cID: data.cID,
			primaryKey,
			client_name: cleanUserOutput(clientName),
			num_horses: numberOfClientHorses,
			city: cleanUserOutput(data.city),
			start: startTime,
			end: endTime
		};
	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.PROCESSING_ERROR,
			userMessage: 'Unable to process the appointment data.',
		}, true);
	}
}
