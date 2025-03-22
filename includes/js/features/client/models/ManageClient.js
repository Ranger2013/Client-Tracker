import IndexedDBOperations from '../../../core/database/IndexedDBOperations.min.js';

export default class ManageClient {
    // Static private property to hold the singleton instance
    static #instance = null;

    // Instance private properties
    #indexed;
    #clientList = null;
    #initialized = false;
    #trimmingInfo = null;
    #debug = false;

    constructor(options = { debug: false }) {
        // If an instance already exists, return it
        if (ManageClient.#instance) {
            // Optionally update debug setting if passed
            if (options.debug !== undefined) {
                ManageClient.#instance.setDebugMode(options.debug);
            }
            return ManageClient.#instance;
        }

        this.#indexed = new IndexedDBOperations();
        this.#debug = options.debug || false;

        // Store this instance as the singleton
        ManageClient.#instance = this;

        this.#log('ManageClient singleton instance created.');
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
            console.log(`[ManageClient]`, ...args);
        }
    }

    async #initializeClientData() {
        if (this.#initialized) return;

        try {
            const db = await this.#indexed.openDBPromise();
            this.#clientList = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.CLIENTLIST);
            this.#initialized = true;
        }
        catch (error) {
            const { AppError } = await import("../../../core/errors/models/AppError.min.js");
            AppError.process(error, {
                errorCode: AppError.Types.INITIALIZATION_ERROR,
                userMessage: 'Client data initialization failed',
            }, true);
        }
    }

    /**
     * Retrieves client information from the IndexedDB.
     * @param {Object} params - The parameters for retrieving client information.
     * @param {string} params.primaryKey - The primary key.
     * @returns {Promise<Object>} A promise that resolves to the client information.
     * @throws Will throw an error if the operation fails.
     */
    async getClientInfo({ primaryKey }) {
        await this.#initializeClientData();
        return this.#clientList.find(client => client.primaryKey === parseInt(primaryKey, 10));
    }

    /**
     * Retrieves all duplicate clients
     * @returns {Promise<Array<Object>>} Array of duplicate clients
     * @throws {Error} If database operation fails
     */
    async getAllDuplicateClients() {
        try {
            const db = await this.#indexed.openDBPromise();
            const clientInfo = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.CLIENTLIST);

            return this.#findDuplicates(clientInfo);
        }
        catch (err) {
            const { AppError } = await import("../../../core/errors/models/AppError.min.js");
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: 'Unable to retrieve duplicate clients',
            }, true);
            return [];
        }
    }

    /**
     * Finds duplicate clients in client list
     * @private
     * @param {Array<Object>} clientInfo - List of clients
     * @returns {Array<Object>} Filtered list of duplicate clients
     */
    #findDuplicates(clientInfo) {
        const duplicateIDs = Object.entries(
            clientInfo.reduce((acc, client) => {
                acc[client.cID] = (acc[client.cID] || 0) + 1;
                return acc;
            }, {})
        )
            .filter(([_, count]) => count > 1)
            .map(([id]) => parseInt(id, 10));

        return clientInfo.filter(client => duplicateIDs.includes(client.cID));
    }

    /**
     * Adds a new client to the IndexedDB.
     * @param {Object} userData - The user data for the new client.
     * @returns {Promise<Object>} A promise that resolves to an object containing the status and message.
     * @throws Will throw an error if the operation fails.
     */
    async addNewClient(userData) {
        try {
            this.#log('Adding new client: userData: ', userData);
            if (!userData) throw new Error('No user data provided.');

            // Get the cID and primary key concurrently
            const [cID, primaryKey] = await Promise.all([
                this.#indexed.getLastKeyForID({ store: this.#indexed.stores.MAXCLIENTID }),
                this.#indexed.getLastKeyForID({ store: this.#indexed.stores.MAXCLIENTPRIMARYKEY })
            ]);

            this.#log('New cID: ', cID);
            this.#log('New Primary Key: ', primaryKey);
            // Add the cID and primary key to the userData
            userData.cID = cID;
            userData.primaryKey = primaryKey;

            const backupData = { ...userData, add_newClient: true };

            // Open the idb
            const db = await this.#indexed.openDBPromise();

            // Start a transaction to ensure we get both operations
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.ADDCLIENT,
                this.#indexed.stores.MAXCLIENTID,
                this.#indexed.stores.MAXCLIENTPRIMARYKEY
            ], 'readwrite');

            await Promise.all([
                this.#indexed.addStorePromise(db, userData, this.#indexed.stores.CLIENTLIST, false, tx),
                this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.ADDCLIENT, false, tx),
                this.#indexed.putStorePromise(db, { cID }, this.#indexed.stores.MAXCLIENTID, true, tx),
                this.#indexed.putStorePromise(db, { primaryKey }, this.#indexed.stores.MAXCLIENTPRIMARYKEY, true, tx)
            ]);

            return true;  // Just return success status
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(error, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Edits a client's information in the object store and updates all other occurrences of the client.
     * 
     * @param {Object} userData - The user data to be updated.
     * @param {string} cID - The client ID.
     * @param {string} primaryKey - The primary key of the client.
     * @returns {Promise<Object>} - Returns an object containing the status and message.
     * @throws {Error} - Throws an error if there is an issue with updating the client information.
     */
    async editClient(userData, cID, primaryKey) {
        try {
            // No cID or primary key, throw an error
            if (!cID || !primaryKey) throw new Error('No cID or primaryKey provided.');

            // Open idb db
            const db = await this.#indexed.openDBPromise();

            // Set up the transaction
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.EDITCLIENT,
            ], 'readwrite');

            // Get a list of all the clients with the specified ID, so we can update all instances properly
            const clientInfo = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);

            await Promise.all([
                ...clientInfo.map(client => {
                    const newClientData = {
                        ...userData,
                        horses: clientInfo[0].horses || [],
                        cID: parseInt(cID, 10),
                        primaryKey: parseInt(primaryKey, 10),
                    };

                    this.#log('NewClientData: ', newClientData);

                    // If the primaryKey doesn't match the current client, update the appointment time, trim cycle, and trim date
                    if (parseInt(client.primaryKey, 10) !== parseInt(primaryKey, 10)) {
                        Object.assign(newClientData, {
                            trim_cycle: client.trim_cycle,
                            trim_date: client.trim_date,
                            app_time: client.app_time,
                            primaryKey: parseInt(client.primaryKey, 10)
                        });
                    }

                    return this.#indexed.putStorePromise(db, newClientData, this.#indexed.stores.CLIENTLIST, false, tx);
                }),

                // Add the user date to the backup store
                this.#indexed.putStorePromise(db, {
                    ...userData,
                    edit_client: true,
                    cID,
                    primaryKey,
                }, this.#indexed.stores.EDITCLIENT, false, tx)
            ]);

            // Reset the cache after successful update
            this.#clientList = null;
            this.#initialized = false;

            return true;  // Just return success status
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(error, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    async deleteClient(cID, primaryKey) {
        try {
            if (!primaryKey || !cID) throw new Error('No primary key or cID provided.');

            primaryKey = parseInt(primaryKey, 10);

            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.DELETECLIENT,
            ], 'readwrite');

            const clients = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);
            const clientName = clients[0]?.client_name;

            const deletePromises = clients.map(client => {
                this.#indexed.deleteRecordPromise(client.primaryKey, this.#indexed.stores.CLIENTLIST, tx);
                this.#indexed.deleteRecordPromise(client.cID, this.#indexed.stores.TRIMMING, tx);
            });

            // Add backup data for server processing
            const backupData = {
                delete_client: true,
                client_name: clientName,
                cID,
            };

            deletePromises.push(this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.DELETECLIENT, false, tx));

            await Promise.all(deletePromises);

            return { status: true, msg: 'Client has been removed.', type: 'delete-client' };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    async addDuplicateClient(userData) {
        try {
            const { app_time: appTime, select_client: selectClient, next_trim_date: nextTrimDate, trim_cycle: trimCycle } = userData;
            const primaryKey = parseInt(selectClient.split(':')[0], 10);

            // Get the next primaryKey to duplicate this client
            const newPrimaryKey = await this.#indexed.getLastKeyForID({ store: this.#indexed.stores.MAXCLIENTPRIMARYKEY });

            const db = await this.#indexed.openDBPromise();

            // Set up the transaction
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.ADDDUPLICATECLIENT,
                this.#indexed.stores.MAXCLIENTPRIMARYKEY,
            ], 'readwrite');

            // Get the client information
            const clientInfo = await this.#indexed.getStorePromise(db, this.#indexed.stores.CLIENTLIST, parseInt(primaryKey, 10), tx);

            const newClient = {
                ...clientInfo,
                primaryKey: newPrimaryKey,
                app_time: appTime,
                trim_date: nextTrimDate,
                trim_cycle: trimCycle,
            }

            const backupData = {
                ...newClient,
                add_duplicateClient: true,
            }

            await Promise.all([
                this.#indexed.addStorePromise(db, newClient, this.#indexed.stores.CLIENTLIST, false, tx),
                this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.ADDDUPLICATECLIENT, false, tx),
                this.#indexed.putStorePromise(db, { primaryKey: newPrimaryKey }, this.#indexed.stores.MAXCLIENTPRIMARYKEY, true, tx),
            ]);
            // return true if all promises resolve
            return true;
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    async deleteDuplicateClient(primaryKey) {
        try {
            if (!primaryKey) throw new Error('No primary key provided.');

            if(typeof primaryKey === 'string') primaryKey = parseInt(primaryKey, 10);

            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.DELETEDUPLICATECLIENT,
            ], 'readwrite');

            const backupData = {
                'delete_duplicate_client': true,
                primaryKey,
            };

            await Promise.all([
                this.#indexed.deleteRecordPromise(primaryKey, this.#indexed.stores.CLIENTLIST, tx),
                this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.DELETEDUPLICATECLIENT, false, tx),
            ]);

            return true;
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    async getClientHorses({ primaryKey }) {
        try {
            if (!primaryKey) throw new Error('No primaryKey provided.');

            const clientInfo = await this.getClientInfo({ primaryKey });
            return clientInfo?.horses || [];
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Adds a new horse to the client's horse list in the IndexedDB.
     * @param {string} horseName - The name of the horse.
     * @param {string} cID - The client ID.
     * @param {string} primaryKey - The primary key of the client.
     * @returns {Promise<Object>} A promise that resolves to an object containing the status and message.
     * @throws Will throw an error if the operation fails.
     */
    async addNewHorse({ userData, cID, primaryKey }) {
        try {
            if (!cID || !primaryKey) throw new Error('No cID or primaryKey provided.');

            // Get the hID for the new horse. Doing this prior to the transaction to prevent transaction finishing early
            const hID = await this.#indexed.getLastKeyForID({ store: this.#indexed.stores.MAXHORSEID });
            this.#log('New Horse ID: ', hID);
            // Set up idb transactions
            const db = await this.#indexed.openDBPromise();

            // Start the transaction
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.ADDHORSE,
                this.#indexed.stores.MAXHORSEID,
            ], 'readwrite');

            // Get all the clients information
            const clientInfo = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);
            const clientHorses = clientInfo[0]?.horses || [];

            // Add the new horse to the horse list
            const newHorse = {
                hID: hID,
                horse_name: userData.horse_name,
                horse_type: userData.horse_type,
                service_type: userData.service_type,
                trim_cycle: userData.trim_cycle
            };
            clientHorses.push(newHorse);

            await Promise.all([
                ...clientInfo.map(client => this.#indexed.putStorePromise(db, { ...client, horses: clientHorses }, this.#indexed.stores.CLIENTLIST, false, tx)),
                this.#indexed.putStorePromise(db, { ...newHorse, add_newHorse: true, cID }, this.#indexed.stores.ADDHORSE, false, tx),
                this.#indexed.putStorePromise(db, { hID }, this.#indexed.stores.MAXHORSEID, true, tx),
            ]);

            // Reset the cache after successful update
            this.#clientList = null;
            this.#initialized = false;

            return true;
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Edits a horse's information in the client's horse list in the IndexedDB.
     * @param {number} hID - The horse ID.
     * @param {string} cID - The client ID.
     * @param {string} horseName - The new name of the horse.
     * @returns {Promise<boolean>} A promise that resolves to an object containing the status and message.
     * @throws Will throw an error if the operation fails.
     */
    async editClientHorse({ cID, userData }) {
        try {
            console.log('cID: ', cID);
            console.log('typof cID: ', typeof cID);
            console.log('userData: ', userData);

            const { hID, ...updatedUserData } = userData;
            const hID = parseInt(hID, 10);

            if (isNaN(hID) || !cID) throw new Error('No horse id or client id provided.');
            return true;
            // Set up the transaction
            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.EDITHORSE
            ], 'readwrite');

            const clientInfo = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);
            const clientName = clientInfo[0]?.client_name;

            await Promise.all([
                // Update all the client horses
                ...clientInfo.map(client => {
                    const updatedHorses = client.horses.map(horse => {
                        if (horse.hID === hID) {
                            return { ...horse, hID: hID, ...updatedUserData };
                        }
                        return horse;
                    });

                    return this.#indexed.putStorePromise(db, { ...client, horses: updatedHorses }, this.#indexed.stores.CLIENTLIST, false, tx);
                }),
                // Add the horse data to the EDITHORSE object store
                this.#indexed.putStorePromise(db, { edit_clientHorse: true, hID, ...updatedUserData }, this.#indexed.stores.EDITHORSE, false, tx),

            ]);

            // Reset the cache after successful update
            this.#clientList = null;
            this.#initialized = false;

            return true;
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Deletes a horse from the client's horse list in the IndexedDB.
     * @param {number} hID - The horse ID.
     * @param {string} cID - The client ID.
     * @returns {Promise<Object>} A promise that resolves to an object containing the status and message.
     * @throws Will throw an error if the operation fails.
     */
    async deleteClientHorse({ hID, cID }) {
        try {
            if (!hID || !cID) throw new Error('No horse id or client id provided.');

            // Convert the horse id and cID to a number
            if (typeof hID === 'string') {
                hID = Number(hID);
            }

            if (typeof cID === 'string') {
                cID = Number(cID);
            }

            // Set up the transaction
            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.DELETEHORSE
            ], 'readwrite');

            const clientInfo = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);
            const clientName = clientInfo[0]?.client_name;

            // Store the promises
            const updatePromises = [];

            // Loop through each client
            for (const client of clientInfo) {
                const updatedHorses = client.horses.filter(horse => horse.hID !== Number(hID));

                const updatedClient = { ...client, horses: updatedHorses };

                // Update the client information
                updatePromises.push(this.#indexed.putStorePromise(db, updatedClient, this.#indexed.stores.CLIENTLIST, false, tx));
            }

            // Add the horse data to the DELETEHORSE object store
            const deleteHorseData = { hID, cID, delete_clientHorse: true, client_name: clientName };
            updatePromises.push(this.#indexed.putStorePromise(db, deleteHorseData, this.#indexed.stores.DELETEHORSE, false, tx));

            // Wait for all promises to resolve
            await Promise.all(updatePromises);

            // Handle transaction error
            tx.onerror = (err) => {
                console.error('Transaction failed:', err);
                throw new Error('Transaction failed: ' + err.target.error);
            };

            // Reset the cache after successful update
            this.#clientList = null;
            this.#initialized = false;

            return true;
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Retrieves the client schedule list from the IndexedDB.
     * @returns {Promise<Array>} A promise that resolves to an array of client information.
     * @throws Will throw an error if the operation fails.
     */
    async getClientScheduleList() {
        try {
            const db = await this.#indexed.openDBPromise();
            const clientList = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.CLIENTLIST);
            return clientList || [];
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Get the client schedule by trim dates
     * @param {string} trimDate - The trim date
     * @returns {Promise<Array>} A promise that resolves to an array of client information.
     */
    async getClientScheduleByTrimDate(trimDate) {
        try {
            this.#log('In getClientScheduleByTrimDate: trimDate: ', trimDate);
            const db = await this.#indexed.openDBPromise();
            const clientList = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'trim_date', trimDate);
            this.#log('In getClientScheduleByTrimDate: clientList: ', clientList);
            return clientList || [];
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Retrieves all the client's trimming information from the IndexedDB.
     * @returns {Promise<Array>} A promise that resolves to an array of client trimming information.
     * @throws Will throw an error if the operation fails.
     */
    async getAllClientsTrimmingInfo() {
        try {
            const db = await this.#indexed.openDBPromise();
            const clientTrimmingInfo = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.TRIMMING);
            return clientTrimmingInfo?.trimmings || [];
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    /**
     * Retrieves a specific clients trimming information from the IndexedDB.
     * 
     * @param {Number} cID - The client ID.
     * @returns {Promise<Array>} A promise that resolves to an array of client trimming information.
     * @throws Will throw an error if the operation fails.
     */
    async getClientTrimmingInfo(cID) {
        try {
            cID = typeof cID === 'string' ? parseInt(cID, 10) : cID;
            
            const db = await this.#indexed.openDBPromise();
            const trimmingInfo = await this.#indexed.getStorePromise(db, this.#indexed.stores.TRIMMING, cID);
            return trimmingInfo?.trimmings || [];
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            });
            return [];
        }
    }

    async updateClientSchedule({ cID, primaryKey, userData }) {
        try {
            console.log('cID: ', cID);
            console.log('primaryKey: ', primaryKey);
            if (!cID || !primaryKey || !userData) throw new Error('No cID, primaryKey, or userData provided.');

            // Destructure userData
            const { next_trim_date, app_time, ...userDataRest } = userData;

            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.EDITCLIENT
            ], 'readwrite');

            const promises = [];

            const clientInfo = await this.#indexed.getStorePromise(db, this.#indexed.stores.CLIENTLIST, parseInt(primaryKey, 10), tx);

            const newClientInfo = {
                ...clientInfo,
                app_time,
                trim_date: next_trim_date,
            }

            await Promise.all([
                this.#indexed.putStorePromise(db, newClientInfo, this.#indexed.stores.CLIENTLIST, false, tx),
                this.#indexed.putStorePromise(db, { ...newClientInfo, edit_client: true, cID: parseInt(cID, 10), primaryKey: parseInt(primaryKey, 10) }, this.#indexed.stores.EDITCLIENT, false, tx)
            ]);

            // Reset the cache after successful update
            this.#clientList = null;
            this.#initialized = false;

            return true;
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.min.js');
            AppError.handleError(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: 'We had an issue updating the client\'s new schedule. Update their schedule through the edit client and please report this issue.',
            }, true);
            return false;
        }
    }

    async updateClientData(newData) {
        try {
            // Update IDB
            await this.#performDatabaseUpdate(newData);

            // Update cache
            this.#clientList = null;
            this.#initialized = false;

            return true;
        }
        catch (error) {
            const { AppError } = await import('../../core/errors/models/AppError.min.js');
            throw new AppError('Failed to update client data', {
                originalError: error,
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
                shouldLog: true
            });
        }
    }

    /**
     * Performs database update operations
     * @private
     */
    async #performDatabaseUpdate(data) {
        const db = await this.#indexed.openDBPromise();
        const tx = db.transaction([this.#indexed.stores.CLIENTLIST], 'readwrite');

        await this.#indexed.putStorePromise(db, data, this.#indexed.stores.CLIENTLIST, false, tx);

        return true;
    }
}