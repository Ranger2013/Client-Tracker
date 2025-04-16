import { getValidationToken } from '../../../../../../tracker.js';
import { accountAPI, authAPI } from '../../../../../network/api/apiEndpoints.js';
import { fetchData } from '../../../../../network/services/network.js';
import { getValidElement } from '../../../../../utils/dom/elements';
import { removeListeners } from '../../../../../utils/dom/listeners';

// Set up debug mode
const COMPONENT = 'Invoices Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const COMPONENT_ID = 'build-invoices-page';

export default async function buildInvoicesPage({ tabContentContainer, manageUser }) {
	try {
		debugLog('Initializing Invoices Page...');
		// Pull invoices from the server
		const response = await fetchData({
			api: accountAPI.unpaidInvoices,
			token: getValidationToken(),
		});

		debugLog('Invoices Response: ', response);

		handleServerResponse({tabContentContainer, response});

		await initalizeUIPage({tabContentContainer, manageUser, componentId: COMPONENT_ID});

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
			displayTarget: 'form-msg',
		});
	}
}

function handleServerResponse({tabContentContainer, response}){
	if(response.status === 'success'){
		const tabContent = getValidElement(tabContentContainer);
		tabContent.innerHTML = '';
		tabContent.innerHTML = response.msg;
	}
	else if( response.status === 'error' || response.status === 'server-error'){
		throw new Error(response.msg);
	}
}

async function initalizeUIPage({tabContentContainer, manageUser, componentId}) {
	const { default: unpaidInvoices } = await import("../../../../../../features/user/ui/my-account/user-account/tabs/invoices/unpaidInvoicesJS.js");
	await unpaidInvoices({ tabContentContainer, manageUser, componentId });
}