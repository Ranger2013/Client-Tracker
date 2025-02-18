import { clearMsg } from "../../dom/domUtils.js";
import errorLogs from "../../error-messages/errorLogs.js";
import { isNumeric } from "../validationUtils.js";

export default async function validateDistance({evt}){
	try{
		if(!evt.target.value){
			clearMsg({container: `${evt.target.id}-error`, hide: true, input: evt.target.id});
			return;
		}

		if(!isNumeric(evt.target.value, true)){
			return 'Distance must by a number.';
		}
	}
	catch(err){
		await errorLogs('validateDistanceError', 'Validate distance error: ', err);
		throw err;
	}
}