import { myError } from "../dom/domUtils.js";

export async function handleError(filename, consoleMsg, err, userMsg = null, errorEle = null) {
	const [ticket, errorLog] = await Promise.all([
		import("../error-messages/errorMessages.js"),
		import("../error-messages/errorLogs.js"),
	]);

	const { helpDeskTicket } = ticket;
	const { default: errorLogs } = errorLog;
	await errorLogs(filename, consoleMsg, err);

	if(userMsg && errorEle){
		if(typeof errorEle === 'string') errorEle = document.getElementById(errorEle);
		
		myError(errorEle, `${userMsg}<br>${helpDeskTicket}`);
	}
}