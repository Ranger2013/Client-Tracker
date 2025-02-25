/**
 * Predicts the number of horses for the next session based on the client's trimming history.
 * 
 * @param {string} clientID - The ID of the client.
 * @param {Object} manageClient - An instance of the ManageClient class.
 * @param {number} totalHorses - The total number of horses.
 * @returns {Promise<number>} The predicted number of horses for the next session.
 * @throws {Error} Throws an error if there's an issue retrieving or processing the client trimming information.
 */
export default async function predictNextSessionNumberHorses(clientID, manageClient, totalHorses) {
	try {
		const clientTrimmingInfo = await manageClient.getClientTrimmingInfo(clientID);

		if (!clientTrimmingInfo) {
			return 1;
		}
		
		let pattern = await detectTrimmingPattern(clientTrimmingInfo, totalHorses);

		if (!pattern) {
			return totalHorses ? totalHorses : 1;
		}
 
		// Predict the number of horses for the next session
		const nextIndex = clientTrimmingInfo ? clientTrimmingInfo.trimmings.length % pattern.length : 0;
		return Math.min(pattern[nextIndex], totalHorses);
	}
	catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('predictNextSessionNumberHorses', 'Predict Next Session Number Horses: ', err);
		throw err;
	}
}

/**
* Detects the trimming pattern based on the client's historical trimming data.
* 
* @param {Object} clientTrimmingInfo - The client's trimming information, including historical data.
* @param {number} totalHorses - The total number of horses.
* @returns {Promise<number[]>|Promise<null>} The detected pattern of trimming sessions, or null if no pattern is detected.
* @throws {Error} Throws an error if there's no trimming history or if there's an issue processing the data.
*/
async function detectTrimmingPattern(clientTrimmingInfo, totalHorses) {
	try {
		if (!clientTrimmingInfo || !clientTrimmingInfo.trimmings) {
			return null;
		}

		const trimmings = clientTrimmingInfo.trimmings;
		const pattern = [];
		const sessionCount = trimmings.length;

		// Detect the pattern based on historical data
		for (let i = 1; i <= sessionCount / 2; i++) {
			let isPattern = true;
			for (let j = 0; j < sessionCount; j++) {
				if (trimmings[j].horses.length !== trimmings[j % i].horses.length) {
					isPattern = false;
					break;
				}
			}
			if (isPattern) {
				for (let k = 0; k < i; k++) {
					pattern.push(trimmings[k].horses.length);
				}
				break;
			}
		}

		// If no clear pattern is detected, use the total number of horses as a fallback
		if (pattern.length === 0) {
			pattern.push(totalHorses);
		}

		return pattern.length > 0 ? pattern : null;
	} catch (err) {
		const { default: errorLogs } = await import("../../error-messages/errorLogs.js");
		await errorLogs('detectingTrimmingPatternError', 'Detecting trimming pattern error: ', err);
		throw err;
	}
}

