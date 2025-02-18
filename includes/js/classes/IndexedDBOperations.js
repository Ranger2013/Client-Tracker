import { errorLogAPI } from "../utils/network/apiEndpoints.js";
import { logServerSideError } from "../utils/network/network.js";


export default class IndexedDBOperations {
	constructor() {
		this.dbName = 'ClientTrackerDB';
		this.version = 1;
	}

	stores = {
		// Client operation stores to back up data to the server
		MAXCLIENTID: 'max_client_id',
		MAXCLIENTPRIMARYKEY: 'max_client_primary_key',
		ADDCLIENT: 'backup_add_client',
		EDITCLIENT: 'backup_edit_client',
		DELETECLIENT: 'backup_delete_client',
		ADDDUPLICATECLIENT: 'backup_add_duplicate_client',
		DELETEDUPLICATECLIENT: 'backup_delete_duplicate_client',
		// User Settings
		USERSETTINGS: 'user_settings', // Stores the users date/time, schedule options, color options and farrier prices and accessories
		CLIENTLIST: 'client_list', // This will store all of the clients personal information, including their horses
		TRIMMING: 'trimmings',
		// Client horse operations to back up data to the server
		MAXHORSEID: 'max_horse_id',
		ADDHORSE: 'backup_add_horse',
		EDITHORSE: 'backup_edit_horse',
		DELETEHORSE: 'backup_delete_horse', // Ensure DELETEHORSE store is defined
		// Client trimming operations that need to be backed up on the server
		MAXTRIMID: 'max_trim_id',
		ADDTRIMMING: 'backup_add_trimming',
		EDITTRIMMING: 'backup_edit_trimming',
		DELETETRIMMING: 'backup_delete_trimming',
		// Add Mileage 
		ADDMILEAGE: 'backup_add_mileage',
		EDITMILEAGE: 'backup_edit_mileage',
		DELETEMILEAGE: 'backup_delete_mileage',
		// Expenses
		ADDEXPENSES: 'backup_add_expenses',
		EDITEXPENSES: 'backup_edit_expenses',
		DELETEEXPENSES: 'backup_delete_expenses',
		// Personal notes
		PERSONALNOTES: 'personal_notes',
		MAXPERSONALNOTESID: 'max_personal_notes_id',
		ADDPERSONALNOTES: 'backup_add_personal_notes',
		EDITPERSONALNOTES: 'backup_edit_personal_notes',
		DELETEPERSONALNOTES: 'backup_delete_personal_notes',
		// User setting stores to back up data to the server
		DATETIME: 'backup_date_time',
		FARRIERPRICES: 'backup_farrier_prices',
		MILEAGECHARGES: 'backup_mileage_charges',
		SCHEDULINGOPTIONS: 'backup_scheduling_options',
		COLOROPTIONS: 'backup_color_options',
		ERRORQUEUE: 'error_queue', // For storing errors when offline
	};

	upgradedNeeded(evt) {
		const db = evt.target.result;
		const transaction = evt.target.transaction;

		const storeConfigs = {
			// Client store configs
			'CLIENTLIST': { keyPath: 'primaryKey', autoIncrement: false, indexes: [{ name: 'cID', keyPath: 'cID', unique: false }, { name: 'trim_date', keyPath: 'trim_date', unique: false }] },
			'ADDCLIENT': { keyPath: 'cID', autoIncrement: false, unique: true },
			'EDITCLIENT': { keyPath: 'primaryKey', unique: true },
			'DELETECLIENT': { keyPath: 'cID' },
			'ADDDUPLICATECLIENT': { keyPath: 'primaryKey', unique: true },
			'DELETEDUPLICATECLIENT': { keyPath: 'primaryKey', unique: true },
			'MAXCLIENTPRIMARYKEY': { keyPath: 'primaryKey', unique: true },
			'MAXCLIENTID': { keyPath: 'cID', unique: true },
			// Trimming store configs
			'TRIMMING': { keyPath: 'cID', unique: true },
			'MAXTRIMID': { keyPath: 'trimID', unique: true },
			'ADDTRIMMING': { keyPath: 'trimID', unique: true },
			'EDITTRIMMING': { keyPath: 'cID' },
			'DELETETRIMMING': { keyPath: 'cID' },
			// Mileage store configs
			'EDITMILEAGE': { keyPath: 'mileageID', unique: true },
			'DELETEMILEAGE': { keyPath: 'mileageID', unique: true },
			// Expenses store configs
			'EDITEXPENSES': { keyPath: 'expID', unique: true },
			'DELETEEXPENSES': { keyPath: 'expID', unique: true },
			// Personal notes store configs
			'PERSONALNOTES': { keyPath: 'notesID', unique: true },
			'ADDPERSONALNOTES': { keyPath: 'notesID', unique: true },
			'EDITPERSONALNOTES': { keyPath: 'notesID', unique: true },
			'DELETEPERSONALNOTES': { keyPath: 'notesID', unique: true },
			'MAXPERSONALNOTESID': { keyPath: 'notesID', unique: true },
			// Client horse store configs
			'MAXHORSEID': { keyPath: 'hID', unique: true },
			'ADDHORSE': { keyPath: 'hID', autoIncrement: true, unique: true },
			'EDITHORSE': { keyPath: 'hID' },
			'DELETEHORSE': { keyPath: 'hID' },
			// Default store configs
			'DEFAULT': { autoIncrement: true } // Default configuration for any other stores
		};

		// Loop through stores
		for (let key in this.stores) {
			if (this.stores.hasOwnProperty(key)) {
				const storeName = this.stores[key];
				const config = storeConfigs[key] || storeConfigs['DEFAULT'];

				if (!db.objectStoreNames.contains(storeName)) {
					this.createStore(db, storeName, config);
				} else {
					// Get existing store
					const store = transaction.objectStore(storeName);
					// Compare existing config with new config
					if (this.hasConfigChanged(store, config)) {
						this.updateStore(db, transaction, storeName, config);
					}
				}
			}
		}
	}

