import { fetchData } from "../utils/network/network.js";
import noAuthorizationPage from "../utils/security/noAuthorizationPage.js";
import IndexedDBOperations from "./IndexedDBOperations.js";
import ManageClient from "./ManageClient.js";

export default class ManageTrimming {
	constructor() {
		this.indexed = new IndexedDBOperations();
		this.manageClient = new ManageClient();
	}

	async handleAddTrimmingSession(userData, clientInfo) {
		try {
			// Get the previous trim sessions, next trimming id and handle sending the receipt
			const [prevTrims, nextTrimID] = await Promise.all([
				this.manageClient.getClientTrimmingInfo(clientInfo.cID),
				this.indexed.getLastKeyForID(this.indexed.stores.MAXTRIMID),
			]);
			
			// Set our data structures for the backup data store and the trimmings store
			const backuptrimmingDataStructure = this.setTrimmingDataStructureForBackupData(userData, clientInfo, nextTrimID);
			const trimmingStoreData = await this.setTrimmingStoreData(clientInfo.cID, prevTrims);
			
			// Extract the horse data and insert it into the backup data structure
			backuptrimmingDataStructure.horses = await this.extractHorseData(userData);
			const addTrimSession = await this.addTrimSession(backuptrimmingDataStructure, trimmingStoreData);
			
			// If we had an error, exit early
			if(addTrimSession.status === 'error') {
				throw new Error(addTrimSession.msg);
			}

			// Handle sending the receipt
			const receiptMsg = await this.handleSendingReceipt(userData, backuptrimmingDataStructure);

			// To handle invoices on the server, we need to add the entire userData property to the backup data structure
			backuptrimmingDataStructure.userData = userData;


			// Update the client's schedule
			const updateSchedule = await this.manageClient.updateClientSchedule(userData);
			
			return { ...addTrimSession, ...receiptMsg };
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");
			await handleError(
				'addTrimSessionError',
				'Add trimming session error: ',
				err,
			)
			throw err;
		}
	}

	setTrimmingDataStructureForBackupData(userData, clientInfo, nextTrimID) {
		return {
			add_trimming: true,
			trimID: nextTrimID,
			cID: clientInfo.cID,
			mileage_cost: userData?.mileage_cost || '0',
			receipt: userData?.receipt || 'no',
			session_notes: userData.session_notes,
			payment_amount: userData.payment,
			date_trimmed: userData.trim_date,
			paid: userData?.paid || 'no',
			invoice_sent: 'no',
		};
	}

	async setTrimmingStoreData(cID, prevTrims) {
		return {
			cID,
			trimmings: prevTrims,
		}
	}

	async handleSendingReceipt(userData, backuptrimmingDataStructure) {
		try {
			if (userData.receipt === undefined) return { receipt_status: 'no-receipt', receipt_msg: '' }; // There was no receipt to send

			// Import our files
			const [{ getValidationToken }, { sendReceiptAPI }] = await Promise.all([
				import("../tracker.js"),
				import("../utils/network/apiEndpoints.js"),
			]);

			// Set up validation token and send the receipt
			const validationToken = getValidationToken();
			const request = await fetchData({ api: sendReceiptAPI, data: userData, token: validationToken });

			if (serverResponse.status === 'auth-error') {
				await noAuthorizationPage();
				return;
			}

			if (request.status === 'ok') {
				backuptrimmingDataStructure.receipt_sent = 'yes';
				return { receipt_status: 'receipt-sent', receipt_msg: '<div>Receipt sent.</div>' };
			}

			if (request.status === 'error') {
				// Add the appointment time to the backup data structure so we can resend the receipt when the user backs up their data
				backuptrimmingDataStructure.app_time = userData.app_time;
				backuptrimmingDataStructure.receipt_sent = 'no';
				const { helpDeskTicket } = await import("../utils/error-messages/errorMessages.js");
				return { receipt_status: 'no-receipt-sent', receipt_msg: `<div class="w3-text-red">Server Error: Problem on the server prevented the receipt from being sent.</div><div class="w3-text-red">The receipt should auto-send when you back up your data. If it does not, then ${helpDeskTicket}</div>` };
			}

			// An unknown error occurred if we reach here.
			backuptrimmingDataStructure.app_time = userData.app_time;
			backuptrimmingDataStructure.receipt_sent = 'no';
			return { receipt_status: 'unknown-error', receipt_msg: '<div class="w3-text-red">Unknown error.</div><div class="w3-text-red">The system will try again when you backup your data.</div>' };
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");
			await handleError(
				'handleSendingReceiptError',
				'Handle sending receipt error: ',
				err,
			);

			// Add the no receipt sent property
			backuptrimmingDataStructure.receipt_sent = 'no';
			return { receipt_status: 'no-receipt-sent', receipt_msg: '<div class="w3-text-red">Receipt not sent due to being offline.</div><div class="w3-text-red">The system will retry when you back up your data.</div>' };
		}
	}

