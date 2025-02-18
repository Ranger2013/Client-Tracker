import { ucwords } from "../string/stringUtils.js";
import { isNumeric, validateDate } from "./validationUtils.js";

export default async function validateAddExpensesForm(userData) {
	try {
		const errors = {};
		let isValid = true;

		// Check for empty fields
		for (const [key, value] of Object.entries(userData)) {
			if (value.trim() === '' || value.trim() === 'null') {
				errors[`${key}-error`] = `${ucwords(key)} is required.`
				isValid = false;
			}
		}

		// Check for valid date
		if (!validateDate(userData.date)) {
			errors['date-error'] = 'Please enter a valid date.';
			isValid = false;
		}

		// Check for valid number
		if (!isNumeric(userData.price)) {
			errors['price-error'] = 'Please enter a valid price.';
			isValid = false;
		}

		if(validateCat(userData.category) === null){
			errors['category-error'] = 'Please select a valid category.';
			isValid = false;
		}

		return { isValid, errors };
	} catch (err) {
		const { handleError } = await import("../../../error-messages/handleError.js");
		await handleError('validateAddExpensesFormError', 'Error validating add expenses form: ', err);
		throw err;
	}
}

function validateCat(value) {
	switch (Number(value)) {
		case 1: return 'Tools/Supplies';
		case 2: return 'Attire';
		case 3: return 'Schools/Clinics';
		case 4: return 'Advertising';
		case 5: return 'Food';
		case 6: return 'Misc';
		default: return null;
	}
}