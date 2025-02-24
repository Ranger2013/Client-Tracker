import IndexedDBOperations from "./IndexedDBOperations.js";

export default class ManagePersonalNotes {
	#indexed;

	constructor() {
		this.#indexed = new IndexedDBOperations();
	}

	/**
	 * Retrieves all personal notes from IndexedDB
	 * @returns {Promise<Array>} Array of personal notes or empty array
	 * @throws {Error} If database operation fails
	 */
	async getPersonalNotes() {
		try {
			const db = await this.#indexed.openDBPromise();
			const notes = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.PERSONALNOTES);
			return notes?.length > 0 ? notes : [];
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");  // Dynamic import
			await handleError({
				filename: 'getPersonalNotesError',
				consoleMsg: 'Get personal notes error: ',
				err,
				userMsg: 'Unable to retrieve personal notes'
			});
			throw err;  // Let caller handle error
		}
	}

	/**
	 * Adds new personal notes
	 * @param {Object} params - Function parameters
	 * @param {Object} params.userData - Notes data to store
	 * @returns {Promise<{status: boolean, msg: string}>} Operation result
	 */
	async addPersonalNotes({ userData }) {
		try {
			// Get the personal notes id
			const notesID = await this.#indexed.getLastKeyForID(this.#indexed.stores.MAXPERSONALNOTESID);

			// Add the notes ID
			userData.notesID = notesID;

			const backupNotes = { ...userData, add_personalNotes: true };

			const db = await this.#indexed.openDBPromise();
			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.ADDPERSONALNOTES,
				this.#indexed.stores.MAXPERSONALNOTESID,
			], 'readwrite');

			await Promise.all([
				this.#indexed.putStorePromise(db, userData, this.#indexed.stores.PERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(db, backupNotes, this.#indexed.stores.ADDPERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(db, notesID, this.#indexed.stores.MAXPERSONALNOTESID, true, tx)
			]);

			return { status: true, msg: 'Personal notes added successfully.' };
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");  // Dynamic import
			await handleError({
				filename: 'addPersonalNotesError',
				consoleMsg: 'Add personal notes error: ',
				err,
				userMsg: 'Unable to add personal notes at this time. Please try again later.'
			});
			return { status: false, msg: 'Unable to add personal notes at this time. Please try again later.' };
		}
	}

	/**
	 * Edits existing personal note
	 * @param {Object} userData - Note data to update
	 * @param {number|string} userData.notesID - ID of note to edit
	 * @param {string} userData.title - Note title
	 * @param {string} userData.note - Note content
	 * @returns {Promise<{status: boolean, msg: string, type: string}>} Operation result
	 */
	async editPersonalNotes(userData) {
		try {
			const db = await this.#indexed.openDBPromise();
			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.EDITPERSONALNOTES,
			], 'readwrite');

			const backupData = {
				...userData,
				edit_personalNotes: true,
			};

			const processedData = {
				...userData,
				notesID: parseInt(userData.notesID, 10),
			}

			await Promise.all([
				this.#indexed.putStorePromise(db, processedData, this.#indexed.stores.PERSONALNOTES, false, tx),
				this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.EDITPERSONALNOTES, false, tx),
			]);

			return { status: true, msg: 'Personal notes edited successfully.', type: 'edit' };
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");  // Dynamic import
			await handleError({
				filename: 'editPersonalNotesError',
				consoleMsg: 'Edit personal notes error: ',
				err,
				userMsg: 'Unable to edit personal notes at this time. Please try again later.'
			});
			return { status: false, msg: 'Unable to edit personal notes at this time. Please try again later.' };
		}
	}

	/**
	 * Deletes a personal note by ID
	 * @param {number|string} notesID - ID of note to delete
	 * @returns {Promise<{status: boolean, msg: string, type: string}>} Operation result with:
	 *   - status: Success state
	 *   - msg: User feedback message
	 *   - type: Operation type ('delete')
	 */
	async deletePersonalNotes(notesID) {
		try {
			const db = await this.#indexed.openDBPromise();
			const tx = db.transaction([
				this.#indexed.stores.PERSONALNOTES,
				this.#indexed.stores.DELETEPERSONALNOTES,
			], 'readwrite');

			const backupData = {
				notesID: parseInt(notesID, 10),
				delete_personalNotes: true,
			};

			// Convert notesID to a number
			notesID = parseInt(notesID, 10);

			await Promise.all([
				this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.DELETEPERSONALNOTES, false, tx),
				this.#indexed.deleteRecordPromise(notesID, this.#indexed.stores.PERSONALNOTES, tx),
			]);

			return { status: true, msg: 'Personal notes deleted successfully.', type: 'delete' };
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");  // Dynamic import
			await handleError({
				filename: 'deletePersonalNotesError',
				consoleMsg: 'Delete personal notes error: ',
				err,
				userMsg: 'Unable to delete personal notes at this time. Please try again later.'
			});
			return { status: false, msg: 'Unable to delete personal notes at this time. Please try again later.' };
		}
	}
}