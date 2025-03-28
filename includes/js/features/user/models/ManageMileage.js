import IndexedDBOperations from "../../../core/database/IndexedDBOperations.js";

export default class ManageMileage {
	// Static private property to hold the singleton instance
	static #instance = null;

	// Instance private properties
	#indexed;
	#debug = false;

	/**
	 * Creates a new ManageMileage instance or returns existing singleton
	 * @param {Object} options - Configuration options
	 * @param {boolean} [options.debug=false] - Enable debug logging
	 */
	constructor(options = { debug: false }) {
		// If an instance already exists, return it
		if (ManageMileage.#instance) {
			// Optionally update debug setting if passed
			if (options.debug !== undefined) {
				ManageMileage.#instance.setDebugMode(options.debug);
			}
			return ManageMileage.#instance;
		}

		// First-time initialization
		this.#indexed = new IndexedDBOperations();
		this.#debug = options.debug || false;

		// Store this instance as the singleton
		ManageMileage.#instance = this;

		this.#log('ManageMileage singleton instance created.');
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
			console.log(`[ManageMileage]`, ...args);
		}
	}
	/**
	 * Retrieves all mileage data from the server
	 * @returns {Promise<Array|null>} Array of mileage records or null if none found
	 * @todo Implementation pending
	 */
	async getMileageDataFromServer() {
		// Will be implemented in the future
	}

	/**
	 * Adds new mileage record to local storage for later server backup
	 * @param {Object} mileageData - The mileage data to store
	 * @param {string} mileageData.destination - Destination of the trip
	 * @param {number} mileageData.starting_mileage - Starting odometer reading
	 * @param {number} mileageData.ending_mileage - Ending odometer reading
	 * @param {number} mileaeData.difference - Total miles driven
	 * @param {boolena} mileageData.add_expenses - API endpoint modifier for the server
	 * @returns {Promise<boolean>} The saved mileage record with generated ID
	 */
	async addMileage(mileageData) {
		try {
			const db = await this.#indexed.openDBPromise();

			await this.#indexed.putStorePromise(db, mileageData, this.#indexed.stores.ADDMILEAGE);
			return true;
		}
		catch (err) {
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: AppError.BaseMessages.system.database,
			}, true);
		}
	}

	/**
	 * Updates an existing mileage record
	 * @param {string} id - ID of the mileage record to update
	 * @param {Object} updatedData - New data for the mileage record
	 * @returns {Promise<Object>} The updated mileage record
	 * @todo Implementation pending based on user feedback
	 */
	async editMileage(id, updatedData) {
		// May be implemented in the future based on user feedback
	}

	/**
	 * Marks a mileage record for deletion on next server backup
	 * @param {string} id - ID of the mileage record to delete
	 * @returns {Promise<boolean>} True if successful
	 * @todo Implementation pending based on user feedback
	 */
	async deleteMileage(id) {
		// May be implemented in the future based on user feedback
	}
}