import { predictHorsesAndServices } from '../appointment-block/components/predictNextSessionNumberHorses.js';

/**
 * Service for predicting which horses are due for service
 */
export default async function horsePredictionService({ trimmings, horses, appointmentDate, manageClient }) {
	// If we have the manageClient object, use full prediction with future appointments
	// if (manageClient && horses[0]?.cID) {
	// 	// Create client data object in the format predictNextSessionNumberHorses expects
	// 	const clientData = {
	// 		cID: horses[0].cID,
	// 		horses: horses,
	// 		trim_date: appointmentDate
	// 	};

	// 	// Use the more advanced prediction that considers future appointments
	// 	const result = await predictNextSessionNumberHorses({
	// 		clientData,
	// 		manageClient
	// 	});

	// 	// Extract just the horses array from the result
	// 	return result.horses;
	// }

	// Otherwise use the simpler direct prediction
	const predicted = await predictHorsesAndServices(trimmings, horses, appointmentDate);
	console.log('Predicted horses and services:', predicted);
	return predicted;
}