	createStore(db, name, config) {
		const store = db.createObjectStore(name, config);
		if (config.indexes) {
			config.indexes.forEach(index => {
				store.createIndex(index.name, index.keyPath, { unique: index.unique });
			});
		}
	}

	hasConfigChanged(store, newConfig) {
		// Compare keyPath, autoIncrement, indexes
		return JSON.stringify(store.keyPath) !== JSON.stringify(newConfig.keyPath) ||
			store.autoIncrement !== newConfig.autoIncrement;
	}

	updateStore(db, transaction, name, config) {
		const store = transaction.objectStore(name);
		const getAll = store.getAll();

		getAll.onsuccess = () => {
			const data = getAll.result;
			db.deleteObjectStore(name);
			this.createStore(db, name, config);
			data.forEach(item => store.add(item));
		};
	}

	/**
	* Opens a connection to the IndexedDB database and returns a promise that resolves with the database instance.
	*
	* @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
	*/
	openDBPromise() {
		return new Promise((resolve, reject) => {
			 const index = indexedDB.open(this.dbName, this.version);
  
			 index.onupgradeneeded = (evt) => {
				  try {
						this.upgradedNeeded(evt);
				  } catch (error) {
						console.error('Upgrade error:', error);
						reject(new Error(`Database upgrade failed: ${error.message}`));
				  }
			 };
  
			 index.onsuccess = (evt) => {
				  resolve(evt.target.result);
			 };
  
			 index.onerror = (evt) => {
				  console.error('Database error:', evt.target.error);
				  reject(new Error(`Database open failed: ${evt.target.error.message}`));
			 };
  
			 index.onblocked = (evt) => {
				  console.error('Database blocked:', evt);
				  reject(new Error('Database blocked - close other tabs'));
			 };
		});
  }
	/**
	 * Opens a readwrite transaction on a given object store.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {string} store - The name of the object store.
	 * @param {IDBTransaction} [transaction] - An existing transaction.
	 * @returns {IDBObjectStore} The object store.
	 */
	transReadWrite(db, store, transaction = null) {
		try {
			const tx = transaction || db.transaction(store, 'readwrite');
			tx.onerror = (err) => {
				console.error(`Transaction error in store ${store}:`, err);
				tx.abort();
			};
			return tx.objectStore(store);
		}
		catch (err) {
			console.warn(`Error with the transaction for ${store} store.`);
			logServerSideError(errorLogAPI, err, 'transReadWriteError');
		}
	}

	/**
	 * Opens a readonly transaction on a given object store.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {string} store - The name of the object store.
	 * @param {IDBTransaction} [transaction] - An existing transaction.
	 * @returns {IDBObjectStore} The object store.
	 */
	transReadOnly(db, store, transaction = null) {
		try {
			const tx = transaction || db.transaction(store, 'readonly');
			return tx.objectStore(store);
		}
		catch (err) {
			const errMsg = `Failed to access object store "${store}": ${err.message}`;
			const newErr = new Error(errMsg);

			// Copy the stack trace from the original error
			newErr.stack = err.stack;
			newErr.name = err.name;

			logServerSideError(errorLogAPI, newErr, 'transReadOnlyError');
			throw new Error(errMsg);
		}
	}

