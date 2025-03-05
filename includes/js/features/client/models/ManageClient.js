import IndexedDBOperations from '../../../core/database/IndexedDBOperations.js';

export default class ManageClient {
    #indexed;
    #clientList = null;
    #initialized = false;
    #trimmingInfo = null;

    constructor() {
        this.#indexed = new IndexedDBOperations();
    }

    async #initializeClientData() {
        if (this.#initialized) return;

        try {
            const db = await this.#indexed.openDBPromise();
            this.#clientList = await this.#indexed.getAllStorePromise( db, this.#indexed.stores.CLIENTLIST);
            this.#initialized = true;
        }
        catch (error) {
            const { AppError } = await import("../../../core/errors/models/AppError.js");
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
        return this.#clientList.find(client => 
            client.primaryKey === parseInt(primaryKey, 10)
        );
    }

    /**
     * Retrieves all duplicate clients
     * @returns {Promise<Array<Object>>} Array of duplicate clients
     * @throws {Error} If database operation fails
     */
    async getAllDuplicateClients() {
        try {
            const db = await this.#indexed.openDBPromise();
            const clientInfo = await this.#indexed.getAllStorePromise( db, this.#indexed.stores.CLIENTLIST );

            return this.#findDuplicates(clientInfo);
        }
        catch (err) {
            const { AppError } = await import("../../../core/errors/models/AppError.js");
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
            if (!userData) throw new Error('No user data provided.');

            // Get the cID and primary key concurrently
            const [cID, primaryKey] = await Promise.all([
                this.#indexed.getLastKeyForID(this.#indexed.stores.MAXCLIENTID),
                this.#indexed.getLastKeyForID(this.#indexed.stores.MAXCLIENTPRIMARYKEY)
            ]);

            // Add the cID and primary key to the userData
            userData.cID = cID;
            userData.primaryKey = primaryKey;

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
                this.#indexed.putStorePromise(db, userData, this.#indexed.stores.ADDCLIENT, false, tx),
                this.#indexed.putStorePromise(db, { cID }, this.#indexed.stores.MAXCLIENTID, true, tx),
                this.#indexed.putStorePromise(db, { primaryKey }, this.#indexed.stores.MAXCLIENTPRIMARYKEY, true, tx)
            ]);

            return true;  // Just return success status
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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

