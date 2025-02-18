
import errorLogs from "../utils/error-messages/errorLogs.js";
import IndexedDBOperations from "./IndexedDBOperations.js";

export default class ManageUser {
	constructor() {
		this.indexed = new IndexedDBOperations();
	}

	async getUserSettings() {
		try {
			// Open idb db
			const db = await this.indexed.openDBPromise();

			// Get the user settings
			const userSettings = await this.indexed.getAllStorePromise(db, this.indexed.stores.USERSETTINGS);

			if (userSettings && userSettings.length === 1) {
				return userSettings[0];
			}
			return null;
		}
		catch (err) {
			await errorLogs('getUserSettingsError', 'Get user settings error: ', err);
			return null;
		}
	}

	/**
	 * Gets the date/time options for the user.
	 * 
	 * @returns {Promise<Object|null>} A promise that resolves to the date/time options or null if not available.
	 * @throws Will throw an error if there's an issue with getting the date/time options.
	 */
	async getDateTimeOptions() {
		try {
			// Get the user settings
			const userSettings = await this.getUserSettings();

			// userSettings is not undefined
			if (userSettings) {
				// Get the date/time options
				const dateTime = userSettings.date_time;

				// Check if we have the date_time property and if we have the sub properties for date_time
				if (dateTime && Object.keys(dateTime).length > 0) {
					// We have local date/time settings
					return dateTime;
				}
				else {
					return null;
				}
			}
		}
		catch (err) {
			await errorLogs('getDateTimeOptionsError', 'Get date time options error: ', err);
			return null;
		}
	}

	/**
	 * Retrieves the mileage charges from the user's settings.
	 * 
	 * @returns {Promise<Object|null>} - A promise that resolves to the mileage charges or null if not available.
	 */
	async getMileageCharges() {
		try {
			// Get the user's settings
			const { mileage_charges = {} } = await this.getUserSettings() || {};

			// Destructure mileage charges with default values
			const { per_mile: perMile = {}, range = [] } = mileage_charges;

			// Check if perMile or range is available
			if ((perMile.cost_per_mile == null || perMile.starting_mile == null) && range.length === 0) {
				return null;
			}

			if (perMile.cost_per_mile != null && perMile.starting_mile != null) {
				return perMile;
			}

			if (range.length > 0) {
				return range;
			}

			return null; // Explicitly return null if no conditions are met
		} catch (err) {
			const { handleError } = await import("../utils/error-messages/errorLogs.js");
			await handleError('getMileageChargesError', 'Get mileage charges error: ', err);
			return null;
		}
	}

	/**
	 * Returns an object containing the farrier prices and accessory prices.
	 * 
	 * @returns {Promise<Object|null>} - A promise that resolves to the object for farrier prices and accessory prices.
	 * @throws Will throw an error if there's an issue with getting the farrier prices.
	 */
	async getFarrierPrices() {
		try {
			// Get the user's settings
			const userSettings = await this.getUserSettings(); // The array is removed, 

			if (userSettings) {
				if (userSettings.farrier_prices && Object.keys(userSettings.farrier_prices).length > 0) {
					// Get the farrier prices
					return userSettings.farrier_prices;
				}
			}
			return null;
		}
		catch (err) {
			await errorLogs('getFarrierPricesError', 'Get farrier prices error: ', err);
			return null;
		}
	}

	async getScheduleOptions() {
		try {
			// Get the user settings
			const userSettings = await this.getUserSettings();

			if (userSettings && userSettings.schedule_options && Object.keys(userSettings.schedule_options).length > 0) {
				return userSettings.schedule_options;
			}
			return null;
		}
		catch (err) {
			await errorLogs('getScheduleOptionsError', 'Get schedule options error: ', err);
			return null;
		}
	}

	async getColorOptions() {
		try {
			// Get the user's settings
			const userSettings = await this.getUserSettings();

			if (userSettings) {
				if (userSettings.color_options && Object.keys(userSettings.color_options).length > 0) {
					return userSettings.color_options;
				}
				else {
					return null;
				}
			}
			else {
				return null;
			}
		}
		catch (err) {
			errorLogs('getColorOptionsError', 'Get color options error: ', err);
			return null;
		}
	}

	async getUserBlockedDates() {
		try {
			// Get the user's settings
			const userSettings = await this.getUserSettings();

			if (userSettings) {
				if (userSettings.blocked_dates && Object.keys(userSettings.blocked_dates).length > 0) {
					return userSettings.blocked_dates;
				}
				else {
					return null;
				}
			}
		}
		catch (err) {
			await errorLogs('getUserBlockedDatesError', 'Get user blocked dates error: ', err);
			return null;
		}
	}

	async updateLocalUserSettings({ userData, settingsProperty, backupStore = null, backupAPITag = null, backupData = null }) {
		try {
			// Get the user's settings
			const userSettings = await this.getUserSettings();

			if (!userSettings) return false;

			const updatedSettings = await this.updateUsersSettings(userSettings, userData, settingsProperty);

			await this.manageIDBTransactions({ userData, userSettings: updatedSettings, backupStore, backupAPITag, backupData });

			return true;
		}
		catch (err) {
			await errorLogs('updateLocalUserSettingsError', 'Update local user settings error: ', err);
			return false;
		}
	}

	async updateUsersSettings(userSettings, userdata, settingsProperty) {
		userSettings[settingsProperty] = userdata;

		return userSettings;
	}

	/**
	 * Manages IDB transactions for updating user settings and handling backups if needed.
	 * @param {Object} options - The options for managing IDB transactions.
	 * @param {IDBDatabase} options.db - The IndexedDB database instance.
	 * @param {Object} options.userSettings - The user settings to be updated.
	 * @param {string} [options.backupStore=null] - Optional: The store for the backup.
	 * @param {string} [options.backupAPITag=null] - Optional: The API tag for the backup.
	 * @param {Object} [options.backupData=null] - Optional: The backup data if different from user settings.
	 * @returns {Promise<boolean>} A promise that resolves to true when transactions are complete.
	 */
	async manageIDBTransactions({
		userData,
		userSettings,
		backupStore = null,
		backupAPITag = null,
		backupData = null
	}) {
		try {
			const db = await this.indexed.openDBPromise();

			const clearPromise = await this.indexed.clearStorePromise(db, this.indexed.stores.USERSETTINGS);
			const putSettingsPromise = await this.indexed.putStorePromise(db, userSettings, this.indexed.stores.USERSETTINGS);

			if (backupStore && backupAPITag) {
				await this.backupDataIfNeeded(userData, backupStore, backupAPITag, backupData);
			}

			await Promise.all([clearPromise, putSettingsPromise]);
			return true;
		} catch (err) {
			await errorLogs('manageIDBTransactionsError', 'Manage IDB transactions error: ', err);
			throw err;  // Rethrow the error to let the caller handle it
		}
	}

	async backupDataIfNeeded(userData, backupStore, backupAPITag, backupData) {
		try {
			const db = await this.indexed.openDBPromise();

			const data = backupData ? backupData : { ...userData, [backupAPITag]: true };
			await this.indexed.putStorePromise(db, data, backupStore, true);
		}
		catch (err) {
			await errorLogs('backupDataIfNeededError', 'Backup data if needed error: ', err);
			throw err;
		}
	}
}