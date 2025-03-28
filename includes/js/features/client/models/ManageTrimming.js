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
	constructor(options = { debug: false }) {
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
	async handleAddTrimmingSession({ cID, primaryKey, userData }) {
		try {
			if (!userData || !cID || !primaryKey) {
				throw new Error('Missing required data for trimming session');
			}

			// Convert cID to a number if it is a string
			cID = typeof cID === 'string' ? parseInt(cID, 10) : cID;
			primaryKey = typeof primaryKey === 'string' ? parseInt(primaryKey, 10) : primaryKey;

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

			// Extract and add horse data
			backupData.horses = await this.extractHorseData(userData);
			this.#log('Horse Data: ', backupData.horses);

			// Check if we are going to send a receipt
			let receiptMsg = '';
			if (userData?.receipt === 'yes') {
				this.#log('Sending receipt for trimming session');
				const receiptStatus = await this.handleSendingReceipt(backupData);
				this.#log('Receipt Status: ', receiptStatus);

				if (receiptStatus.status === 'ok') {
					backupData.receipt_sent = 'yes';
					receiptMsg = '<div>Receipt sent successfully.</div>';
				}
				else {
					backupData.receipt_sent = 'no';
					receiptMsg = `<div class="w3-text-red">${receiptStatus.msg}</div>`;
				}
			}

			this.#log('Backup Data Structure after receipt: ', backupData);
			// First try to add the trim session
			await this.addTrimSession(backupData, trimmingStoreData);
			this.#log('AFTER ADD TRIMMING DATA.');

			// Need to update the user's next appointment
			await this.#manageClient.updateClientSchedule({cID, primaryKey, userData});

			return { status: 'ok', message: `Trimming/Shoeing session added successfully.${receiptMsg}` };
		}
		catch (err) {
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
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
			session_notes: userData?.session_notes || '',
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
	async handleSendingReceipt(userData) {
		try {
			this.#log('Getting imports all at once.');
			const [{ getValidationToken }, { dataAPI }, { fetchData }] = await Promise.all([
				import("../../../tracker.js"),
				import("../../../core/network/api/apiEndpoints.js"),
				import("../../../core/network/services/network.js"),
			]);

			this.#log('Imports: ', getValidationToken, dataAPI, fetchData);

			// Get the authorization token

			const validationToken = getValidationToken();
			this.#log('Validation Token: ', validationToken);
			this.#log('Before we send the receipt.');
			// Make the reqeust to the server api
			const response = await fetchData({
				api: dataAPI.receipt,
				data: userData,
				token: validationToken
			});

			this.#log('Receipt Response: ', response);
			return response;
		}
		catch (err) {
			return { status: 'error', msg: 'Could not send receipt while offline.' };
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
			return Object.entries(userData)
				.reduce((horses, [key, value]) => {
					const matchHorse = key.match(/^horse_list_(\d+)$/);
					if (!matchHorse) return horses;

					const index = matchHorse[1];

					const [hID, horse_name] = value.split(':');

					const existingHorse = horses.find(h => h.index === index) || {
						index,  // Store index for sorting
						hID: Number(hID),
						horse_name,
						type_trim: userData[`service_cost_${index}`],
						acc: userData[`accessories_${index}`] || []
					};

					return [...horses.filter(h => h.index !== index), existingHorse];
				}, [])
				.sort((a, b) => Number(a.index) - Number(b.index))
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
	async addTrimSession(backupData, trimmingStoreData) {
		try {
			const { cID, add_trimming, userData, ...newTrimmingData } = backupData;
			const { trimID } = backupData;

			// Push the trimming onto the trimmingstoreData
			trimmingStoreData.trimmings.push(newTrimmingData);

			// Make a shallow copy of the backup trimming data structure
			const db = await this.#indexed.openDBPromise();

			// Start the transaction
			const tx = db.transaction([
				this.#indexed.stores.MAXTRIMID,
				this.#indexed.stores.ADDTRIMMING,
				this.#indexed.stores.TRIMMING
			], 'readwrite');

			await Promise.all([
				this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.ADDTRIMMING, false, tx),
				this.#indexed.putStorePromise(db, { trimID }, this.#indexed.stores.MAXTRIMID, true, tx),
				this.#indexed.putStorePromise(db, trimmingStoreData, this.#indexed.stores.TRIMMING, false, tx),
			]);

			// Lets clean up the trimmings
			await this.cleanupTrimmings(cID);

			// Return a properly formatted success response
			return true;
		}
		catch (err) {
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'Failed to add trimming session',
				displayTarget: 'form-msg',
			}, true);
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
