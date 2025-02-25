import ManageClient from "../../../../classes/ManageClient.js";

export default async function handleDuplicateClientFormSubmission(evt) {
	try {
		const userData = Object.fromEntries(new FormData(evt.target));

		const validate = validateForm(userData);

		if(!validate) return { status: 'validation-error', msg: 'Please select a trimming cycle.' };

		const manageClient = new ManageClient();

		return await manageClient.addDuplicateClient(userData);
	}
	catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError(
			'handleDuplicateClientFormSubmissionError',
			'Error handling duplicate client form submission: ',
			err,
			'There was an error. Unable to process form submission.',
			'form-msg');
	}
}

async function validateForm(userData) {
	const trimCycleDays = ['7', '14', '21', '28', '35', '42', '49', '56', '63', '70'];
	return trimCycleDays.includes(userData.trim_cycle);
}