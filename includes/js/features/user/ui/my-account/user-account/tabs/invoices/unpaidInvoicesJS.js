import { accountAPI } from '../../../../../../../core/network/api/apiEndpoints.js';
import { fetchData } from '../../../../../../../core/network/services/network.js';
import { closeModal } from '../../../../../../../core/services/modal/openModal.js';
import { getValidElement } from '../../../../../../../core/utils/dom/elements.js';
import { addListener, removeListeners } from '../../../../../../../core/utils/dom/listeners.js';
import { safeDisplayMessage } from '../../../../../../../core/utils/dom/messages.js';
import { getValidationToken } from '../../../../../../../tracker.js';

// Set up debug mode
const COMPONENT = 'Unpaid Invoices Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function unpaidInvoices({ tabContentContainer, manageUser, componentId }) {
	try {
		initializeEventHandlers({ manageUser, componentId });
	}
	catch (err) {
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}

function initializeEventHandlers({ manageUser, componentId }) {
	const dynamicEventHandlers = {
		'user-info': {
			events: ['click'],
			handler: async (evt) => {
				const { default: buildClientInvoiceManagementModal } = await import("../../../../../../../core/layout/user/pages/my-account/invoices/buildClientInvoiceManagementModalPage.js");
				await buildClientInvoiceManagementModal({ evt, manageUser, componentId });
			},
		},
	};

	const staticModalEventHandlers = {
		'click:paid-button': async (evt) => {
			await handlePaidButtonClick(evt);
		},
	};

	// Listener for the table list of clients
	addListener({
		elementOrId: 'invoice-table',
		eventType: 'click',
		handler: async (evt) => {
			try {
				const id = evt.target.id;

				for (const prefix in dynamicEventHandlers) {
					if (id.startsWith(prefix)) {
						const handler = dynamicEventHandlers[prefix];
						if (handler.events.includes(evt.type)) {
							handler.handler(evt);
						}
						return;
					}
				}
			}
			catch (err) {
				const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
				AppError.handleError(err, {
					errorCode: AppError.Types.RENDER_ERROR,
					userMessage: 'Unable to display the invoice management modal.',
				});
			}
		},
		componentId,
	});

	// Listener for the modal
	addListener({
		elementOrId: 'modal-content',
		eventType: ['click'],
		handler: async (evt) => {
			debugLog('Modal event triggered: ', evt.type, ' on ', evt.target.id);
			const keyPath = `${evt.type}:${evt.target.id}`;
			if (staticModalEventHandlers[keyPath]) {
				staticModalEventHandlers[keyPath](evt);
			}
		},
		componentId,
	});
}

async function handlePaidButtonClick(evt) {
	try {
		safeDisplayMessage({
			elementId: 'modal-msg',
			message: 'Processing...',
			isSuccess: true,
			color: 'w3-text-blue',
		});

		const dataSet = evt.target.dataset;
		const cID = dataSet.cid;
		const trimID = dataSet.trimid;

		const params = {
			key: 'invoice-paid',
			data: {
				cID,
				trimID,
			}
		}

		const response = await fetchData({
			api: accountAPI.markInvoicePaid,
			data: params,
			token: getValidationToken(),
		});

		debugLog('Response: ', response);

		if (response.status === 'success') {
			closeModal('unpaid-invoices-modal-listeners');
			const tableRow = getValidElement(`${cID}:${trimID}`);
			tableRow.remove();
			try {
				await updateUserTrimInfo({ cID, trimID });
			}
			catch (err) {
				const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
				AppError.handleError(err, {
					errorCode: AppError.Types.DATABASE_ERROR,
					userMessage: 'Server operation was successful, but local database update failed.',
					displayTarget: 'form-msg',
				});
			}
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.DATABASE_ERROR,
			userMessage: AppError.BaseMessages.system.database,
			displayTarget: 'modal-msg',
		});
	}
}

async function updateUserTrimInfo({ cID, trimID }) {
	const { default: ManageClient } = await import("../../../../../../client/models/ManageClient.js");
	const manageClient = new ManageClient({ debug: false });

	const trimmingInfo = await manageClient.getClientTrimmingInfo(cID);
	debugLog('Trimming Info: ', trimmingInfo);

	const trimIndex = trimmingInfo.findIndex(trim => trim.trimID === parseInt(trimID, 10));

	if (trimIndex === -1) {
		throw new Error(`Trim ID ${trimID} not found for client ${cID}`);
	}

	trimmingInfo[trimIndex].paid = 'yes';
	debugLog('Updated Trimming Info: ', trimmingInfo);

	await manageClient.updateClientTrimmingInfo({ cID, trimmingInfo });
	return true;
}