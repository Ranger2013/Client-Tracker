import { addListener, removeListeners } from "../../../../utils/event-listeners/listeners.js";
import { createDebouncedHandler, getOptimalDelay } from "../../../../utils/event-listeners/eventUtils.js";
import { handleFormSubmission, handleHorseNameInput } from "./helpers/horseHelpers.js";

const COMPONENT_ID = 'add-horse-component';

export default async function addHorse({ cID, primaryKey }) {
	try {
		setupEventListeners(cID, primaryKey);
		return () => removeListeners(COMPONENT_ID);
	} catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('addHorseError', err, `Error initializing add horse functionality.`);
	}
}

function setupEventListeners(cID, primaryKey) {
	addListener('horse-name', 'input',
		createDebouncedHandler(async (evt) => {
			await handleHorseNameInput(evt, cID, primaryKey, COMPONENT_ID);
		}, getOptimalDelay('validation')), // Automatically determines best delay
		COMPONENT_ID
	);

	addListener('add-horse-form', 'submit',
		async (evt) => {
			evt.preventDefault();
			await handleFormSubmission(evt, cID, primaryKey);
		},
		COMPONENT_ID
	);
}