import IndexedDBOperations from "./IndexedDBOperations";

export default class ManageExpenses {
	constructor() {
		this.indexed = new IndexedDBOperations();
	}

	async addExpenses(userData){
		try{
			const db = await this.indexed.openDBPromise();

			// Add the api identifier
			userData.add_expenses = true;

			await this.indexed.putStorePromise(db, userData, this.indexed.stores.ADDEXPENSES);

			return { status: true, msg: 'Expenses added successfully.' };
		}
		catch(err){
			const { handleError } = await import("../utils/error-messages/handleError.js");
			await handleError('addExpensesFormSubmissionError', 'Error adding expenses: ', err, 'Unable to add expenses. Please try again later.', 'form-msg');
			return { status: false, msg: 'Unable to add expenses. Please try again later.' };
		}
	}
}