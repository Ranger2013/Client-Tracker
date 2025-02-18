import errorLogs from "../../error-messages/errorLogs.js";
import { ucwords } from "../../string/stringUtils.js";

export default async function validateStreet({evt}){
	try{
		evt.target.value = ucwords(evt.target.value);
		if(evt.target.value === '') return 'Street address cannot be empty.';
	}
	catch(err){
		await errorLogs('validateStreetError', 'Validate street error: ', err);
		throw err;
	}
}