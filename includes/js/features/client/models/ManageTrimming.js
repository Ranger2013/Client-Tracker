// import { fetchData } from "../utils/network/network.js";
// import noAuthorizationPage from "../utils/security/noAuthorizationPage.js";
// import IndexedDBOperations from "./IndexedDBOperations.js";
// import ManageClient from "./ManageClient.js";

import IndexedDBOperations from '../../../core/database/IndexedDBOperations.js';
import ManageClient from './ManageClient.js';

/**
 * Manages trimming session operations and related data using IndexedDB
 * @class
 */
export default class ManageTrimming {
	// Static private property to hold the singleton instance
	static #instance = null;

	/**
	 * @typedef {Object} TrimmingOptions
	 * @property {boolean} [debug=false] - Enable debug logging
	 */

	// Instance private properties
	#indexed;
	#manageClient;
	#debug = false;

	/**
	 * Creates or returns existing ManageTrimming instance
	 * @param {TrimmingOptions} [options={ debug: false }] - Configuration options
	 * @returns {ManageTrimming} Singleton instance
	 */
	constructor(options = { debug: true }) {
		// If an instance already exists, return it
		if (ManageTrimming.#instance) {
			if (options.debug !== undefined) {
				ManageTrimming.#instance.setDebugMode(options.debug);
			}
			return ManageTrimming.#instance;
		}

		this.#indexed = new IndexedDBOperations();
		this.#manageClient = new ManageClient();
		this.#debug = options.debug || false;

		// Store this instance as the singleton
		ManageTrimming.#instance = this;
		this.#log('ManageTrimming singleton instance created');
		return this;
	}

	/**
	 * Enable or disable debug logging
	 * @param {boolean} enabled - Whether to enable debug logging
	 */
	setDebugMode(enabled) {
		this.#debug = !!enabled;
	}

