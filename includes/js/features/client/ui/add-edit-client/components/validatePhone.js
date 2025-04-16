import { formatPhone } from '../../../../../core/utils/dom/forms/validation.js';
import { clearMsg } from '../../../../../core/utils/dom/messages.js';

const COMPONENT = 'Validate Phone';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function validatePhone({ evt, cID, primaryKey, manageClient }) {
	try {
		// No phone, show message
		if (!evt.target.value) return 'Phone number is required.';

		const formattedPhone = formatPhone(evt.target.value);

		// Wrong format, show message
		if (!formattedPhone) return 'Please use the correct format.';

		evt.target.value = formattedPhone;

		// duplicate phone, show message
		if (formattedPhone && await checkForDuplicateNumbers({phone: evt.target.value, cID, primaryKey, manageClient})) return 'Phone number is not available.'

		// Clear any messages, everything passed.
		clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
		return;
	}
	catch (err) {
		throw err;
	}
}

async function checkForDuplicateNumbers({phone, cID, primaryKey, manageClient}) {
	try {
		const clientList = await manageClient.getClientScheduleList();
		const duplicate = clientList.some(client => {
			if(client.cID === parseInt(cID, 10)) return false;
			return client.phone === phone;
		});
		return duplicate;
	}
	catch (err) {
		throw err;
	}
}