import IndexedDBOperations from "../../../core/database/IndexedDBOperations.js";

/**
 * Manages user-related operations and settings using IndexedDB
 */
export default class ManageUser {
    #settings = null;
    #initialized = false;
    #indexed;

    constructor() {
        this.#indexed = new IndexedDBOperations();
    }

    /**
     * Initialize settings cache from IndexedDB
     * @private
     * @throws {Error} If initialization fails
     */
    async #initializeSettings() {
        if (this.#initialized) return;

        try {
            const db = await this.#indexed.openDBPromise();
            const userSettings = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.USERSETTINGS);
            this.#settings = userSettings?.length === 1 ? userSettings[0] : null;
            this.#initialized = true;
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
            await this.#initializeSettings();
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
        try{
            const db = await this.#indexed.openDBPromise();
            const personalNotes = await this.#indexed.getAllStorePromise(db, this.#indexed.stores.PERSONALNOTES);
            return personalNotes ?? null;
        }
        catch(err){
            throw err;
        }
    }

    /**
     * Updates user settings and manages related data backups
     * @param {Object} params - Update parameters
     * @param {*} params.userData - New data to store
     * @param {string} params.settingsProperty - Property name to update
     * @param {string} [params.backupStore] - Optional store name for backup
     * @param {string} [params.backupAPITag] - Optional API tag for backup
     * @param {*} [params.backupData] - Optional backup data
     * @returns {Promise<boolean>} Success status of the update
     */
    async updateLocalUserSettings({ userData, settingsProperty, backupStore = null, backupAPITag = null, backupData = null }) {
        try {
            const result = await this.#updateSettings({ userData, settingsProperty, backupStore, backupAPITag, backupData });
            if (result) {
                this.#settings = null;
                this.#initialized = false;
            }
            return result;
        }
        catch (error) {
            // Just throw - let the boss (dateTimeJS) handle it
            throw error;
        }
    }

    /**
     * Updates settings and manages transactions
     * @private
     * @throws {Error} If update fails
     */
    async #updateSettings({ userData, settingsProperty, backupStore = null, backupAPITag = null, backupData = null }) {
        try {
            let userSettings = await this.getSettings();

            // If there are no user settings, then we to build the structure
            if (!userSettings) {
                // Dynamically import the userSettingsDataStructure.js file and then set the userSettings to that structure
                const { default: userSettingsDataStructure } = await import("../components/userSettingsDataStructure.js");
                const setUserSettings = userSettingsDataStructure();
                
                const db = await this.#indexed.openDBPromise();
                await this.#indexed.putStorePromise(db, setUserSettings, this.#indexed.stores.USERSETTINGS);
                // Get all of the user's settings
                userSettings = setUserSettings;

                // Reset the cache so next getSettings() will fetch fresh content
                this.#settings = null;
                this.#initialized = false;
            }

            userSettings[settingsProperty] = userData;
            
            // This operation needs error handling
            await this.#manageIDBTransactions({
                userData,
                userSettings,
                backupStore,
                backupAPITag,
                backupData
            });
            return true;
        }
        catch (error) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            // Process because private method, let public method handle
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
    async #manageIDBTransactions({
        userData,
        userSettings,
        backupStore = null,
        backupAPITag = null,
        backupData = null
    }) {
        try {
            const db = await this.#indexed.openDBPromise();
            const [clearResult, putResult] = await Promise.all([
                this.#indexed.clearStorePromise(db, this.#indexed.stores.USERSETTINGS),
                this.#indexed.putStorePromise(db, userSettings, this.#indexed.stores.USERSETTINGS)
            ]);

            if (backupStore && backupAPITag) {
                await this.#backupData(userData, backupStore, backupAPITag, backupData);
            }

            return true;
        }
        catch (err) {
            // Just throw - parent will handle
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
}