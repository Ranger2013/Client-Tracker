import errorLogs from "../../error-messages/errorLogs.js";

export default async function validateTrimCycleEvent({evt}){
	try{
		const weeks = ['7', '14', '21', '28', '35', '42', '49', '56', '63', '70'];
		const check = weeks.includes(evt.target.value);
		if(!check) return 'Please select a trim/shoeing cycle.';		
	}
	catch(err){
		await errorLogs('validateTrimCycleError', 'Validate trim cycle error: ', err);
		throw err;
	}
}