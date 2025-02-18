import { hyphenToSpaces, ucwords } from "../string/stringUtils.js";

/**
 * Validates a client form field
 * @param {Object} params - Validation parameters
 * @param {Event} params.evt - The event object
 * @param {string|null} params.cID - Client ID
 * @param {string|null} params.primaryKey - Database primary key
 * @returns {Promise<string|boolean>} Error message or false if valid
 * @throws {Error} If validation fails
 */
export default async function checkClientFormValidity({evt, cID, primaryKey}){
	try{
		if(evt.target.id === 'client-form') return true;
		
		const fnName = `validate${ucwords(hyphenToSpaces(evt.target.id)).replace(' ', '')}`;
		const module = await import(`./helpers/${fnName}.js`);
		
		const validate = module.default;

		if(typeof validate === 'function'){
			return validate({evt, cID, primaryKey});
		}
		else {
			throw new Error('Invalid function name.');
		}		
	}
	catch(err){
		const { default: errorLogs } = await import("../error-messages/errorLogs.js");
		await errorLogs('checkClientFormValidityError', 'Check client form validity error: ', err);
		throw err;
	}
}