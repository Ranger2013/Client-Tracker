import IndexedDBOperations from '../../../core/database/IndexedDBOperations.js';

export default class ManageExpenses {
	// Static private property to hold the singleton instance
	static #instance = null;

	// Instance private properties
	#indexed;
	#debug = false;

	/**
	 * Creates a new ManageExpenses instance or returns existing singleton
	 * @param {Object} options - Configuration options
	 * @param {boolean} [options.debug=false] - Enable debug logging
	 */
	constructor(options = { debug: false }) {
		// If an instance already exists, return it
		if (ManageExpenses.#instance) {
			// Optionally update debug setting if passed
			if (options.debug !== undefined) {
				ManageExpenses.#instance.setDebugMode(options.debug);
			}
			return ManageExpenses.#instance;
		}

		// First-time initialization
		this.#indexed = new IndexedDBOperations();
		this.#debug = options.debug || false;

		// Store this instance as the singleton
		ManageExpenses.#instance = this;

		this.#log('ManageExpenses singleton instance created.');
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
			console.log(`[ManageExpenses]`, ...args);
		}
	}

	/**
	 * Retrieves all expenses data from the server
	 * @returns {Promise<Array|null>} Array of expenses records or null if none found
	 * @todo Implementation pending
	 */
	async getExpensesDataFromServer() {
		// Will be implemented in the future
	}

	/**
	 * Adds a new expense record to the local database
	 * @param {Object} expenseData - Expense data to add
	 * @param {string} expenseData.store - Store name
	 * @param {string} expenseData.date - Date of purchase
	 * @param {string} expenseData.category - Category of expense
	 * @param {number} expenseData.price - Total price of purchase
	 * @param {string} expenseData.itemDescription - Description of purchase
	 * @returns {Promise<boolean>} Whether the operation was successful
	 */
	async addExpense(expenseData){
		try{
			const db = await this.#indexed.openDBPromise();

			await this.#indexed.putStorePromise(db, expenseData, this.#indexed.stores.ADDEXPENSES);
			return true
		}
		catch(err){
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.DATABASE_ERROR,
				userMessage: AppError.BaseMessages.system.database,
			}, true);
		}
	}
}