import IndexedDBOperations from "../../../classes/IndexedDBOperations.js";
import { clearMsg } from "../../dom/domUtils.js";
import errorLogs from "../../error-messages/errorLogs.js";

export default async function validatePhone({ evt }) {
	try {
		// No phone, show message
		if (!evt.target.value) return 'Phone number is required.';

		const formattedPhone = formatPhone(evt.target.value);

		// Wrong format, show message
		if (!formattedPhone) return 'Please use the correct format.';

		evt.target.value = formattedPhone;

		// duplicate phone, show message
		if (formattedPhone && await checkForDuplicateNumbers(evt.target.value)) return 'Phone number is not available.'

		// Clear any messages, everything passed.
		clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
		return;
	}
	catch (err) {
		await errorLogs('validatePhoneError', 'Validate phone error: ', err);
		throw err;
	}
}

/**
 * Helper function to validatePhone. It takes the phone number and formats it: xxx-xxx-xxxx
 * @param {string} phone The phone number to format
 * @returns {boolean} True on success, false on failure as well as formatting the phone input value or posting error messages
 */
function formatPhone(phone) {
	// Remove all non-digit chars
	let cleaned = ('' + phone).replace(/\D/g, '');

	// Split the phone number up into it's corresponding parts. American numbers
	let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

	if (match) {
		return `${match[1]}-${match[2]}-${match[3]}`;
	}

	// No matches
	return null;
}

async function checkForDuplicateNumbers(phone) {
	try {
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		const clientList = await indexed.getAllStorePromise(db, indexed.stores.CLIENTLIST);

		const duplicate = clientList.some(client => client.phone === phone);
		return duplicate;
	}
	catch (err) {
		await errorLogs('validatePhoneError', 'Validate phone error: ', err);
		throw err;
	}
}