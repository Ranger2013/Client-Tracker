/**
 * @typedef {Object} StoreConfig
 * @property {string} [keyPath] - Primary key path
 * @property {boolean} [autoIncrement] - Auto increment flag
 * @property {Array<{name: string, keyPath: string, unique: boolean}>} [indexes] - Store indexes
 */
export default class IndexedDBOperations {
    // Static private property to hold the singleton instance
    static #instance = null;

    // Instance private properties
    #dbName = 'ClientTrackerDB';
    #version = 1;
    #db = null;
    #debug = false;

    constructor(options = { debug: false }) {
        // If an instance already exists, return it
        if (IndexedDBOperations.#instance) {
            // Optionally update debug setting if passed
            if (options.debug !== undefined) {
                IndexedDBOperations.#instance.setDebugMode(options.debug);
            }
            return IndexedDBOperations.#instance;
        }

        this.#debug = options.debug;

        // Store this instance as the singleton
        IndexedDBOperations.#instance = this;
        this.#log('IndexedDBOperations singleton instance created');
        return this;
    }

    // Add debug logging
    #log(...args) {
        if (this.#debug) {
            console.log('[IndexedDBOperations]', ...args);
        }
    }

    setDebugMode(enabled) {
        this.#debug = !!enabled;
    }

    // Store configurations
    #storeConfigs = {
        // Client stores
        'CLIENTLIST': {
            keyPath: 'primaryKey',
            indexes: [
                { name: 'cID', keyPath: 'cID', unique: false },
                { name: 'trim_date', keyPath: 'trim_date', unique: false }
            ]
        },
        'MAXCLIENTID': { keyPath: 'cID', unique: true },
        'MAXCLIENTPRIMARYKEY': { keyPath: 'primaryKey', unique: true },
        'ADDCLIENT': { keyPath: 'cID', unique: true },
        'EDITCLIENT': { keyPath: 'primaryKey', unique: true },
        'DELETECLIENT': { keyPath: 'cID' },
        'ADDDUPLICATECLIENT': { keyPath: 'primaryKey', unique: true },
        'DELETEDUPLICATECLIENT': { keyPath: 'primaryKey', unique: true },

        // Trimming stores
        'TRIMMING': { keyPath: 'cID', unique: true },
        'MAXTRIMID': { keyPath: 'trimID', unique: true },
        'ADDTRIMMING': { keyPath: 'trimID', unique: true },
        'EDITTRIMMING': { keyPath: 'cID' },
        'DELETETRIMMING': { keyPath: 'cID' },

        // Mileage stores
        'EDITMILEAGE': { keyPath: 'mileageID', unique: true },
        'DELETEMILEAGE': { keyPath: 'mileageID', unique: true },

        // Expenses stores
        'EDITEXPENSES': { keyPath: 'expID', unique: true },
        'DELETEEXPENSES': { keyPath: 'expID', unique: true },

        // Personal notes stores
        'PERSONALNOTES': { keyPath: 'notesID', unique: true },
        'ADDPERSONALNOTES': { keyPath: 'notesID', unique: true },
        'EDITPERSONALNOTES': { keyPath: 'notesID', unique: true },
        'DELETEPERSONALNOTES': { keyPath: 'notesID', unique: true },
        'MAXPERSONALNOTESID': { keyPath: 'notesID', unique: true },

        // Horse stores
        'MAXHORSEID': { keyPath: 'hID', unique: true },
        'ADDHORSE': { keyPath: 'hID', autoIncrement: true, unique: true },
        'EDITHORSE': { keyPath: 'hID' },
        'DELETEHORSE': { keyPath: 'hID' },

        // User settings stores
        'USERSETTINGS': { autoIncrement: true },
        'DATETIME': { autoIncrement: true },
        'FARRIERPRICES': { autoIncrement: true },
        'MILEAGECHARGES': { autoIncrement: true },
        'SCHEDULINGOPTIONS': { autoIncrement: true },
        'COLOROPTIONS': { autoIncrement: true },

        // Error queue
        'ERRORQUEUE': { autoIncrement: true },

        // Default configuration
        'DEFAULT': { autoIncrement: true }
    };

    /**
     * Available stores in the database
     * @readonly
     */
    stores = {
        // Client trimming operations that need to be backed up on the server
        MAXTRIMID: 'max_trim_id',
        ADDTRIMMING: 'backup_add_trimming',
        EDITTRIMMING: 'backup_edit_trimming',
        DELETETRIMMING: 'backup_delete_trimming',
        // Add Mileage 
        ADDMILEAGE: 'backup_add_mileage',
        EDITMILEAGE: 'backup_edit_mileage',
        DELETEMILEAGE: 'backup_delete_mileage',
        // Client operation stores
        MAXCLIENTID: 'max_client_id',
        MAXCLIENTPRIMARYKEY: 'max_client_primary_key',
        ADDCLIENT: 'backup_add_client',
        EDITCLIENT: 'backup_edit_client',
        DELETECLIENT: 'backup_delete_client',
        ADDDUPLICATECLIENT: 'backup_add_duplicate_client',
        DELETEDUPLICATECLIENT: 'backup_delete_duplicate_client',
        // Client horse operations to back up data to the server
        MAXHORSEID: 'max_horse_id',
        ADDHORSE: 'backup_add_horse',
        EDITHORSE: 'backup_edit_horse',
        DELETEHORSE: 'backup_delete_horse', // Ensure DELETEHORSE store is defined
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
        // User Settings
        USERSETTINGS: 'user_settings', // Stores the users date/time, schedule options, color options and farrier prices and accessories
        CLIENTLIST: 'client_list', // This will store all of the clients personal information, including their horses
        TRIMMING: 'trimmings',
        ERRORQUEUE: 'error_queue', // For storing errors when offline
    };

    /**
     * Handles errors using the AppError class.
     * @param {Object} details - The error details.
     * @param {string} details.consoleMsg - The console message to log.
     * @param {Error} details.err - The error object.
     * @param {string} details.userMsg - The user message to display.
     * @returns {Promise<void>}
     */
    async #handleError({ consoleMsg, err, userMsg }) {
        const { AppError } = await import('../errors/models/AppError.js');
        await AppError.process(err, {
            errorCode: AppError.Types.DATABASE_ERROR,
            userMessage: userMsg,
            displayTarget: 'page-msg'
        }, true);
    }

    /**
     * Opens or creates database connection
     * @returns {Promise<IDBDatabase>}
     * @throws {Error} If database connection fails
     */
    async openDBPromise() {
        try {
            if (this.#db) return this.#db;

            this.#db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(this.#dbName, this.#version);

                request.onupgradeneeded = (evt) => this.#handleUpgrade(evt);
                request.onsuccess = (evt) => resolve(evt.target.result);
                request.onerror = () => reject(new Error('Failed to open database'));
                request.onblocked = () => reject(new Error('Database blocked - close other tabs'));
            });

            return this.#db;
        }
        catch (err) {
            await this.#handleError({
                consoleMsg: 'Database open failed: ',
                err,
                userMsg: 'Unable to access local storage'
            });
        }
    }

    /**
     * Handles database upgrade
     * @private
     */
    #handleUpgrade(evt) {
        const db = evt.target.result;

        for (const [key, storeName] of Object.entries(this.stores)) {
            if (!db.objectStoreNames.contains(storeName)) {
                const config = this.#storeConfigs[key] ?? this.#storeConfigs.DEFAULT;
                this.createStore(db, storeName, config);
            }
        }
    }

    /**
     * Creates an object store with optional indexes
     * @param {IDBDatabase} db - Database instance
     * @param {string} name - Store name
     * @param {StoreConfig} config - Store configuration
     */
    createStore(db, name, config) {
        const store = db.createObjectStore(name, config);
        if (config.indexes) {
            config.indexes.forEach(index => {
                store.createIndex(index.name, index.keyPath, { unique: index.unique });
            });
        }
    }

    /**
    * Opens a readwrite transaction on a given object store.
    *
    * @param {IDBDatabase} db - The IndexedDB database.
    * @param {string} store - The name of the object store.
    * @param {IDBTransaction} [transaction] - An existing transaction.
    * @returns {Promise<IDBObjectStore>} The object store.
    */
    async transReadWrite(db, store, transaction = null) {
        try {
            const tx = transaction || db.transaction(store, 'readwrite');
            tx.onerror = (err) => {
                console.error(`Transaction error in store ${store}:`, err);
                tx.abort();
            };
            return tx.objectStore(store);
        }
        catch (err) {
            await this.#handleError({
                consoleMsg: `Transaction error in store ${store}: `,
                err,
                userMsg: 'Unable to access storage'
            });
        }
    }

    /**
    * Opens a readonly transaction on a given object store.
    *
    * @param {IDBDatabase} db - The IndexedDB database.
    * @param {string} store - The name of the object store.
    * @param {IDBTransaction} [transaction] - An existing transaction.
    * @returns {Promise<IDBObjectStore>} The object store.
    */
    async transReadOnly(db, store, transaction = null) {
        try {
            const tx = transaction || db.transaction(store, 'readonly');
            return tx.objectStore(store);
        }
        catch (err) {
            await this.#handleError({
                consoleMsg: `Failed to access store ${store}: `,
                err,
                userMsg: 'Unable to read from storage'
            });
        }
    }

    /**
     * Gets the next available ID for a store
     * @param {Object} params - Parameters object
     * @param {string} params.store - Store name to query
     * @param {IDBTransaction} [params.tx] - Optional transaction
     * @returns {Promise<number>} Next available ID
     */
    async getLastKeyForID({ store, tx = null }) {
        try {
            this.#log('Getting last key for store:', store);

            if (!store) {
                throw new Error('Store name required');
            }

            const db = tx?.db || await this.openDBPromise();
            const objectStore = await this.transReadOnly(db, store, tx);

            return new Promise((resolve, reject) => {
                const request = objectStore.openCursor(null, 'prev');

                request.onerror = (event) => {
                    this.#log('Cursor error:', event.target.error);
                    reject(event.target.error);
                };

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    this.#log('Cursor result:', cursor?.key);

                    // If cursor exists, return next ID, otherwise return 1
                    const nextId = cursor ? cursor.key + 1 : 1;
                    this.#log('Next ID:', nextId);
                    resolve(nextId);
                };
            });
        } catch (err) {
            this.#log('Error in getLastKeyForID:', err);
            await this.#handleError({
                consoleMsg: 'Failed to get last key:',
                err,
                userMsg: 'Unable to generate new ID'
            });
        }
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
    async addStorePromise(db, data, store, clearStore = false, transaction) {
        try {
            // Sync error checks (will throw via #handleError if they fail)
            if (!db) throw new Error('Database instance required');
            if (!store) throw new Error('Store name required');
            if (!data) throw new Error('No data provided for store operation');

            const myStore = await this.transReadWrite(db, store, transaction);

            // Return a new Promise that resolves both clear and add operations
            return new Promise((resolve, reject) => {
                if (clearStore) {
                    const clearRequest = myStore.clear();
                    clearRequest.onerror = evt => reject(evt.target.error);
                    clearRequest.onsuccess = () => {
                        const addRequest = myStore.add(data);
                        addRequest.onsuccess = evt => resolve(evt.target.result);
                        addRequest.onerror = evt => reject(evt.target.error);
                    };
                }
                else {
                    const addRequest = myStore.add(data);
                    addRequest.onsuccess = evt => resolve(evt.target.result);
                    addRequest.onerror = evt => reject(evt.target.error);
                }
            });
        }
        catch (err) {
            await this.#handleError({
                consoleMsg: `Error in addStorePromise operation: `,
                err,
                userMsg: 'Unable to add data to the database.'
            });
        }
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
    async putStorePromise(db, data, store, clearStore = false, transaction) {
        try {
            // Synchronous error checks
            if (!db) throw new Error('Database instance required');
            if (!store) throw new Error('Store name required');
            if (!data) throw new Error('No data provided for store operation');

            const myStore = await this.transReadWrite(db, store, transaction);

            // Return a new Promise that resolves both clear and put operations
            return new Promise((resolve, reject) => {
                if (clearStore) {
                    const clearRequest = myStore.clear();
                    clearRequest.onerror = evt => reject(evt.target.error);
                    clearRequest.onsuccess = () => {
                        this.#log('Store cleared successfully, now putting data...', data);
                        const putRequest = myStore.put(data);
                        putRequest.onsuccess = evt => resolve(evt.target.result);
                        putRequest.onerror = evt => reject(evt.target.error);
                    };
                }
                else {
                    const putRequest = myStore.put(data);
                    putRequest.onsuccess = evt => resolve(evt.target.result);
                    putRequest.onerror = evt => reject(evt.target.error);
                }
            });
        }
        catch (err) {
            console.warn('Error in putStorePromise:', err);
            await this.#handleError({
                consoleMsg: `Error in putStorePromise database operation: `,
                err,
                userMsg: 'Unable to save your data at this time.'
            });
        }
    }

    /**
    * Retrieves all records from a store that match the provided key and returns a promise that resolves with the result of the operation.
    *
    * @param {IDBDatabase} db - The IndexedDB database.
    * @param {string} store - The name of the store.
    * @param {number} key - The key of the data to retrieve.
    * @param {IDBTransaction} [transaction] - An existing transaction.
    * @returns {Promise<any>} A promise that resolves with the result of the operation.
    */
    getStorePromise(db, store, key, transaction) {
        return new Promise(async (resolve, reject) => {
            try {
                // Synchronous checks first
                if (!db) throw new Error('Database instance required');
                if (!store) throw new Error('Store name required');
                if (key === undefined || key === null) {
                    throw new Error('No key specified for database operation');
                }

                const myStore = await this.transReadOnly(db, store, transaction);
                let request = myStore.get(key);

                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = (evt) => reject(evt.target.error); // Just reject

            } catch (err) {
                // For synchronous errors, use handleError which will throw
                await this.#handleError({
                    consoleMsg: `Error in database operation: `,
                    err,
                    userMsg: 'Unable to perform database operation'
                });
                // No need to reject - #handleError will throw
            }
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
        return new Promise(async (resolve, reject) => {
            try {
                const myStore = await this.transReadOnly(db, store);

                const request = myStore.getAll();

                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = (evt) => reject(evt.target.error); // Just reject
            }
            catch (err) {
                await this.#handleError({
                    consoleMsg: `Error accessing store ${store}: `,
                    err,
                    userMsg: 'Unable to access data store'
                });
            }
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
        return new Promise(async (resolve, reject) => {
            try {
                // Synchronous error checks
                if (!db) throw new Error('Database instance required');
                if (!store) throw new Error('Store name required');
                if (!indexName) throw new Error('Index name required');
                if (value === undefined || value === null) {
                    throw new Error('No value specified for index operation');
                }

                const myStore = await this.transReadOnly(db, store, transaction);
                const index = myStore.index(indexName);

                // Only convert to number if it's not the trim_date index
                const searchValue = indexName === 'trim_date' ? value : (typeof value === 'string' ? parseInt(value, 10) : value);

                const request = index.getAll(IDBKeyRange.only(searchValue));

                request.onsuccess = (evt) => resolve(evt.target.result);
                request.onerror = (evt) => reject(evt.target.error);
            }
            catch (err) {
                await this.#handleError({
                    consoleMsg: `Error in database operation: `,
                    err,
                    userMessage: 'Unable to perform database operation'
                });
            }
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
        return new Promise(async (resolve, reject) => {
            try {
                // Synchronous error checks
                if (!db) throw new Error('Database instance required');
                if (!store) throw new Error('Store name required');

                const myStore = await this.transReadWrite(db, store, transaction);
                const response = myStore.clear();

                response.onsuccess = () => resolve(response.result);
                response.onerror = (evt) => reject(evt.target.error); // Just reject
            }
            catch (err) {
                await this.#handleError({
                    consoleMsg: `Error in database operation: `,
                    err,
                    userMsg: 'Unable to perform database operation'
                });
            }
        });
    }

    /** {
     * Adds data to a store in the IndexedDB database
     * @param {any} userData - The data to add
     * @param {string} storeName - Name of the store
     * @param {boolean} [clearStore=false] - Whether to clear store first
     * @param {IDBTransaction} [transaction=null] - Optional transaction
     * @returns {Promise<any>} Result of the operation
     */
    async addIndexDBPromise({ data, storeName, clearStore = false, transaction = null }) {
        return new Promise(async (resolve, reject) => {
            try {
                // Synchronous error checks
                if (!data) throw new Error('No data provided for store operation');
                if (!storeName) throw new Error('Store name required');

                const db = await ((transaction instanceof IDBTransaction) ? transaction.db : this.openDBPromise());
                const myStore = await this.transReadWrite(db, storeName, transaction);

                if (clearStore) {
                    const clearRequest = myStore.clear();
                    clearRequest.onerror = async evt => {
                        evt.preventDefault();
                        await this.#handleError({
                            consoleMsg: `Error clearing store ${storeName}: `,
                            err: evt.target.error,
                            userMsg: 'Unable to add data'
                        });
                    };
                }

                const request = myStore.add(data);

                request.onsuccess = (evt) => resolve(evt.target.result);
                request.onerror = (evt) => reject(evt.target.error); // Just reject
            }
            catch (err) {
                await this.#handleError({
                    consoleMsg: `Error in database operation: `,
                    err,
                    userMsg: 'Unable to perform database operation'
                });
            }
        });
    }

    /**
    * Updates data in a store in the IndexedDB database and returns a promise that resolves with the result of the operation.
    *
    * @param {any} userData - The data to update.
    * @param {string} storeName - The name of the store.
    * @returns {Promise<any>} A promise that resolves with the result of the operation.
    */
    async putIndexDBPromise(userData, storeName, transaction = null) {
        return new Promise(async (resolve, reject) => {
            try {
                // Synchronous error checks
                if (!userData) throw new Error('No data provided for store operation');
                if (!storeName) throw new Error('Store name required');

                const db = await ((transaction instanceof IDBTransaction) ? transaction.db : this.openDBPromise());
                const myStore = await this.transReadWrite(db, storeName, transaction);

                const request = myStore.put(userData);

                request.onsuccess = (evt) => resolve(evt.target.result);
                request.onerror = (evt) => reject(evt.target.error); // Just reject
            }
            catch (err) {
                await this.#handleError({
                    consoleMsg: `Error in database operation: `,
                    err,
                    userMsg: 'Unable to perform database operation'
                });
            }
        });
    }

    /**
    * Deletes a record from a store in the IndexedDB database and returns a promise that resolves when the operation is complete.
    *
    * @param {string} store - The name of the store.
    * @param {number} key - The key of the record to delete.
    * @returns {Promise<void>} A promise that resolves when the operation is complete.
    */
    async deleteRecordPromise(key, store, transaction = null) {
        try {
            // Check if transaction is an instance of IDBTransaction, if not, open the dbDBPromise();
            const db = await ((transaction instanceof IDBTransaction) ? transaction.db : this.openDBPromise());

            // Get the object store with the correct transaction
            const myStore = await this.transReadWrite(db, store, transaction);

            // Delete the record
            const deleteRecord = myStore.delete(key);

            // await the promise to ensure it completes
            return await new Promise((resolve, reject) => {
                deleteRecord.onsuccess = () => {
                    resolve(true)
                };
                deleteRecord.onerror = (evt) => reject(evt.target.error); // Just reject
            });
        }
        catch (err) {
            await this.#handleError({
                consoleMsg: `Error in database operation: `,
                err,
                userMsg: 'Unable to perform database operation'
            });
        }
    }

    async deleteIDBDatabasePromise() {
        return new Promise((resolve, reject) => {
            const db = indexedDB.deleteDatabase(this.#dbName);
            db.onsuccess = () => {
                resolve(true);
            };

            db.onerror = async err => {
                await this.#handleError({
                    consoleMsg: `Error deleting database: `,
                    err,
                    userMsg: 'Unable to delete database'
                });
                resolve(false);
            }
        });
    }
}