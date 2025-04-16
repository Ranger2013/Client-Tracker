import { clearMsg } from '../../core/utils/dom/messages.js';
import { checkForDuplicate } from '../services/duplicateCheck.js';

// Setup Debug Mode
const COMPONENT = 'Email Validation';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function validateEmail({ evt, value, column, table, shouldValidate = false, }) {
	try {
		// No email, clear message as email is optional
		if (!evt.target.value.trim()) {
			clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
			return;
		}

		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		if (!value.trim().match(emailPattern)) return { status: 'validation-error', msg: 'Invalid email format' };

		return await checkForDuplicate({
			value,
			column,
			table,
			shouldValidate,
		});
	}
	catch (err) {
		throw err;
	}
}