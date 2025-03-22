import { formatTime } from '../../../utils/date/dateUtils.min.js';
import { cleanUserOutput } from '../../../utils/string/stringUtils.js';

/**
 * Processes appointment data and returns an object with formatted appointment block details.
 * 
 * @param {Object} data - The appointment data.
 * @returns {Promise<Object>} The formatted appointment block data.
 */
export default async function appointmentBlockData(data) {
	try {
		const {
			cID,
			client_name: clientName,
			num_horses: numberOfHorses,
			predicted_time: totalMinutes,
			time_format: timeFormat,
			app_time: appTime,
			primary_key: primaryKey,
			city,
			service_breakdown
		} = data;

		// Calculate end time by adding total minutes to start time
		const endTime = calculateEndTime(appTime, totalMinutes);

		// Format times according to user preference
		const startTime = parseInt(timeFormat) === 12 ? formatTime(appTime, 12) : formatTime(appTime, 24);
		const formattedEndTime = parseInt(timeFormat) === 12 ? formatTime(endTime, 12) : formatTime(endTime, 24);

		// Create detailed service breakdown message
		const serviceMessage = buildServiceMessage(service_breakdown);

		return {
			cID,
			primaryKey,
			client_name: cleanUserOutput(clientName),
			num_horses: numberOfHorses,
			city: cleanUserOutput(city),
			start: startTime,
			end: formattedEndTime,
			service_breakdown,
			prediction_message: `Predicted services: <span class="w3-small">${serviceMessage}</span>`,
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

/**
 * Calculates the end time by adding minutes to the start time
 */
function calculateEndTime(startTime, totalMinutes) {
	const [hours, minutes] = startTime.split(':').map(Number);
	const totalTime = hours * 60 + minutes + totalMinutes;
	
	const endHours = Math.floor(totalTime / 60) % 24;
	const endMinutes = totalTime % 60;
	
	return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

/**
 * Builds a human-readable service breakdown message
 */
function buildServiceMessage(breakdown) {
	const services = [];
	if (breakdown.trims > 0) {
		services.push(`${breakdown.trims} trim${breakdown.trims > 1 ? 's' : ''}`);
	}
	if (breakdown.halfSets > 0) {
		services.push(`${breakdown.halfSets} half set${breakdown.halfSets > 1 ? 's' : ''}`);
	}
	if (breakdown.fullSets > 0) {
		services.push(`${breakdown.fullSets} full set${breakdown.fullSets > 1 ? 's' : ''}`);
	}
	return services.join(', ') || 'No services predicted';
}