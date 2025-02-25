import { errorLogAPI } from "../network/apiEndpoints.js";
import { logServerSideError } from "../../../../includes/js/core/network/services/network.js";

export default async function errorLogs(fileName, msg, err){
	try{
		await logServerSideError(errorLogAPI, err, fileName);
	}
	catch(error){
		console.warn('Error Logs Error: ', msg);
	}
}