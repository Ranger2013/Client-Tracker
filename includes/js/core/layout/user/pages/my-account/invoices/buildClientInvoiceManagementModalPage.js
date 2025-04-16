import ManageClient from '../../../../../../features/client/models/ManageClient.js';
import IndexedDBOperations from '../../../../../database/IndexedDBOperations.js';
import openModal from '../../../../../services/modal/openModal.js';
import { buildElementTree } from '../../../../../utils/dom/elements.js';

// Set up debug mode
const COMPONENT = 'Client Invoice Management Modal Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Special event handler for the modal
const MODAL_LISTENER_ID = 'unpaid-invoices-modal-listeners';

export default async function buildClientInvoiceManagementModal({ evt, manageUser, componentId }) {
	try {
		const dataSet = evt.target.dataset;
		const cID = dataSet.clientid;
		const trimID = dataSet.trimid;
		const invoiceID = dataSet.invoiceid !== '' ? dataSet.invoiceid : null;
		const clientName = await getClientsName(cID);

		const modalContent = buildModalContent({ cID, trimID, invoiceID, clientName });

		openModal({
			content: modalContent,
			// title: `Client ${clientName}`,
			componentId: MODAL_LISTENER_ID,
		})
	}
	catch (err) {
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'Unable to display the invoice management modal.',
			displayTarget: 'form-msg',
		}, true);
	}
}

function buildModalContent({ cID, trimID, invoiceID, clientName }) {
	// Optional section if we sent an invoice to be paid by credit card
	const shouldShowInvoiceButton = () => {
		if (!invoiceID) return {};

		return {
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-center'],
			children: {
				invoiceButton: {
					type: 'button',
					myClass: ['w3-small', 'w3-button', 'w3-blue', 'w3-round-large', 'w3-margin-left'],
					attributes: {
						id: 'resend-invoice',
						'data-cid': cID,
						'data-trimid': trimID,
						'data-invoiceid': invoiceID,
					},
					text: 'Resend Invoice',
				},
			},
		};
	};

	const MODAL_MAPPING = {
		type: 'div',
		myClass: ['w3-card'],
		children: {
			titleSection: {
				type: 'div',
				myClass: ['w3-center'],
				children: {
					title: {
						type: 'h5',
						text: `Client ${clientName}`,
					},
					modalMsg: {
						type: 'div',
						attributes: { id: 'modal-msg' },
					},
				},
			},
			row: {
				type: 'div',
				myClass: ['w3-row', 'w3-padding-small'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 's6', 'w3-padding-small'],
						text: `${clientName}'s Invoice: `,
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 's6', 'w3-padding-small'],
						children: {
							row: {
								type: 'div',
								myClass: ['w3-row'],
								children: {
									subColOne: {
										type: 'div',
										myClass: ['w3-col', 'm6', 'w3-center'],
										children: {
											paidButton: {
												type: 'button',
												myClass: ['w3-small', 'w3-button', 'w3-black', 'w3-round-large'],
												attributes: {
													id: 'paid-button',
													'data-cid': cID,
													'data-trimid': trimID,
												},
												text: 'Paid',
											},
										},
									},
									subColTwo: shouldShowInvoiceButton(),
								},
							},
						},
					},
				},
			},
		},
	};

	const modalContent = buildElementTree(MODAL_MAPPING);
	return modalContent;
}

async function getClientsName(cID) {
	const indexed = new IndexedDBOperations({ debug: false });

	const db = await indexed.openDBPromise();

	const clientInfo = await indexed.getAllStoreByIndexPromise(db, indexed.stores.CLIENTLIST, 'cID', cID);

	if (clientInfo.length > 0) return clientInfo[0].client_name;
	return null;
}