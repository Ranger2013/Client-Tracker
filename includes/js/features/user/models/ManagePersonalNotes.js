import IndexedDBOperations from '../../../core/database/IndexedDBOperations.js';

export default class ManagePersonalNotes {
	// Static private property to hold the singleton instance
	static #instance = null;

	// Instance private properties
	#indexed;
	#debug = false;

	/**
	 * Creates a new ManagePersonalNotes instance or returns existing singleton
	 * @param {Object} options - Configuration options
	 * @param {boolean} [options.debug=false] - Enable debug logging
	 */
	constructor(options = { debug: false }) {
		// If an instance already exists, return it
		if (ManagePersonalNotes.#instance) {
			// Optionally update debug setting if passed
			if (options.debug !== undefined) {
				ManagePersonalNotes.#instance.setDebugMode(options.debug);
			}
			return ManagePersonalNotes.#instance;
		}

		// First-time initialization
		this.#indexed = new IndexedDBOperations();
		this.#debug = options.debug || false;

		// Store this instance as the singleton
		ManagePersonalNotes.#instance = this;

		this.#log('ManagePersonalNotes singleton instance created.');
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
	 * Debug log helper - only logs when debug is enabled
	 * @private
	 */
	#log(...args) {
		if (this.#debug) {
			console.log(`[ManagePersonalNotes]`, ...args);
		}
	}

	async getPersonalNotes(){
		try{}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error retrieving your personal notes.',
				targetDisplay: 'form-msg',
			}, true);
		}

	}

	async addPersonalNotes(userData){
		try{
			// Set the date
			const today = new Date().toISOString().slice(0, 10);

			// Get the max personal notes id. getLastKeyForID creates it's own db connection.
			const notesID = await this.#indexed.getLastKeyForID(this.#indexed.stores.MAXPERSONALNOTESID);

			// Build the notes data object
			const notesData = {
				date: today,
				notesID,
				...userData,
			};

			// Backup the notes data for server sync
			const backupData = {
				add_personalNotes: true,
				...notesData,
			};

			// Set up the db operations
			const db = this.#indexed.openDBPromise();
			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.MAXPERSONALNOTESID,
				this.#indexed.stores.ADDPERSONALNOTES,
			], 'readwrite');

			await Promise.all([
				this.#indexed.putStorePromise(tx, notesData, this.#indexed.stores.PERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(tx, backupData, this.#indexed.stores.ADDPERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(tx, notesID, this.#indexed.stores.MAXPERSONALNOTESID, true, tx),
			]);

			return true;
		}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error adding your personal notes.',
				targetDisplay: 'form-msg',
			}, true);
		}
	}

	async editPersonalNotes(){
		try{}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error editing your personal notes.',
				targetDisplay: 'form-msg',
			}, true);
		}

	}
}