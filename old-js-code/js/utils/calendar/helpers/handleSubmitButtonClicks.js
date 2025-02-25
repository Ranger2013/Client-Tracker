
import ManageUser from "../../../classes/ManageUser.js";
import { mySuccess, top } from "../../dom/domUtils.js";
import errorLogs from "../../error-messages/errorLogs.js";
import { addListener } from "../../event-listeners/listeners.js";

export default async function handleSubmitButtonClicks(submitButton, clearDatesButton, datesArray, fm){
	try{
		const manageUser = new ManageUser();

		// Add the listener for the submit button
		await submitButtonListener(submitButton, datesArray, manageUser, fm);

		// Listener for the clear dates button
		await clearDatesButtonListener(clearDatesButton, datesArray, manageUser, fm);
	}
	catch(err){
		await errorLogs('handleSubmitButtonClicksError', 'Handle Submit Button Clicks Error: ', err);
	}
}

async function submitButtonListener(button, datesArray, manageUser, fm){
	addListener(button, 'click', async () => {
		try{
			const update = await manageUser.updateLocalUserSettings({userData: datesArray, settingsProperty: 'blocked_dates'});

			if(update){
				mySuccess(fm, 'Your blocked dates have been added.');
				top();
			}
		}
		catch(err){
			await errorLogs('submitButtonListenerError', 'Submit Button Listener Error: ', err);
			throw new Error('Unable to add your blocked dates.');
		}
	});
}

async function clearDatesButtonListener(button, datesArray, manageUser, fm){
	addListener(button, 'click', async () => {
		try{
			await manageUser.updateLocalUserSettings({userData: datesArray, settingsProperty: 'blocked_dates'});
		}
		catch(err){
			await errorLogs('clearDatesButtonListenerError', 'Clear Dates Button Listener Error: ', err);
			throw new Error('Unable to clear your blocked dates.');
		}
	});
}