import { ucwords } from "../string/stringUtils.js";

export default function validateAddPersonalNotesForm(userData){
	try{
		let isValid = true;
		const errors = {};

		// Check for empty values
		for (const [key, value] of Object.entries(userData)) {
			if (value.trim() === '' || value.trim() === 'null') {
				errors[`${key}-error`] = `${ucwords(key)} is required.`
				isValid = false;
			}
		}

		return { isValid, errors };
	}
	catch(err){
		throw err;
	}
}