import { authAPI } from "../../core/network/api/apiEndpoints.js";
import { fetchData } from "../../core/network/services/network.js";
import { getValidationToken } from '../../tracker.js';

/**
 * Checks if a value already exists in the database
 * @param {Object} params - Check parameters
 * @param {string} params.value - Value to check (email/phone/username)
 * @param {string} params.column - Type of check ('email'|'phone'|'username')
 * @param {string} params.table - Table to check ('users'|'clients')
 * @returns {Promise<Object>} Response with status and message
 */
export async function checkForDuplicate({ value, column, table, shouldValidate = false }) {
    try {
        return await fetchData({
            api: authAPI.checkDuplicate,
            data: {
                value,
                column,
                table,
                shouldValidate,
            },
            token: shouldValidate ? getValidationToken() : null,
        });
    } catch (err) {
        return {
            status: 'error',
            msg: 'Unable to verify unique value'
        };
    }
}