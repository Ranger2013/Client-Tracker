/**
 * Calculates the mileage charges based on the client's distance and the mileage charges configuration.
 * 
 * @param {number} clientDistance - The distance of the client.
 * @param {Array|Object} mileageCharges - The mileage charges configuration. Can be an array of ranges or an object with per mile charges.
 * @returns {Object} An object containing the mileage cost and whether the client is in range.
 * @property {boolean} inRange - Indicates if the client is within the mileage range.
 * @property {number} cost - The calculated mileage cost.
 */
export default function getMileageCharges(clientDistance, mileageCharges) {
	let mileageCost = 0;
	let isInRange = false;

	// Handle the mileage ranges
	if (Array.isArray(mileageCharges)) {
		for (const { range, cost } of mileageCharges) {
			// Split the range and keep them as strings initially
			const [startStr, endStr] = range.split('-');
			const start = parseInt(startStr, 10);

			// Check for the '+' sign in the end range
			const endNumber = endStr.includes('+') ? parseInt(endStr.replace('+', ''), 10) : parseInt(endStr, 10);

			if (endStr.includes('+') && clientDistance >= start) {
				mileageCost = cost;
				isInRange = true;
				break;
			} else if (clientDistance >= start && clientDistance <= endNumber) {
				mileageCost = cost;
				isInRange = true;
				break;
			}
		}
	}
	// Handle a set price from the starting mile
	else {
		if(!mileageCharges) {
			return { inRange: false, cost: 0 };
		}

		const { cost_per_mile, starting_mile, base_cost} = mileageCharges;
		const costPerMile = parseFloat(cost_per_mile);
		const start = parseInt(starting_mile, 10);
		const distance = parseInt(clientDistance, 10);
		const addedCost = parseInt(base_cost, 10) || 0;

		if (distance >= start) {
			mileageCost = Math.round(((distance - start) * costPerMile) + addedCost);
			isInRange = true;
		}
	}

	return { inRange: isInRange, cost: mileageCost };
}