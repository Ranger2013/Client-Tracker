import errorLogs from "../../error-messages/errorLogs.js";
import { ucwords } from "../../string/stringUtils.js";

export default async function validateCity({evt}){
	try{
		// City cannot be empty
		if(!evt.target.value) return 'City cannot be empty.';

		// Format the input values
		evt.target.value = ucwords(evt.target.value);
		return;
	}
	catch(err){
		await errorLogs('validateStreetError', 'Validate street error: ', err);
		throw err;
	}
}