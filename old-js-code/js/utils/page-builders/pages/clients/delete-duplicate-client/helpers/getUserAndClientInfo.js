import ManageClient from "../../../../../../classes/ManageClient.js";
import ManageUser from "../../../../../../classes/ManageUser.js";

export async function getDuplicateClients() {
	try {
		// Manage Client class
		const manageClient = new ManageClient();
		const clientInfo = await manageClient.getAllDuplicateClients();
		return clientInfo;
	}
	catch(err){
		throw err;
	}
}

export async function getUserDateTimeOptions() {
	try{
		// Manage User class
		const manageUser = new ManageUser();
		const dateTimeOptions = await manageUser.getDateTimeOptions();
		return dateTimeOptions;
	}
	catch(err){
		throw err;
	}
}