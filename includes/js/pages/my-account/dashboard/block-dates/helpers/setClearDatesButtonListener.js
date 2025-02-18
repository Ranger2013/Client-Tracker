
import { addListener } from "../../../../../utils/event-listeners/listeners.js";
import handleClearBlockDatesFormSubmission from "./handleClearBlockDatesFormSubmission.js";

export default async function setClearDatesButtonListener(submitButton, fm, calendar, storedDates, onUpdate){
	try{
		addListener(submitButton, 'click', async (evt) => {
			await handleClearBlockDatesFormSubmission(evt, fm, calendar, storedDates, onUpdate);
		});
	}
	catch(err){
		console.warn('Set clear dates button listener error: ', err);
		
	}
}