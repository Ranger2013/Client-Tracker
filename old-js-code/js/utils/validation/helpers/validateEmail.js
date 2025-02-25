import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
import { clearMsg } from "../../dom/domUtils.js";
import errorLogs from "../../error-messages/errorLogs.js";

export default async function validateEmail({ evt }) {
	try {
		// No email, clear message as email is optional
		if (!evt.target.value) {			
			clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
			return;
		}

		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		if (!evt.target.value.match(emailPattern)) return 'Please provide a valid email.';

		if(evt.target.value && await checkForDuplicateEmail(evt.target.value)) return 'Email is already in use.';

		clearMsg({container: `${evt.target.id}-error`, hide: true, input: evt.target});
		return;
	}
	catch (err) {
		await errorLogs('validateEmailError', 'Validate email error: ', err);
		throw err;
	}
}

async function checkForDuplicateEmail(email) {
	try {
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		const clientList = await indexed.getAllStorePromise(db, indexed.stores.CLIENTLIST);

		const duplicate = clientList?.some(client => client.email === email);		
		return duplicate;
	}
	catch (err) {
		await errorLogs('checkForDuplicateEmailError', 'Check for duplicate email error: ', err);
		throw err;
	}
}