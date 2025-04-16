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

	async getAllPersonalNotes(){
		try{
			const db = await this.#indexed.openDBPromise();

			const notes = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.PERSONALNOTES);
			this.#log('Personal notes: ', notes);

			return notes;
		}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error retrieving your personal notes.',
				displayTarget: 'form-msg',
			}, true);
		}

	}

	async getSpecificPersonalNotes(notesID){
		try{
			const db = await this.#indexed.openDBPromise();
			const notes = await this.#indexed.getStorePromise(db, this.#indexed.stores.PERSONALNOTES, parseInt(notesID, 10));
			this.#log('Personal notes: ', notes);

			return notes;
		} 
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error retrieving your personal notes.',
				displayTarget: 'form-msg',
			}, true);
		}
	}

	async addPersonalNotes(userData){
		try{
			// Set the date
			const today = new Date().toISOString().slice(0, 10);

			// Get the max personal notes id. getLastKeyForID creates it's own db connection.
			this.#log('Max personal notes ID: ', this.#indexed.stores.MAXPERSONALNOTESID);
			const notesID = await this.#indexed.getLastKeyForID({store: this.#indexed.stores.MAXPERSONALNOTESID});
			this.#log('New personal notes ID: ', notesID);
			// Build the notes data object
			const notesData = {
				date: today,
				notesID,
				...userData,
			};
			this.#log('Notes data: ', notesData);

			// Backup the notes data for server sync
			const backupData = {
				add_personalNotes: true,
				...notesData,
			};
			this.#log('Backup data: ', backupData);

			// Set up the db operations
			const db = await this.#indexed.openDBPromise();
			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.MAXPERSONALNOTESID,
				this.#indexed.stores.ADDPERSONALNOTES,
			], 'readwrite');

			await Promise.all([
				this.#indexed.putStorePromise(db, notesData, this.#indexed.stores.PERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.ADDPERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(db, {notesID}, this.#indexed.stores.MAXPERSONALNOTESID, true, tx),
			]);

			return true;
		}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error adding your personal notes.',
				displayTarget: 'form-msg',
			}, true);
		}
	}

	async deletePersonalNotes(notesID){
		try{
			const backupData = {
				delete_personalNotes: true,
				notesID: parseInt(notesID, 10),
			};

			const db = await this.#indexed.openDBPromise();
			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.DELETEPERSONALNOTES,
			], 'readwrite');

			await Promise.all([
				this.#indexed.deleteRecordPromise(parseInt(notesID,10), this.#indexed.stores.PERSONALNOTES, tx),
				this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.DELETEPERSONALNOTES, false, tx),
			]);

			return true;
		}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error deleting your personal notes.',
				displayTarget: 'form-msg',
			}, true);
		}
	}

	async editPersonalNotes(userData){
		try{
			const { date, notes, notesID } = userData;

			const db = await this.#indexed.openDBPromise();			
			const userNotes = await this.getSpecificPersonalNotes(notesID);

			const updatedNotes = {
				...userNotes,
				notes,
			};

			const backupData = {
				edit_personalNotes: true,
				...updatedNotes,
			};

			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.EDITPERSONALNOTES,
			], 'readwrite');
			
			await Promise.all([
				this.#indexed.putStorePromise(db, updatedNotes, this.#indexed.stores.PERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.EDITPERSONALNOTES, false, tx),
			]);

			return true;

		}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: 'There was an error editing your personal notes.',
				displayTarget: 'form-msg',
			}, true);
		}

	}
}