import { authAPI } from '../../../../../../../../core/network/api/apiEndpoints.js';
import { fetchData } from '../../../../../../../../core/network/services/network.js';
import { getValidationToken } from '../../../../../../../../tracker.js';

// Setup debug mode
const COMPONENT = 'Handle Reset Password';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function handleResetPassword({ evt, manageUser }) {
	try{
		const response = await fetchData({
			api: authAPI.resetPass,
			data: { key: 'reset-password' },
			token: getValidationToken(),
		});

		debugLog('Response from reset password API:', response);

		if(response.status === 'pass-reset'){
			const { getValidElement } = await import('../../../../../../../../core/utils/dom/elements.js');
			const passwordInputContainer = getValidElement('password-input-container');

			const msg = `
			<div class="w3-panel w3-pale-blue w3-leftbar w3-border-blue">
				<p>${response.msg}</p>
			</div>
			`;

			passwordInputContainer.innerHTML = msg;
		}
	}
	catch(err){
		const { AppError } = await import("../../../../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.PROCESSING_ERROR
		}, true);
	}
}