	/**
	 * Debug log helper
	 * @private
	 * @param {...*} args - Arguments to log
	 */
	#log(...args) {
		if (this.#debug) {
			console.log('[ManageTrimming]', ...args);
		}
	}

	/**
	 * Handles adding a new trimming session
	 * @param {Object} userData - Form data from trimming session
	 * @param {Object} clientInfo - Client information
	 * @param {number} clientInfo.cID - Client ID
	 * @returns {Promise<Object>} Status and message of operation
	 * @throws {AppError} If operation fails
	 */
	async handleAddTrimmingSession({ cID, userData }) {
		try {
			if (!userData || !cID) {
				throw new Error('Missing required data for trimming session');
			}

			// Convert cID to a number if it is a string
			if (typeof cID === 'string') cID = parseInt(cID, 10);

			// Get the previous trim sessions and next trimming id concurrently
			const [prevTrims, nextTrimID] = await Promise.all([
				this.#manageClient.getClientTrimmingInfo(cID),
				this.#indexed.getLastKeyForID({ store: this.#indexed.stores.MAXTRIMID }),
			]);

			this.#log('Previous trims:', prevTrims);
			this.#log('Next trim ID:', nextTrimID);

			// Prepare data structures
			const backupData = this.setTrimmingDataStructureForBackupData({ cID, userData, trimID: nextTrimID });
			this.#log('Backup Data Structure: ', backupData);
			const trimmingStoreData = await this.setTrimmingStoreData({ cID, prevTrims });
			this.#log('Trimming Store Data: ', trimmingStoreData);

			// Extract horse data
			backupData.horses = await this.extractHorseData(userData);
			this.#log('Extracted Horse Data: ', backupData.horses);

			// Add trim session and handle receipt
			const [addTrimResult, receiptResult] = await Promise.all([
				this.addTrimSession(backupData, trimmingStoreData),
				 this.handleSendingReceipt(userData, backupData)
			]);

			if (addTrimResult.status === 'error') {
				throw new Error(addTrimResult.msg);
			}

			// Add full userData for server invoicing
			backupData.userData = userData;

			// Update client schedule
			// await this.#manageClient.updateClientSchedule(userData);

			return { ...addTrimResult, ...receiptResult };
		}
		catch (err) {
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			await AppError.process(err, {
				errorCode: AppError.Types.PROCESSING_ERROR,
				userMessage: 'Failed to add trimming session',
			}, true);
		}
	}

	/**
	 * Creates data structure for backup storage
	 * @param {Object} userData - User input data
	 * @param {Object} clientInfo - Client information
	 * @param {number} nextTrimID - Next available trimming ID
	 * @returns {Object} Formatted backup data structure
	 * @private
	 */
	setTrimmingDataStructureForBackupData({ cID, userData, trimID }) {
		return {
			add_trimming: true,
			trimID,
			cID,
			mileage_cost: userData?.mileage_cost || '0',
			receipt: userData?.receipt || 'no',
			session_notes: userData.session_notes,
			payment_amount: userData.payment !== '' ? userData.payment : '0',
			date_trimmed: userData.trim_date,
			paid: userData?.paid || 'no',
			invoice_sent: 'no',
		};
	}

	/**
	 * Sets up trimming store data structure
	 * @param {number} cID - Client ID
	 * @param {Array} prevTrims - Previous trimming sessions
	 * @returns {Promise<Object>} Trimming store data structure
	 * @private
	 */
	async setTrimmingStoreData({ cID, prevTrims }) {
		return {
			cID,
			trimmings: prevTrims,
		}
	}

	/**
	 * Handles sending receipt for trimming session
	 * @param {Object} userData - User form data
	 * @param {Object} backuptrimmingDataStructure - Backup data structure
	 * @returns {Promise<Object>} Receipt status and message
	 * @throws {AppError} If receipt sending fails
	 * @private
	 */
	async handleSendingReceipt(userData, backuptrimmingDataStructure) {
		try {
			if (userData?.receipt === undefined) return { receipt_status: 'no-receipt', receipt_msg: '' }; // There was no receipt to send

			// Import our files
			const [{ getValidationToken }, { dataAPI }, {fetchData}] = await Promise.all([
				import("../../../tracker.js"),
				import("../../../core/network/api/apiEndpoints.js"),
			]);

			// Import Fetch Data after validation and data api.
			const { fetchData } = await import("../../../core/network/services/network.js");
			
			// Set up validation token and send the receipt
			const validationToken = getValidationToken();
			const request = await fetchData({ api: dataAPI.receipt, data: userData, token: validationToken });

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

	/**
	 * Extracts horse data from form data
	 * @param {Object} param0 - Destructured form data
	 * @param {number} param0.number_horses - Number of horses
	 * @param {Object} param0.userData - Remaining form data
	 * @returns {Promise<Array<Object>>} Formatted horse data
	 * @private
	 */
	async extractHorseData({ number_horses, ...userData }) {
		try {
			// 1. Object.entries creates array of [key, value] pairs:
			// [
			//   ['horse_list_1', '1:Ranger'],
			//   ['horse_list_2', '2:Simon'],
			//   ['service_cost_1', 'trim:45'],
			//   ['accessories_1', ['pads:EasyCare Pads:15']],
			//   // etc...
			// ]

			return Object.entries(userData)
				.reduce((horses, [key, value]) => {
					// 2. matchHorse will capture the number from horse_list_X
					// For 'horse_list_1' it returns: ['horse_list_1', '1']
					// For 'service_cost_1' it returns: null
					const matchHorse = key.match(/^horse_list_(\d+)$/);
					if (!matchHorse) return horses;

					// 3. Get the number from the match: '1', '2', etc
					const index = matchHorse[1];

					// 4. Split horse data: '1:Ranger' becomes [1, 'Ranger']
					const [hID, horse_name] = value.split(':');

					// 5. Look for existing horse with this index
					// horses array looks like:
					// [
					//   { index: '1', hID: 1, horse_name: 'Ranger', ... },
					//   { index: '2', hID: 2, horse_name: 'Simon', ... }
					// ]
					const existingHorse = horses.find(h => h.index === index) || {
						index,  // Store index for sorting
						hID: Number(hID),
						horse_name,
						type_trim: userData[`service_cost_${index}`],
						acc: userData[`accessories_${index}`] || []
					};

					// 6. Return new array with all horses except current index
					// then add the current horse (either existing or new)
					return [...horses.filter(h => h.index !== index), existingHorse];
				}, [])
				// 7. Sort by numeric index: '1', '2', '3'...
				.sort((a, b) => Number(a.index) - Number(b.index))
				// 8. Remove the temporary index property
				.map(({ index, ...horse }) => horse);
		}
		catch (err) {
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			await AppError.process(err, {
				errorCode: AppError.Types.PROCESSING_ERROR,
				userMessage: 'Failed to process horse data',
				context: { component: 'ManageTrimming', action: 'extractHorseData' }
			}, true);
			return [];
		}
	}

	/**
	 * Adds trimming session to database
	 * @param {Object} backuptrimmingDataStructure - Data for backup
	 * @param {Object} trimmingStoreData - Data for trimming store
	 * @returns {Promise<Object>} Operation status and message
	 * @throws {AppError} If database operations fail
	 * @private
	 */
	async addTrimSession(backuptrimmingDataStructure, trimmingStoreData) {
		try {
			// Make a shallow copy of the backup trimming data structure
			const backupData = { ...backuptrimmingDataStructure };
			this.#log('Add Trim Session: Backup Trimming Data Structure: ', backuptrimmingDataStructure);
			this.#log('Add Trim Session: backupData: ', backupData);
			this.#log('Add Trim Session: trimmingStoreData: ', trimmingStoreData);
			const db = await this.#indexed.openDBPromise();

			// Start the transaction
			const tx = db.transaction([
				this.#indexed.stores.MAXTRIMID,
				this.#indexed.stores.ADDTRIMMING,
				this.#indexed.stores.TRIMMING
			], 'readwrite');

			// Add the backup trimming data and the max trim id into their appropriate stores
			// const backupTrimming = this.#indexed.putStorePromise(db, backuptrimmingDataStructure, this.#indexed.stores.ADDTRIMMING, false, tx);
			// const putTrimID = this.#indexed.putStorePromise(db, { trimID: backuptrimmingDataStructure.trimID }, this.#indexed.stores.MAXTRIMID, true, tx);

			// Remove the cID, add_trimming boolean and the userData from the backup data structure
			const cID = backuptrimmingDataStructure.cID;
			delete backupData.cID;
			delete backupData.add_trimming;
			delete backupData.userData;

			// push the backup trimming data onto the trimming store data trimmings array
			trimmingStoreData.trimmings.push(backupData);

			this.#log('Add Trim Session: trimmingStoreData after backupData push: ', trimmingStoreData);

			// Now add the trimming data to the trimming store
			// const addTrimming = this.#indexed.putStorePromise(db, trimmingStoreData, this.#indexed.stores.TRIMMING, false, tx);

			// Wait for all the promises to resolve
			// await Promise.all([backupTrimming, putTrimID, addTrimming]);

			// Lets clean up the trimmings
			// await this.cleanupTrimmings(cID);

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

	/**
	 * Cleans up old trimming sessions
	 * Maintains maximum of 9 sessions per client locally
	 * @param {number} cID - Client ID
	 * @returns {Promise<void>}
	 * @private
	 */
	async cleanupTrimmings(cID) {
		try {
			// Get the client trimmings. We are ensureing we do not have more than 9 trim sessions stored locally.
			const getTrimmingInfo = await this.#manageClient.getClientTrimmingInfo(Number(cID));

			if (getTrimmingInfo && getTrimmingInfo.length > 9) {
				getTrimmingInfo.shift();

				const trimmingInfo = await this.setTrimmingStoreData({ cID, prevTrims: getTrimmingInfo });

				// Open the IDB db
				const db = await this.#indexed.openDBPromise();

				// Put the data back into the store.
				this.#indexed.putStorePromise(db, trimmingInfo, this.#indexed.stores.TRIMMING);
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
