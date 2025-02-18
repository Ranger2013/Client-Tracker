import calculateTime from "./calculateTime.js";

/**
 * Calculates the end time of a time block based on the average number of horses per hour, total number of horses, and average drive time.
 * 
 * @param {number} avgHorses - The average number of horses that can be handled per hour.
 * @param {number} num - The total number of horses.
 * @param {number} avgDriveTime - The average drive time in hours.
 * @param {string|null} [time=null] - The start time of the appointment, formatted as HH:MM.
 * @returns {Promise<string>} The calculated end time of the appointment block, formatted as HH:MM.
 * @throws {Error} Throws an error if there's an issue calculating the block time.
 */
export default async function getBlockOfTime(avgHorses, num, avgDriveTime, time = null) {
	try {
		let horsesPerHour = 60 / avgHorses; // can do 1 horse in x mins
		let driveTime = 60 * avgDriveTime; // Converts to seconds
		let workTime = (horsesPerHour * 60) * num; // Converts to seconds should be times the number of horses the user has.

		let totalSeconds = workTime + driveTime;
		let hours = Math.floor(totalSeconds / 3600);
		let minutes = Math.floor((totalSeconds % 3600) / 60);

		// Convert hours and minutes to strings and pad with zeros if necessary
		let blockTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		let endTime = time ? calculateTime(time, blockTime) : blockTime;
		return endTime;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('getBlockOfTimeError', 'Get Block of Time Error: ', err);
		throw err;
	}
} 