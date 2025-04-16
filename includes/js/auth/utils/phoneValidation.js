import { formatPhone } from '../../core/utils/dom/forms/validation.js';
import { checkForDuplicate } from '../services/duplicateCheck.js';

const COMPONENT = 'Validate Phone';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function validatePhone({ evt, value, column, table, shouldValidate = false }) {
	try {
		// No phone, show message
		if (!value.trim()) return { status: 'validation-error', msg: 'Phone number is required.' };

		const formattedPhone = formatPhone(value);

		// Wrong format, show message
		if (!formattedPhone) return { status: 'validation-error', msg: 'Please use the correct format.' };

		evt.target.value = formattedPhone;

		// duplicate phone, show message
		return await checkForDuplicate({
			value: formattedPhone,
			column,
			table,
			shouldValidate,
		});
	}
	catch (err) {
		throw err;
	}
}
