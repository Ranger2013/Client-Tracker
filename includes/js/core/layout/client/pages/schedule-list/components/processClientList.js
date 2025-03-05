import { sortByTrimDateAndAppTime } from '../../../../../utils/date/dateUtils.js';

export default async function processClientList({
	clientList,
	active,
	primaryKey,
	fragment,
	uniqueClientIds,
	counter,
	colorOptions,
	dateTime
}) {
	try{
		// Sort the client list by date and app time
		clientList.sort((a,b) => sortByTrimDateAndAppTime(a, b, true));

		// Loop through the client list
		for( const [index, client] of clientList.entries()){
			// Make sure we are going to show this client
			if(!shouldProcessClient(client, active, primaryKey)) continue;

			// We are setting up our counter to count how many clients we have
			if(!uniqueClientIds.has(client.cID)){
				uniqueClientIds.add(client.cID);
				counter++;
			}

			// Build the client list row
			const clientRow = await buildClientListRow({
				client,
				index,
				colorOptions,
				dateTime,
			})
		}
	}
	catch(err){
		console.log(err);
	}
}

/**
 * Check if client should be processed based on filters
 * @private
 */
function shouldProcessClient(client, active, primaryKey) {
	if (typeof active === 'string' && client.active.toLowerCase() === active.toLowerCase()) {
		 return true;
	}
	
	if (client.primaryKey === primaryKey) {
		 return true;
	}

	return false;
}
