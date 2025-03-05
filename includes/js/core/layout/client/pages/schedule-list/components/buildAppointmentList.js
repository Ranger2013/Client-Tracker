import processClientList from './processClientList.js';

export default async function buildAppointmentList({ active, clientId, primaryKey, manageClient, manageUser }) {
	try{
		const clientList = await fetchClientList({active, clientId, primaryKey, manageClient});

		if(!clientList?.length) {
			return [document.createDocumentFragment(), 0];
		}

		const userSettings = await manageUser.getSettings();

		// Destructure the color options and date time settings
		const {
			color_options: colorOptions,
			date_time: dateTime,
		} = userSettings;
		
		const fragment = document.createDocumentFragment();
		const uniqueClientIds = new Set();
		let counter = 0;

		// Display a message to the user if there are no settings
		await handleNoSettings({colorOptions, dateTime});
		await processClientList({clientList, active, primaryKey, fragment, uniqueClientIds, counter, colorOptions, dateTime});
	}
	catch(err){

	}
}

/**
 * Fetch client list data
 * @private
 */
async function fetchClientList({active, clientId, primaryKey, manageClient}) {
	try {
		 if (active && (active === 'yes' || active === 'no')) {
			  return await manageClient.getClientScheduleList();
		 }
		 else {
			  const cID = Number(clientID);
			  return await manageClient.getClientInfo({ primaryKey });
		 }
	}
	catch (err) {
		 throw err;
	}
}

async function handleNoSettings({colorOptions, dateTime}){
	try{
		let settingsMsg = '';

		if(Object.keys(colorOptions).length === 0) {
			settingsMsg += 'Please set your color options in the settings.<br>';
		}

		if(Object.keys(dateTime).length === 0) {
			settingsMsg += 'Please set your date and time options in the settings.';
		}

		if(settingsMsg !== '') {
			myError('page-msg', settingsMsg);
		}
	}
	catch(err){
		throw err;
	}
}
