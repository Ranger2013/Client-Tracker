import { logServerSideError } from "../../../../includes/js/core/errors/services/errorLogger.js";
import { errorLogAPI } from "../network/apiEndpoints.js";

export default async function errorLogs(fileName, msg, err){
	try{
		await logServerSideError(errorLogAPI, err, fileName);
	}
	catch(error){
		console.warn('Error Logs Error: ', msg);
	}
}