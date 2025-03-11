import processClientList from './processClientList.js';

export default async function buildAppointmentList({ active, clientId, primaryKey, manageClient, manageUser }) {
    try {
        const clientList = await fetchClientList({active, clientId, primaryKey, manageClient});

        // Return empty fragment if no data at all
        if (!clientList?.length && Object.keys(clientList).length === 0) {
            return document.createDocumentFragment();
        }

        // Normalize data structure - if single client object, convert to array
        const normalizedClientList = Array.isArray(clientList) ? clientList : [clientList];

        const userSettings = await manageUser.getSettings();
        const {
            color_options: colorOptions,
            date_time: dateTime,
        } = userSettings;
        
        const uniqueClientIds = new Set();
        let counter = 0;

        await handleNoSettings({colorOptions, dateTime});

        const fragment = document.createDocumentFragment();

        // Pass normalized array to processClientList
        await processClientList({
            clientList: normalizedClientList, 
            active, 
            primaryKey, 
            fragment, 
            uniqueClientIds, 
            counter, 
            colorOptions, 
            dateTime
        });
        
        return fragment;
    }
    catch(err) {
        throw err;
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