            // Get the client information and the horses
            const clientInfo = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);

            await Promise.all([
                ...clientInfo.map(client => {
                    const newClientData = {
                        ...userData,
                        horses: clientInfo[0].horses || [],
                        cID,
                        primaryKey,
                    };

                    if (client.primaryKey !== primaryKey) {
                        Object.assign(newClientData, {
                            trim_cycle: client.trim_cycle,
                            trim_date: client.trim_date,
                            app_time: client.app_time,
                            primaryKey: client.primaryKey
                        });
                    }

                    return this.#indexed.putStorePromise(db, newClientData, this.#indexed.stores.CLIENTLIST, false, tx);
                }),
                this.#indexed.putStorePromise(db, {
                    ...userData,
                    edit_client: true,
                    cID,
                    primaryKey,
                }, this.#indexed.stores.EDITCLIENT, false, tx)
            ]);

            return true;  // Just return success status

        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    async addDuplicateClient(userData) {
        try {
            const { app_time, duplicate_client: primaryKey, next_trim_date, trim_cycle } = userData;

            // Get the next primaryKey for this client
            const newPrimaryKey = await this.#indexed.getLastKeyForID(this.#indexed.stores.MAXCLIENTPRIMARYKEY);

            const db = await this.#indexed.openDBPromise();

            // Set up the transaction
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.ADDDUPLICATECLIENT,
                this.#indexed.stores.MAXCLIENTPRIMARYKEY,
            ], 'readwrite');

            const promises = [];

            // Get the client information
            const clientInfo = await this.#indexed.getStorePromise(db, this.#indexed.stores.CLIENTLIST, parseInt(primaryKey, 10), tx);

            const newClient = {
                ...clientInfo,
                primaryKey: newPrimaryKey,
                app_time,
                trim_date: next_trim_date,
                trim_cycle
            }

            // Add the new client to the object store
            promises.push(this.#indexed.addStorePromise(db, newClient, this.#indexed.stores.CLIENTLIST, false, tx));

            // Add the api identifier
            newClient.add_duplicateClient = true;

            // Add the duplicate client to it's object store
            promises.push(this.#indexed.putStorePromise(db, newClient, this.#indexed.stores.ADDDUPLICATECLIENT, false, tx));

            // Add the max primary key
            promises.push(this.#indexed.putStorePromise(db, { primaryKey: newPrimaryKey }, this.#indexed.stores.MAXCLIENTPRIMARYKEY, true, tx));

            await Promise.all(promises);

            // return true if all promises resolve
            return { status: 'success', msg: `${clientInfo.client_name} has been duplicated successfully.` };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
        }
    }

    async deleteDuplicateClient(userData) {
        try {
            if (!primaryKey) throw new Error('No primary key provided.');

            userData.primaryKey = parseInt(primaryKey, 10);

            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.DELETEDUPLICATECLIENT,
            ], 'readwrite');

            const backupData = {
                ...userData,
            };

            const promises = [];

            promises.push(this.#indexed.deleteRecordPromise(userData.primaryKey, this.#indexed.stores.CLIENTLIST, tx));
            promises.push(this.#indexed.putStorePromise(db, backupData, this.#indexed.stores.DELETEDUPLICATECLIENT, false, tx));

            await Promise.all(promises);

            return { status: true, msg: 'Duplicate client has been removed.' };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
    async addNewHorse(horseName, cID, primaryKey) {
        try {
            if (!cID || !primaryKey) throw new Error('No cID or primaryKey provided.');
            // Get the hID for the new horse. Doing this prior to the transaction to prevent transaction finishing early
            const hID = await this.#indexed.getLastKeyForID(this.#indexed.stores.MAXHORSEID);

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
            const clientName = clientInfo[0]?.client_name;

            // Check for duplicate horses. This is redundant as there is an event listener for real time checking on the page as well.
            if (clientHorses.some(horse => horse.horse_name.toLowerCase() === horseName.toLowerCase())) {
                return { status: false, msg: `${horseName} is already listed.` };
            }

            // Add the new horse to the horse list
            const newHorse = { hID, horse_name: horseName };
            clientHorses.push(newHorse);

            const updatePromises = [];

            // Loop through each client
            for (const client of clientInfo) {
                // Update the horse list for each client
                const updatedUserData = { ...client, horses: clientHorses };

                // Update the client information
                updatePromises.push(this.#indexed.putStorePromise(db, updatedUserData, this.#indexed.stores.CLIENTLIST, false, tx));
            }

            // Add the api tag for backup
            const backupHorses = { add_newHorse: true, horse_name: horseName, client_name: clientName, cID, hID };
            updatePromises.push(this.#indexed.putStorePromise(db, backupHorses, this.#indexed.stores.ADDHORSE, false, tx));

            // Put the new horse id back in the max horse id
            updatePromises.push(this.#indexed.putStorePromise(db, { hID }, this.#indexed.stores.MAXHORSEID, true, tx));

            // Wait for all promises to resolve
            await Promise.all(updatePromises);

            return { status: true, msg: `${horseName} has been added.` };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
     * @returns {Promise<Object>} A promise that resolves to an object containing the status and message.
     * @throws Will throw an error if the operation fails.
     */
    async editClientHorse(hID, cID, horseName) {
        try {
            if (!hID || !cID) throw new Error('No horse id or client id provided.');

            // Convert the horse id to a number
            if (typeof hID === 'string') {
                hID = Number(hID);
            }

            // Set up the transaction
            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.EDITHORSE
            ], 'readwrite');

            const clientInfo = await this.#indexed.getAllStoreByIndexPromise(db, this.#indexed.stores.CLIENTLIST, 'cID', cID, tx);
            const clientName = clientInfo[0]?.client_name;

            // Store the promises
            const updatePromises = [];

            // Loop through each client
            for (const client of clientInfo) {
                const updatedHorses = client.horses.map(horse => {
                    if (horse.hID === Number(hID)) {
                        return { ...horse, horse_name: horseName };
                    }
                    return horse;
                });

                const updatedClient = { ...client, horses: updatedHorses };

                // Update the client information
                updatePromises.push(this.#indexed.putStorePromise(db, updatedClient, this.#indexed.stores.CLIENTLIST, false, tx));
            }

            // Add the horse data to the EDITHORSE object store
            const editHorseData = { hID, cID, horse_name: horseName, edit_clientHorse: true, client_name: clientName };
            updatePromises.push(this.#indexed.putStorePromise(db, editHorseData, this.#indexed.stores.EDITHORSE, false, tx));

            // Wait for all promises to resolve
            await Promise.all(updatePromises);

            return { status: true, msg: `${horseName} has been updated.` };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
    async deleteClientHorse(hID, cID) {
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
                this.#indexed.stores.DELETEHORSE // Ensure DELETEHORSE store is correctly referenced
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

            // Commit the transaction
            tx.oncomplete = () => {
                console.log('Transaction completed successfully.');
            };

            // Handle transaction error
            tx.onerror = (err) => {
                console.error('Transaction failed:', err);
                throw new Error('Transaction failed: ' + err.target.error);
            };

            return { status: true, msg: `Horse has been deleted.` };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
            const { AppError } = await import('../../../core/errors/models/AppError.js');
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
            const db = await this.#indexed.openDBPromise();
            const trimmingInfo = await this.#indexed.getStorePromise(db, this.#indexed.stores.TRIMMING, cID);
            return trimmingInfo?.trimmings || [];
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
            return [];
        }
    }

    async updateClientSchedule(userData) {
        try {
            // Destructure userData
            const { next_trim_date, app_time, ...userDataRest } = userData;

            const db = await this.#indexed.openDBPromise();
            const tx = db.transaction([
                this.#indexed.stores.CLIENTLIST,
                this.#indexed.stores.EDITCLIENT
            ], 'readwrite');

            const promises = [];

            const clientInfo = await this.#indexed.getStorePromise(db, this.#indexed.stores.CLIENTLIST, userData.primaryKey, tx);

            const newClientInfo = {
                ...clientInfo,
                app_time,
                trim_date: next_trim_date,
            }

            // Update the client information
            promises.push(this.#indexed.putStorePromise(db, newClientInfo, this.#indexed.stores.CLIENTLIST, false, tx));

            // Add the api identifier
            newClientInfo.edit_client = true;

            // Add the edit client to the backup store
            promises.push(this.#indexed.putStorePromise(db, newClientInfo, this.#indexed.stores.EDITCLIENT, false, tx));

            // Wait for all promises to resolve
            await Promise.all(promises);

            return { status: true, msg: 'Client schedule updated successfully.' };
        }
        catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.process(err, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: null,
            }, true);
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
            const { AppError } = await import('../../core/errors/models/AppError.js');
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
        
        await this.#indexed.putStorePromise(
            db, 
            data, 
            this.#indexed.stores.CLIENTLIST, 
            false, 
            tx
        );
        
        return true;
    }
}