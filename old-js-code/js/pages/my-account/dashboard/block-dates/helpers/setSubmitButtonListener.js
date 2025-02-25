
import { addListener } from "../../../../../utils/event-listeners/listeners.js";
import handleBlockDatesFormSubmission from "./handleBlockDatesFormSubmission.js";

export default async function setSubmitButtonListener(submitButton, fm, dates){
	try{
		addListener(submitButton, 'click', (evt) => {
			handleBlockDatesFormSubmission(evt, fm, dates);
		});
	}
	catch(err){
		console.warn('Set submit button listener error: ', err);		
	}
}