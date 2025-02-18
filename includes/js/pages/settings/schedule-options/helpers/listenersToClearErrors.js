
import { clearMsg } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import { underscoreToHyphenPlusError } from "../../../../utils/string/stringUtils.js";

export default function listenersToClearErrors(form){
	try{
		// Get all the inputs for the form
		const inputs = form.querySelectorAll('input');

		for(const input of inputs){
			addListener(input, 'focus', (evt) => {
				clearMsg({container: underscoreToHyphenPlusError(input.id), input: input});
			});
		}
	}
	catch(err){
		console.warn('listeners to clear errors error: ', err);		
	}
}