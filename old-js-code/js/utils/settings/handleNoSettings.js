import { AppError } from '../errors/AppError.js';
import { handleError } from '../error-messages/errorHandler.js';

export async function handleNoSettings() {
    try {
		let settingsMsg = '';

		if(Object.keys(colorOptions).length === 0) {
			settingsMsg += 'Please set your color options in the settings.<br>';
		}

		if(Object.keys(dateTime).length === 0) {
			settingsMsg += 'Please set your date and time options in the settings.';
		}

		if(settingsMsg !== '') {
			// myError('page-msg', settingsMsg);
			throw new AppError('Settings not found', {
				 userMessage: 'Unable to load user settings. Please try again.',
				 errorCode: 'SETTINGS_NOT_FOUND'
			});
		}
    } catch (error) {
        await handleError(error, 'handleNoSettings');
    }
}
