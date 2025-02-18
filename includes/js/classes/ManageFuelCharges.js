
import IndexedDBOperations from "./IndexedDBOperations.js";
import ManageUser from "./ManageUser.js";

export default class ManageFuelCharges {
	constructor() {
		this.indexed = new IndexedDBOperations();
		this.manageUser = new ManageUser();
	}

	async addFuelChargesByMile(userData) {
		try {
			// Get the userSettings and mileage_charges
			const userSettings = await this.manageUser.getUserSettings();

			let mileageCharges = userSettings.mileage_charges;

			// Add the userData to the mileage_charges per_mile. This is similiar to useing array_merge() for php
			mileageCharges.per_mile = {
				...mileageCharges.per_mile,
				...userData
			};

			// Clear the range property
			mileageCharges.range = [];

			// Put the updated settings back in the store
			if (await this.manageUser.updateLocalUserSettings({
				userData: mileageCharges,
				settingsProperty: 'mileage_charges',
				backupStore: this.indexed.stores.MILEAGECHARGES,
				backupAPITag: 'add_fuelCosts'
			})) {
				return true;
			};

			return false;
		}
		catch (err) {
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('addFuelChargesByMileError', 'Add fuel charges by mile error: ', err);
			return false;
		}
	}

	async addFuelChargesByRange(userData) {
		try {
			// If no ranges, return false;
			if (userData.fuel_ranges === '') return false;

			// Get the user Settings and mileage_charges
			const userSettings = await this.manageUser.getUserSettings();

			let mileageCharges = userSettings.mileage_charges;

			// Clear the per_mile charges
			mileageCharges.per_mile = {
				starting_mile: null,
				cost_per_mile: null,
				base_cost: null,
			};

			// Clear the range array
			mileageCharges.range = [];

			// Loop through the ranges to set up the array of objects
			for(let i = 1; i <= userData.fuel_ranges; i++){
				const rangeKey = `mileage_range_${i}`;
				const costKey = `fuel_cost_${i}`;

				if(userData[rangeKey] && userData[costKey]){
					mileageCharges.range.push({
						range: userData[rangeKey],
						cost: userData[costKey],
					});
				}
			}

			// Add the new mileage to the user settings
			if(await this.manageUser.updateLocalUserSettings({
				userData: mileageCharges,
				settingsProperty: 'mileage_charges',
				backupStore: this.indexed.stores.MILEAGECHARGES,
				backupAPITag: 'add_fuelCosts',
			})){
				return true;
			};

			return false;			
		}
		catch (err) {
			const { default: errorLogs } = await import("../utils/error-messages/errorLogs.js");
			await errorLogs('addFuelChargesByRangeError', 'Add fuel charges by range error: ', err);
			return false;
		}
	}
}