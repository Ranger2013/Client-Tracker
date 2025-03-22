import { clearMsg } from '../../../../../core/utils/dom/messages.min.js';

export default async function validateEmail({ evt, cID, primaryKey, manageClient }) {
	try {
		// No email, clear message as email is optional
		if (!evt.target.value) {
			clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
			return;
		}

		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		if (!evt.target.value.match(emailPattern)) return 'Please provide a valid email.';

		if (evt.target.value && await checkForDuplicateEmail({ email: evt.target.value, cID, primaryKey, manageClient })) return 'Email is already in use.';

		clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
		return;
	}
	catch (err) {
		throw err;
	}
}

async function checkForDuplicateEmail({ email, cID, primaryKey, manageClient }) {
	try {
		const clientList = await manageClient.getClientScheduleList();
		const duplicate = clientList?.some(client => {
			if (client.cID === parseInt(cID, 10)) return false;
			return client.email === email
		});
		return duplicate;
	}
	catch (err) {
		throw err;
	}
}