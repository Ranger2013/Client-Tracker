import { getValidElement } from '../elements.min.js';
import { clearMsg } from '../messages.min.js';

// Set up Debug mode
const COMPONENT = 'Filter Client Select Element';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const savedOptions = new Map();

export default async function filterClientList({evt, selectElement}) {
	try {
		clearMsg({ container: 'form-msg' });
		const userInput = evt.target.value.toLowerCase();
		const selectClient = getValidElement(selectElement);

		// If input is empty, restore all saved options
		if (!userInput) {
			savedOptions.forEach((option) => {
				selectClient.add(option);  // Direct re-add is fine
			});
			savedOptions.clear();  // Clear the Map after restoring
			return;
		}

		// Check current options
		Array.from(selectClient.options).forEach(option => {
			if (!option.text.toLowerCase().includes(userInput) && option.value !== 'null') {
				savedOptions.set(option.value, option);
				option.remove();
			}
		});

		// Check saved options to see if any should be restored
		savedOptions.forEach((option, value) => {
			if (option.text.toLowerCase().includes(userInput)) {
				selectClient.add(option);
				savedOptions.delete(value);
			}
		});

		debugLog('Map: ', savedOptions);
	}
	catch (err) {
		const { AppError } = await import("../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'Search functionality not available at the moment.',
		});
	}
}