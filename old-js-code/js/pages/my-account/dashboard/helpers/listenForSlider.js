
import { addListener } from "../../../../utils/event-listeners/listeners.js";

export default async function listenForSlider(reminderSlider, reminderInput, manageUser, settingsProperty){
	addListener(reminderSlider, 'click', async evt => {
		evt.preventDefault();

		// Set a time stamp
		let timestamp = new Date().getTime();

		// Toggle the check box status
		reminderInput.checked = !reminderInput.checked;

		// Get the state of the checkbox
		const sliderState = reminderInput.checked ? 'yes' : 'no';

		const data = {
			status: sliderState,
			timestamp: timestamp
		}

		// Update the user settings
		await manageUser.updateLocalUserSettings({userData: data, settingsProperty});
	});
}