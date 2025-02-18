import { errorLogAPI } from "../network/apiEndpoints.js";
import { logServerSideError } from "../network/network.js";

export default async function errorLogs(fileName, msg, err){
	try{
		await logServerSideError(errorLogAPI, err, fileName);
	}
	catch(error){
		console.warn('errorLogs Error. ', msg);
	}
}