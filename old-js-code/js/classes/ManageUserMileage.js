import IndexedDBOperations from "./IndexedDBOperations.js";

export default class ManageUserMileage {
	constructor() {
		this.indexed = new IndexedDBOperations();
	}

	async addUserMileage(userData) {
		try {
			const db = await this.indexed.openDBPromise();

			await this.indexed.putStorePromise(db, userData, this.indexed.stores.ADDMILEAGE);

			return { status: 'success', msg: `Mileage to ${userData.destination} added successfully.` };
		}
		catch (err) {
			const { handleError } = await import("../utils/error-messages/handleError.js");
			await handleError('addUserMileageError', 'Add user mileage error: ', err);
		}
	}

	setMileageStructure(userData) {
		// Get todays date in the format YYYY-MM-DD
		const date = new Date().toISOString().split('T')[0];

		// Get mileage difference
		const mileageDiff = userData.ending_miles - userData.starting_miles;

		return {
			add_mileage: true,
			date,
			destination: userData.destination,
			difference: mileageDiff,
			end_mileage: userData.ending_miles,
			start_mileage: userData.starting_miles,
		}
	}
}