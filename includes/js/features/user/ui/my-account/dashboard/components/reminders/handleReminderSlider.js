// Setup debug mode
const COMPONENT = 'Handle reminder slider';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function handleReminderSlider({ evt, manageUser, componentId }) {
	try {
		const checkbox = evt.target;
		const timestamp = new Date().getTime();
		
		// Update user settings based on checkbox state
		const data = {
			status: checkbox.checked ? 'yes' : 'no',
			timestamp
		};

		await manageUser.updateLocalUserSettings({
			userData: data,
			settingsProperty: 'reminders'
		});
	}
	catch(err) {
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		}, true);
	}
}