	async extractHorseData({ number_horses, ...userData }) {
		try {
			// Array to hold the horse information
			const horses = [];

			// Loop through the number of horses and extract the horse information
			for (let i = 1; i <= number_horses; i++) {
				const [hID, horse_name] = userData[`horse_list_${i}`].split(':');
				const accessories = userData[`accessories_${i}`] || [];
				const type_trim = userData[`service_cost_${i}`];

				horses.push({
					hID: Number(hID),
					horse_name,
					type_trim,
					acc: accessories,
				});
			}
			return horses;
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");
			await handleError(
				'extractHorseDataError',
				'Extract horse data error: ',
				err,
			);
			return [];
		}
	}

	async addTrimSession(backuptrimmingDataStructure, trimmingStoreData) {
		try {
			// Make a shallow copy of the backup trimming data structure
			const backupData = { ...backuptrimmingDataStructure };

			const db = await this.indexed.openDBPromise();

			// Start the transaction
			const tx = db.transaction([this.indexed.stores.MAXTRIMID, this.indexed.stores.ADDTRIMMING, this.indexed.stores.TRIMMING], 'readwrite');

			// Add the backup trimming data and the max trim id into their appropriate stores
			const backupTrimming = this.indexed.putStorePromise(db, backuptrimmingDataStructure, this.indexed.stores.ADDTRIMMING, false, tx);
			const putTrimID = this.indexed.putStorePromise(db, { trimID: backuptrimmingDataStructure.trimID }, this.indexed.stores.MAXTRIMID, true, tx);

			// Remove the cID, add_trimming boolean and the userData from the backup data structure
			const cID = backuptrimmingDataStructure.cID;
			delete backupData.cID;
			delete backupData.add_trimming;
			delete backupData.userData;
			
			// push the backup trimming data onto the trimming store data trimmings array
			trimmingStoreData.trimmings.push(backupData);

			// Now add the trimming data to the trimming store
			const addTrimming = this.indexed.putStorePromise(db, trimmingStoreData, this.indexed.stores.TRIMMING, false, tx);

			// Wait for all the promises to resolve
			await Promise.all([backupTrimming, putTrimID, addTrimming]);

			// Lets clean up the trimmings
			await this.cleanupTrimmings(cID);
			
			// Return a properly formatted success response
			return { 
				status: 'success', 
				msg: 'Trimming/Shoeing has been added successfully.' 
			};
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");
			const { helpDeskTicket } = await import("../utils/error-messages/errorMessages.js");
			await handleError(
				'addTrimSessionError',
				'Add trimming session error: ',
				err,
			);
			return { 
				status: 'error', 
				msg: `Unable to add trimming session at this time.<br>${helpDeskTicket}` 
			};
		}
	}

	async cleanupTrimmings(cID) {
		try {
			// Get the client trimmings. We are ensureing we do not have more than 9 trim sessions stored locally.
			const getTrimmingInfo = await this.manageClient.getClientTrimmingInfo(Number(cID));

			if (getTrimmingInfo && getTrimmingInfo.length > 9) {
				getTrimmingInfo.shift();

				const trimmingInfo = await this.setTrimmingStoreData(cID, getTrimmingInfo);

				// Open the IDB db
				const db = await this.indexed.openDBPromise();
				
				// Put the data back into the store.
				this.indexed.putStorePromise(db, trimmingInfo, this.indexed.stores.TRIMMING);
			}
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");
			await handleError(
				'cleanupTrimmingsError',
				'Cleanup trimmings error: ',
				err,
			);
		}
	}
}
