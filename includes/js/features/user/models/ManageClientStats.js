import IndexedDBOperations from '../../../core/database/IndexedDBOperations.js';

export default class ManageClientStats {

	constructor() {
		this.indexed = new IndexedDBOperations();
	}

	async getClientStatsForUser() {
		try {
			// Open IDB db
			const db = await this.indexed.openDBPromise();

			// Get a list of all the clients
			const clients = await this.indexed.getAllStorePromise(db, this.indexed.stores.CLIENTLIST);

			// Save the stats
			const stats = {};

			clients.forEach(client => {
				// Get the number of horses for this client
				const num_horses = client.horses.length;

				// Is there a number horses property for the stats?
				// If so, increment number of clients for this many horses
				if (stats[num_horses]) {
					stats[num_horses].num_clients++;
				}
				else {
					// Create the number horses property for the stats
					stats[num_horses] = { num_clients: 1, num_horses };
				}
			});

			// Convert the stats object to an array and sort by number of horses
			const statsArray = Object.values(stats).sort((a, b) => a.num_horses - b.num_horses);

			// Return the array stats
			return statsArray;
		}
		catch (err) {
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.PROCESSING_ERROR,
				message: AppError.BaseMessages.system.processing,
				displayTarget: 'form-msg',
			}, true);
		}
	}

	/**
	 * Retrieves clients with a specific number of horses from the IndexedDB object store.
	 *
	 * @async
	 * @param {number} numHorses - The number of horses to filter clients by.
	 * @returns {Promise<(object[]|null)>} A promise that resolves with an array of clients that have the specified number of horses, or null if no such clients exist.
	 */
	async getClientsWithNthHorses(numHorses) {
		try {
			// Open the IndexedDB database
			const db = await this.indexed.openDBPromise();

			// Retrieve all clients from the 'clients' object store
			const clients = await this.indexed.getAllStorePromise(db, this.indexed.stores.CLIENTLIST);

			// Filter the clients based on the number of horses
			const filteredClients = clients.filter(client => Number(client.horses.length) === Number(numHorses));

			// Sort the filtered clients by 'trim_cycle' and 'client_name'
			// If 'trim_cycle' is the same for two clients, they are sorted by 'client_name'
			filteredClients.sort((a, b) => {
				if (a.trim_cycle === b.trim_cycle) {
					return a.client_name.localeCompare(b.client_name);
				}
				return a.trim_cycle - b.trim_cycle;
			});

			// If there are no clients with the specified number of horses, return null
			// Otherwise, return the filtered and sorted clients
			return filteredClients.length > 0 ? filteredClients : null;
		}
		catch (err) {
			// Log any errors that occur during the execution of the function
			const { AppError } = await import("../../../core/errors/models/AppError.js");
			AppError.process(err, {
				errorCode: AppError.Types.PROCESSING_ERROR,
				message: AppError.BaseMessages.system.processing,
				displayTarget: 'form-msg',
			}, true);
		}
	}

}