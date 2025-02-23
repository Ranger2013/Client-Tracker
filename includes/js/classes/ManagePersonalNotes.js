
import IndexedDBOperations from "./IndexedDBOperations.js";

export default class ManagePersonalNotes {
	constructor() {
		this.indexed = new IndexedDBOperations();
	}

	async getPersonalNotes(){
		try{
			const db = await this.indexed.openDBPromise();

			// Get the user's personal notes
			const notes = await this.indexed.getAllStorePromise(db, this.indexed.stores.PERSONALNOTES);

			return notes?.length > 0 ? notes : [];
		}
		catch(err){
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('getPersonalNotesError', 'Get personal notes error: ', err);
			throw err;
		}
	}

	async addPersonalNotes(userData){
		try{
			// Get the personal notes id
			const notesID = await this.indexed.getLastKeyForID(this.indexed.stores.MAXPERSONALNOTESID);
			
			// Add the notes ID
			userData.notesID = notesID;

			const backupNotes = { ...userData, add_personalNotes: true };

			const db = await this.indexed.openDBPromise();
			const tx = db.transaction([
				this.indexed.stores.PERSONALNOTES,
				this.indexed.stores.ADDPERSONALNOTES,
				this.indexed.stores.MAXPERSONALNOTESID,
			], 'readwrite');

			const promises = [];

			// Add notes to the object store,
			promises.push(this.indexed.putStorePromise(db, userData, this.indexed.stores.PERSONALNOTES, false, tx));
			
			// Add notes to the backup notes
			promises.push(this.indexed.putStorePromise(db, backupNotes, this.indexed.stores.ADDPERSONALNOTES, false, tx));

			// Put the notes ID back in the max id store
			promises.push(this.indexed.putStorePromise(db, notesID, this.indexed.stores.MAXPERSONALNOTESID, true, tx));

			// Wait for all promises
			await Promise.all(promises);

			return { status: true, msg: 'Personal notes added successfully.' };
		}
		catch(err){
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('addPersonalNotesError', 'Add personal notes error: ', err);
			return { status: false, msg: 'Unable to add personal notes at this time. Please try again later.' };
		}
	}

	async handleEditingPersonalnotes(evt){
		try{
			// Get the form data
			const userData = Object.fromEntries(new FormData(evt.target));
			
			//  Which button submitted the form
			const submitter = evt.submitter;

			if(submitter.name === 'delete'){
				if(!confirm('Are you sure you want to delete this note?')) return;

				return await this.deletePersonalNotes(userData.notesID);
			}

			return await this.editPersonalNotes(userData);
		}
		catch(err){
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('handleEditingPersonalnotesError', 'Handle editing personal notes error: ', err);
			return { status: false, msg: 'Unable to edit/delete personal notes at this time. Please try again later' };
		}
	}

	async editPersonalNotes(userData){
		try{
			const db = await this.indexed.openDBPromise();
			const tx = db.transaction([
				this.indexed.stores.PERSONALNOTES,
				this.indexed.stores.EDITPERSONALNOTES,
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
				this.indexed.putStorePromise(db, processedData, this.indexed.stores.PERSONALNOTES, false, tx),
				this.indexed.putStorePromise(db, backupData, this.indexed.stores.EDITPERSONALNOTES, false, tx),
			]);

			return { status: true, msg: 'Personal notes edited successfully.', type: 'edit' };
		}
		catch(err){
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('editPersonalNotesError', 'Edit personal notes error: ', err);
			return { status: false, msg: 'Unable to edit personal notes at this time. Please try again later.' };
		}
	}

	async deletePersonalNotes(notesID){
		try{
			const db = await this.indexed.openDBPromise();
			const tx = db.transaction([
				this.indexed.stores.PERSONALNOTES,
				this.indexed.stores.DELETEPERSONALNOTES,
			], 'readwrite');

			const backupData = {
				notesID: parseInt(notesID, 10),
				delete_personalNotes: true,
			};

			// Convert notesID to a number
			notesID = parseInt(notesID, 10);

			await Promise.all([
				this.indexed.putStorePromise(db, backupData, this.indexed.stores.DELETEPERSONALNOTES, false, tx),
				this.indexed.deleteRecordPromise(notesID, this.indexed.stores.PERSONALNOTES, tx),
			]);

			return { status: true, msg: 'Personal notes deleted successfully.', type: 'delete' };
		}
		catch(err){
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('deletePersonalNotesError', 'Delete personal notes error: ', err);
			return { status: false, msg: 'Unable to delete personal notes at this time. Please try again later.' };
		}
	}
}