	getLastKeyForID(store) {
		return new Promise(async (resolve, reject) => {
			let lastKey = 0;

			// Open the idb db
			const db = await this.openDBPromise();

			const req = db.transaction(store)
				.objectStore(store)
				.openCursor(null, 'prev');

			req.onsuccess = evt => {
				const cursor = evt.target.result;

				if (cursor) {
					resolve(cursor.key + 1);
				}
				else {
					resolve(1);
				}
			}

			req.onerror = err => {
				logServerSideError(errorLogAPI, err, 'getLastKeyForID');
				reject(`Error getting the last key from ${store}: ` + err)
			};
		});
	}

	/**
	 * Adds data to a store and returns a promise that resolves with the result of the operation.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {any} data - The data to add.
	 * @param {string} store - The name of the store.
	 * @param {IDBTransaction} [transaction] - An existing transaction.
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	addStorePromise(db, data, store, clearStore = false, transaction) {
		return new Promise((resolve, reject) => {
			const myStore = this.transReadWrite(db, store, transaction);

			if (clearStore) {
				myStore.clear();
			}

			const response = myStore.add(data)

			response.onsuccess = (evt) => resolve(evt.target.result);
			response.onerror = (err) => {
				logServerSideError(errorLogAPI, err, 'addStorePromise');
				reject(`Error adding data to ${store}: ` + err)
			};
		});
	}

	/**
	 * Updates data in a store and returns a promise that resolves with the result of the operation.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {any} data - The data to update.
	 * @param {string} store - The name of the store.
	 * @param { Boolean} clearStore - Whether to clear the store before adding the data. Default is false.
	 * @param {IDBTransaction} [transaction] - An existing transaction.
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	putStorePromise(db, data, store, clearStore = false, transaction) {
		return new Promise(async (resolve, reject) => {
			try {
				const myStore = this.transReadWrite(db, store, transaction);

				if (clearStore) {
					myStore.clear();
				}

				const response = myStore.put(data);
				response.onsuccess = () => resolve(response.result);
				response.onerror = async err => {
					// Log the error to the server
					await logServerSideError(errorLogAPI, err, 'putStorePromise');
					reject(`Error retrieving data from ${store}: ` + err)
				};
			}
			catch (err) {
				console.warn(`Error putting data into ${store}:`, err);

				// Log the error to the server
				await logServerSideError(errorLogAPI, err, 'putStorePromise');
				reject(`Error retrieving data from ${store}: ` + err);
			}
		});
	}

	putStorePromiseWithKey(db, data, store, key = undefined, clearStore = false, transaction) {
		return new Promise(async (resolve, reject) => {
			try {
				const myStore = this.transReadWrite(db, store, transaction);

				if (clearStore) {
					myStore.clear();
				}

				const response = myStore.put(data, key);
				response.onsuccess = () => resolve(response.result);
				response.onerror = async err => {
					// Log the error to the server
					// await logServerSideError(errorLogAPI, err, 'putStorePromise');

					reject(`Error retrieving data from ${store}: ` + err)
				};
			}
			catch (err) {
				console.warn(`Error putting data into ${store}:`, err);

				// Log the error to the server
				logServerSideError(errorLogAPI, err, 'putStorePromise');
			}
		});
	}

	/**
	 * Retrieves all records from a store that match the provided key and returns a promise that resolves with the result of the operation.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {string} store - The name of the store.
	 * @param {string} key - The key of the data to retrieve.
	 * @param {IDBTransaction} [transaction] - An existing transaction.
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	getStorePromise(db, store, key, transaction) {
		return new Promise((resolve, reject) => {
			const myStore = this.transReadOnly(db, store, transaction);

			let request = myStore.get(key);

			request.onsuccess = (event) => {
				resolve(event.target.result);
			};

			request.onerror = (err) => {
				reject(`Error retrieving data from ${store}: ` + err);
			};
		});
	}

	/**
	 * Retrieves all data from a store and returns a promise that resolves with the result of the operation.
	 * Adds the primary key to the data that is returned
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {string} store - The name of the store.
	 * @param {bool} noKeyAdded - Whether to include the primary key or not with the returned records
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	getAllStorePromise(db, store) {
		return new Promise((resolve, reject) => {
			const myStore = this.transReadOnly(db, store);

			const request = myStore.getAll();

			request.onsuccess = (event) => {
				resolve(event.target.result);
			};

			request.onerror = (event) => {
				reject(`Error retrieving data from ${store}: ` + event.target.error);
			};
		});
	}

	/**
	 * Retrieves all data from a store that matches a certain index and value, and returns a promise that resolves with the result of the operation.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {string} store - The name of the store.
	 * @param {string} indexName - The name of the index.
	 * @param {any} value - The value to match.
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	getAllStoreByIndexPromise(db, store, indexName, value, transaction) {
		return new Promise((resolve, reject) => {
			const myStore = this.transReadOnly(db, store, transaction);
			const index = myStore.index(indexName);
			const response = index.openCursor(IDBKeyRange.only(value));

			const results = [];

			response.onsuccess = (evt) => {
				const cursor = evt.target.result;

				if (cursor) {
					// Include the primary key with each value
					results.push({ ...cursor.value });
					cursor.continue();
				}
				else {
					resolve(results)
				};
			}
			response.onerror = err => {
				console.warn(`In getAllStoreByIndexPromise: error: store: ${store}: `, err);
				reject(`Error retrieving data from ${store}: ` + err)
			};
		});
	}

	/**
	 * Clears a store and returns a promise that resolves when the operation is complete.
	 *
	 * @param {IDBDatabase} db - The IndexedDB database.
	 * @param {string} store - The name of the store.
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 */
	clearStorePromise(db, store, transaction) {
		return new Promise((resolve, reject) => {
			const myStore = this.transReadWrite(db, store, transaction);
			const response = myStore.clear();

			response.onsuccess = () => resolve(response.result);
			response.onerror = err => reject(`Error: Could not clear ${store}: ` + err);
		});
	}

