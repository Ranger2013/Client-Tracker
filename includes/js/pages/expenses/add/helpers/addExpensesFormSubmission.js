import ManageExpenses from "../../../../classes/ManageExpenses.js";

export default async function addExpensesFormSubmission(userData){
	try{
		// Get the manage expenses class
		const manageExpenses = new ManageExpenses();

		return await manageExpenses.addExpenses(userData);
	}
	catch(err){
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('addExpensesFormSubmissionError', 'Error adding expenses: ', err, 'Unable to add expenses. Please try again later.', 'form-msg');
		throw err;
	}
}