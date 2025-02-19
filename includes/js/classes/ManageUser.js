import IndexedDBOperations from "./IndexedDBOperations.js";

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
        catch (err) {
            const { handleError } = await import("../utils/error-messages/handleError.js");
            await handleError({
                filename: 'initializeSettingsError',
                consoleMsg: 'Settings initialization error: ',
                err,
                userMsg: 'Unable to initialize settings',
                errorEle: 'page-msg'
            });
            throw err;
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
                : keys.reduce((acc, key) => {
                    acc[key] = this.#settings[key];
                    return acc;
                }, {});
        }
        catch (err) {
            const { handleError } = await import("../utils/error-messages/handleError.js");
            await handleError({
                filename: 'getSettingsError',
                consoleMsg: 'Get settings error: ',
                err,
                userMsg: 'Unable to retrieve settings',
                errorEle: 'page-msg'
            });
            return null;
        }
    }

    /**
     * Gets the date/time options for the user
     * @returns {Promise<Object|null>} Date/time options or null if not available
     */
    async getDateTimeOptions() {
        const { date_time } = await this.getSettings('date_time') ?? {};
        return date_time ?? null;
    }

    /**
     * Gets the mileage charges configuration
     * @returns {Promise<Object|null>} Mileage charges or null if not available
     */
    async getMileageCharges() {
        const { mileage_charges } = await this.getSettings('mileage_charges') ?? {};
        if (!mileage_charges) return null;

        const { per_mile: perMile = {}, range = [] } = mileage_charges;
        
        if (perMile.cost_per_mile != null && perMile.starting_mile != null) {
            return perMile;
        }

        return range.length > 0 ? range : null;
    }

    // Other getters can be similarly simplified
    async getFarrierPrices() {
        const { farrier_prices } = await this.getSettings('farrier_prices') ?? {};
        return farrier_prices ?? null;
    }

    async getScheduleOptions() {
        const { schedule_options } = await this.getSettings('schedule_options') ?? {};
        return schedule_options ?? null;
    }

    /**
     * Gets color theme options for the user interface
     * @returns {Promise<Object|null>} Color options or null if not available
     */
    async getColorOptions() {
        const { color_options } = await this.getSettings('color_options') ?? {};
        return color_options ?? null;
    }

    /**
     * Gets dates marked as unavailable by the user
     * @returns {Promise<Array|null>} Array of blocked dates or null if none found
     */
    async getUserBlockedDates() {
        const { blocked_dates } = await this.getSettings('blocked_dates') ?? {};
        return blocked_dates ?? null;
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
        catch (err) {
            const { handleError } = await import("../utils/error-messages/handleError.js");
            await handleError({
                filename: 'updateLocalUserSettingsError',
                consoleMsg: 'Update local user settings error: ',
                err,
                userMsg: 'Unable to update local user settings',
                errorEle: 'page-msg'
            });
            return false;
        }
    }

    /**
     * Updates settings and manages transactions
     * @private
     * @throws {Error} If update fails
     */
    async #updateSettings({ userData, settingsProperty, backupStore = null, backupAPITag = null, backupData = null }) {
        // getSettings already has error handling
        const userSettings = await this.getSettings();
        if (!userSettings) return false;

        userSettings[settingsProperty] = userData;
        
        try {
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
        catch (err) {
            const { handleError } = await import("../utils/error-messages/handleError.js");
            await handleError({
                filename: 'updateSettingsError',
                consoleMsg: 'Settings update error: ',
                err,
                userMsg: 'Unable to update settings',
                errorEle: 'page-msg'
            });
            throw err;
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
            const { handleError } = await import("../utils/error-messages/handleError.js");
            await handleError({
                filename: 'manageIDBTransactionsError',
                consoleMsg: 'Manage IDB transactions error: ',
                err,
                userMsg: 'Unable to manage IDB transactions',
                errorEle: 'page-msg'
            });
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
        catch (err) {
            const { handleError } = await import("../utils/error-messages/handleError.js");
            await handleError({
                filename: 'backupDataError',
                consoleMsg: 'Backup data error: ',
                err,
                userMsg: 'Unable to backup data',
                errorEle: 'page-msg'
            });
            throw err;
        }
    }
}