	/**
	 * Adds data to a store in the IndexedDB database and returns a promise that resolves with the result of the operation.
	 *
	 * @param {any} userData - The data to add.
	 * @param {string} storeName - The name of the store.
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	async addIndexDBPromise(userData, storeName, clearStore = null, transaction = null) {
		try {
			// Check if transaction is an instance of IDBTrancaction, if not, open the dbDBPromise();
			const db = await ((transaction instanceof IDBTransaction) ? transaction.db : this.openDBPromise());
			// If we are clearing the store... This is for the stores date-time, color-options, farrier-prices, schedule-options
			if (clearStore) {
				await this.clearStorePromise(db, storeName);
			}

			// Set the result of adding the store to get the onsuccess and onfailure events
			const result = await this.addStorePromise(db, userData, storeName, transaction);
		}
		catch (err) {
			console.error(`Error in addIndexDBPromise: `, err);
			throw err;
		}
	}

	/**
	 * Updates data in a store in the IndexedDB database and returns a promise that resolves with the result of the operation.
	 *
	 * @param {any} userData - The data to update.
	 * @param {string} storeName - The name of the store.
	 * @returns {Promise<any>} A promise that resolves with the result of the operation.
	 */
	async putIndexDBPromise(userData, storeName, transaction = null) {
		try {
			// Check if transaction is an instance of IDBTrancaction, if not, open the dbDBPromise();
			const db = await ((transaction instanceof IDBTransaction) ? transaction.db : this.openDBPromise());

			// Set the result of putting data into the store
			const result = this.putStore(db, userData, storeName, transaction);

			// Await the promise to ensure it completes
			await new Promise((resolve, reject) => {
				result.onsuccess = resolve;
				result.onerror = reject;
			});
		}
		catch (err) {
			console.error(`Error in putIndexDBPromise: `, err);
			throw err;
		}
	}

	/**
	 * Deletes a record from a store in the IndexedDB database and returns a promise that resolves when the operation is complete.
	 *
	 * @param {string} store - The name of the store.
	 * @param {string} key - The key of the record to delete.
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 */
	async deleteRecordPromise(key, store, transaction = null) {
		try {
			// Check if transaction is an instance of IDBTransaction, if not, open the dbDBPromise();
			const db = await ((transaction instanceof IDBTransaction) ? transaction.db : this.openDBPromise());

			// Get the object store with the correct transaction
			const myStore = this.transReadWrite(db, store, transaction);

			// Delete the record
			const deleteRecord = myStore.delete(key);

			// await the promise to ensure it completes
			return await new Promise((resolve, reject) => {
				deleteRecord.onsuccess = () => {
					resolve(true)
				};
				deleteRecord.onerror = err => reject(`Error deleting record from ${store}: ` + err);
			});
		}
		catch (err) {
			console.error(`Error in deleteRecordPromise:`, err);
			throw err;
		}
	}

	async deleteIDBDatabasePromise() {
		return new Promise((resolve, reject) => {
			const db = indexedDB.deleteDatabase(this.dbName);
			db.onsuccess = () => {
				resolve(true);
			};

			db.onerror = () => {
				resolve(false);
			}
		});
	}
}