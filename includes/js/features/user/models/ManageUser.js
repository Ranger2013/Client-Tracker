import IndexedDBOperations from "../../../core/database/IndexedDBOperations.js";

/**
 * Manages user-related operations and settings using IndexedDB
 */
export default class ManageUser {
    // Static private property to hold the singleton instance
    static #instance = null;

    // Instance private properties
    #settings = null;
    #initialized = false;
    #indexed;
    #debug = false; // Debug flag - off by default

    constructor(options = { debug: false }) {
        // If an instance already exists, return it
        if (ManageUser.#instance) {
            // Optionally update debug setting if passed
            if (options.debug !== undefined) {
                ManageUser.#instance.setDebugMode(options.debug);
            }
            return ManageUser.#instance;
        }

        // First-time initialization
        this.#indexed = new IndexedDBOperations();
        this.#debug = options.debug || false;

        // Store this instance as the singleton
        ManageUser.#instance = this;

        this.#log('ManageUser singleton instance created.');
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
            console.log(`[ManageUser]`, ...args);
        }
    }

    /**
     * Initialize settings cache from IndexedDB
     * @private
     * @throws {Error} If initialization fails
     */
    async #initializeSettings() {
        this.#log('Is this.#initialized: ', this.#initialized);
        if (this.#initialized) return;

        try {
            const db = await this.#indexed.openDBPromise();
            const userSettings = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.USERSETTINGS);
            this.#log('In #initializeSettings: userSettings: ', userSettings);
            this.#settings = userSettings?.length === 1 ? userSettings[0] : null;
            this.#initialized = true;
            this.#log('In #initializeSettings: #settings set: ', this.#settings);
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            // Process because this is a worker, let parent handle display
            await AppError.process(error, {
                errorCode: AppError.Types.INITIALIZATION_ERROR,
                userMessage: AppError.BaseMessages.system.generic,
                shouldLog: true
            }, true);
        }
    }

    /**
     * Get user settings, optionally filtered by specific properties
     * @param {...string} keys - Property names to retrieve. If empty, returns all settings
     * @returns {Promise<Object>} Requested settings object
     * @example
     * // Get multiple properties
     * const { date_time, farrier_prices } = await getSettings('date_time', 'farrier_prices');
     */
    async getSettings(...keys) {
        try {
            this.#log('In getSettings: keys: ', keys);
            await this.#initializeSettings();
            this.#log('In getSettings: this.#settings', this.#settings);
            if (!this.#settings) return null;

            return keys.length === 0
                ? this.#settings
                : keys.filter(key => this.#settings[key] != null)
                    .reduce((acc, key) => ({ ...acc, [key]: this.#settings[key] }), {});
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            // Process - let caller handle display
            await AppError.process(error, {
                errorCode: AppError.Types.SETTINGS_ERROR,
                userMessage: AppError.BaseMessages.system.server,
                shouldLog: true
            }, true);
        }
    }

    /**
     * Gets the date/time options for the user
     * @returns {Promise<Object|null>} Date/time options or null if not available
     */
    async getDateTimeOptions() {
        try {
            const { date_time } = await this.getSettings('date_time') ?? {};
            return date_time ?? null;
        }
        catch (error) {
            // Just throw - parent getSettings already processed the error
            throw error;
        }
    }

    /**
     * Gets the mileage charges configuration
     * @returns {Promise<Object|null>} Mileage charges or null if not available
     */
    async getMileageCharges() {
        try {
            const { mileage_charges } = await this.getSettings('mileage_charges') ?? {};
            const { per_mile: perMile, range } = mileage_charges ?? {};

            // Check if per_mile has valid data
            if (perMile?.cost_per_mile != null && perMile?.starting_mile != null) {
                return perMile;
            }

            // Return range array if it has entries, null otherwise
            return range?.length > 0 ? range : null;
        }
        catch (error) {
            // Just throw - parent getSettings already processed the error
            throw error;
        }
    }

    // Other getters can be similarly simplified
    async getFarrierPrices() {
        try {

            const { farrier_prices } = await this.getSettings('farrier_prices') ?? {};
            return farrier_prices ?? null;
        }
        catch (error) {
            // Just throw - parent getSettings already processed the error
            throw error;
        }
    }

    async getScheduleOptions() {
        try {
            const { schedule_options } = await this.getSettings('schedule_options') ?? {};
            return schedule_options ?? null;
        }
        catch (error) {
            // Just throw - parent getSettings already processed the error
            throw error;
        }
    }

    /**
     * Gets color theme options for the user interface
     * @returns {Promise<Object|null>} Color options or null if not available
     */
    async getColorOptions() {
        try {
            const { color_options } = await this.getSettings('color_options') ?? {};
            return color_options ?? null;
        }
        catch (error) {
            // Just throw - parent getSettings already processed the error
            throw error;
        }
    }

    /**
     * Gets dates marked as unavailable by the user
     * @returns {Promise<Array|null>} Array of blocked dates or null if none found
     */
    async getUserBlockedDates() {
        try {
            const { blocked_dates } = await this.getSettings('blocked_dates') ?? {};
            return blocked_dates ?? null;
        }
        catch (error) {
            // Just throw - parent getSettings already processed the error
            throw error;
        }
    }

    /**
     * Gets the user's Personal Notes from the personal_notes object store
     * @returns {Promise<Array|null>} Array of personal notes or null if none found
     */
    async getUserPersonalNotes() {
        try {
            const db = await this.#indexed.openDBPromise();
            const personalNotes = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.PERSONALNOTES);
            return personalNotes ?? null;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Updates user settings and manages related data backups
     * @param {Object} params - Update parameters
     * @param {*} params.userData - New data to store
     * @param {string} params.settingsProperty - Property name to update
     * @param {boolean} [params.waitForCompletion] - Whether to wait for transaction completion
     * @returns {Promise<boolean>} Success status of the update
     */
    async updateLocalUserSettings({ userData, settingsProperty, backupStore, backupAPITag, waitForCompletion = false }) {
        try {
            this.#log('UpdateLocalUserSettings: userData: ', userData);
            this.#log('UpdateLocalUserSettings: settingsProperty: ', settingsProperty);

            // Force settings refresh before update
            await this.#initializeSettings();
            
            const result = await this.#updateSettings({ 
                userData, 
                settingsProperty,
                backupStore,
                backupAPITag,
                waitForCompletion 
            });

            if (result) {
                // Force a complete refresh of settings
                this.#settings = null;
                this.#initialized = false;
                if (waitForCompletion) {
                    // Verify the update by reading it back
                    await this.#initializeSettings();
                    const verified = this.#settings && 
                                   this.#settings[settingsProperty] &&
                                   JSON.stringify(this.#settings[settingsProperty]) === JSON.stringify(userData);
                    if (!verified) {
                        throw new Error(`Failed to verify update for ${settingsProperty}`);
                    }
                }
            }
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Updates settings and manages transactions
     * @private
     * @throws {Error} If update fails
     */
    async #updateSettings({ userData, settingsProperty, backupStore, backupAPITag, waitForCompletion }) {
        try {
            let userSettings = await this.getSettings();
            this.#log('User Settings from IDB: userSettings: ', userSettings);
            if (!userSettings) {
                const { default: userSettingsDataStructure } = await import("../components/userSettingsDataStructure.js");
                userSettings = userSettingsDataStructure();
                this.#log('User Settings from userSettingsDataStructure: ', userSettings);
            }
            
            userSettings[settingsProperty] = userData;
            this.#log('settingsProperty: ', settingsProperty);
            this.#log('userSettings[settingsProperty]: ', userSettings[settingsProperty]);

            // Ensure transaction completes before returning
            const success = await this.#manageIDBTransactions({
                userData, 
                userSettings, // Send entire settings object
                store: this.#indexed.stores.USERSETTINGS,
                backupStore,
                backupAPITag,
                waitForCompletion
            });

            return success;
        } catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            await AppError.process(error, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: AppError.BaseMessages.system.server,
                shouldLog: true
            }, true);
        }
    }

    /**
     * Manages database transactions for settings updates
     * @private
     * @throws {Error} If transactions fail
     */
    async #manageIDBTransactions({ userData, userSettings, store, backupStore, backupAPITag, waitForCompletion }) {
        try {
            const db = await this.#indexed.openDBPromise();

            const tx = backupStore && backupAPITag ? db.transaction([
                store,
                backupStore,
            ], 'readwrite') : null;

            if(tx) {
                const backupData = {
                    [backupAPITag]: true,
                    ...userData
                };


                await Promise.all([
                    this.#indexed.putStorePromise(db, userSettings, store, true, tx),
                    this.#indexed.putStorePromise(db, backupData, backupStore, tx),
                ]);
            }
            else {
                // Use put with complete object to avoid partial updates
                await this.#indexed.putStorePromise(db, userSettings, store, true);
            }            
            
            if (waitForCompletion) {
                // Get entire store contents since we're storing whole settings object
                const verify = await this.#indexed.getAllStorePromise(db, store);
                // Compare first item since settings are stored as single object
                return verify && verify[0] && 
                       JSON.stringify(verify[0]) === JSON.stringify(userData);
            }

            return true;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Creates backup of user data in specified store
     * @private
     * @throws {Error} If backup fails
     */
    async #backupData(userData, backupStore, backupAPITag, backupData) {
        try {
            const db = await this.#indexed.openDBPromise();
            const data = backupData ?? { ...userData, [backupAPITag]: true };
            await this.#indexed.putStorePromise(db, data, backupStore, true);
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            // Process because it's a worker
            await AppError.process(error, {
                errorCode: AppError.Types.BACKUP_ERROR,
                userMessage: AppError.BaseMessages.system.backupError,
                shouldLog: true
            }, true);
        }
    }

    /**
     * Gets the store names for backup operations
     * @returns {Object} Object containing store name constants
     */
    getStoreNames() {
        return this.#indexed.stores;
    }

    async checkStoresForData(stores) {
        try {
            const db = await this.#indexed.openDBPromise();
            for (let store in stores) {
                const objectStore = await this.#indexed.getAllStorePromise(db, stores[store]);
                if (objectStore && objectStore.length > 0) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            // handleError because this is a terminal operation
            await AppError.handleError(error, {
                errorCode: AppError.Types.DATABASE_ERROR,
                userMessage: AppError.BaseMessages.system.databaseError,
                shouldLog: true
            });
            return false;
        }
    }

    async buildNewUserSettingsStructure({dataStructure}) {
        try{
            const db = await this.#indexed.openDBPromise();

            const response = await this.#indexed.putStorePromise(db, dataStructure, this.#indexed.stores.USERSETTINGS, true);
            this.#log('In buildNewUserSettingsStructure: response: ', response);
            this.#log('New user settings structure built: ', dataStructure);
        }
        catch(err){
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.process(err, {
                errorCode: AppError.Types.AUTHORIZATION_ERROR,
                userMessage: AppError.BaseMessages.system.authorization,
            }, true);
        }
    }

    async verifyPassword(password){
        try{
            const [{ fetchData }, { authAPI }, { getValidationToken }] = await Promise.all([
                import('../../../core/network/services/network.js'),
                import('../../../core/network/api/apiEndpoints.js'),
                import('../../../tracker.js')
            ]);

            const response = await fetchData({
                api: authAPI.verifyPass,
                data: { password},
                token: getValidationToken(),
            });

            return response;
        }
        catch(err){
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.process(err, {
                errorCode: AppError.Types.API_ERROR,
                userMessage: AppError.BaseMessages.system.server,
            }, true);
        }
    }
}