import { authAPI } from "../../core/network/api/apiEndpoints";
import { fetchData } from "../../core/network/services/network";

/**
 * Checks if a value already exists in the database
 * @param {Object} params - Check parameters
 * @param {string} params.value - Value to check (email/phone/username)
 * @param {string} params.type - Type of check ('email'|'phone'|'username')
 * @param {string} params.userType - Table to check ('users'|'clients')
 * @returns {Promise<Object>} Response with status and message
 */
export async function checkForDuplicate({ value, type, userType }) {
    try {
        return await fetchData({
            api: authAPI.checkDuplicate,
            data: {
                value,
                column: type,
                userType
            }
        });
    } catch (err) {
        return {
            status: 'error',
            msg: 'Unable to verify unique value'
        };
    }
}

// export async function checkForDuplicate(evt, errorEle, type, userType) {
// 	try {
// 		// Set up the server params
// 		const serverParams = {
// 			value: evt.target.value, // The email, phone or username value
// 			column: type, // The column that is used on the db, email, phone or username
// 			userType: userType, // Are we looking at the users table or the clients table
// 		};

// 		// Send request to the server
// 		const data = await fetchData({ api: checkForDuplicatesAPI, data: serverParams });

// 		// Get server returned status
// 		if (data.status === 'ok') {
// 			// Clear any previous error messages
// 			clearMsg({ container: errorEle, hide: true, input: evt.target });
// 			// Enable the submit button
// 			disableEnableSubmitButton(submitButton);
// 		}
// 		// There was a duplicate, show error message
// 		else if (data.status === 'duplicate') {
// 			myError(errorEle, data.msg, evt.target);
// 			// Disable the submit button
// 			disableEnableSubmitButton(submitButton);
// 		}
// 		else if (data.status === 'unexpected-error' || data.status === 'server-error') {
// 			myError(fm, data.msg);
// 			// Disable the submit button
// 			disableEnableSubmitButton(submitButton);
// 		}
// 	}
// 	catch (err) {
// 		console.warn(err);
// 	}
// }
