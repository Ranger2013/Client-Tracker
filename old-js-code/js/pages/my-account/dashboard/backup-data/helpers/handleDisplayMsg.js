import openModal from "../../../../../utils/modal/openModal.js";
import { mySuccess } from "../../../../../utils/dom/domUtils.js";
import errorLogs from "../../../../../utils/error-messages/errorLogs.js";

export default async function handleDisplayMsg(responseArray, successContainer) {
	const errorTypes = ['error', 'server-error', 'validation-error', 'no-data'];

	try {
		const { errorMessages, successMessages } = responseArray
			.reduce((acc, batch) => {
				batch.forEach(response => {
					// Collect errors
					if (errorTypes.includes(response.status)) {
						acc.errorMessages.push(response);
					}
					if (response.email_status === 'error') {
						acc.errorMessages.push(response);
					}
					if (['error', 'server-error'].includes(response.invoice_status)) {
						acc.errorMessages.push(response);
					}

					// Collect successes
					if (response.email_status === 'success') {
						acc.successMessages.push(response);
					}
					if (response.invoice_status === 'success') {
						acc.successMessages.push(response);
					}
				});
				return acc;
			}, { errorMessages: [], successMessages: [] });

		// Display errors in modal if any
		if (errorMessages.length) {
			displayErrorMsg(errorMessages);
		}

		// Display successes in container
		if (successMessages.length) {
			displaySuccessMsg(successMessages, successContainer);
		}

		return !errorMessages.length;
	} catch (err) {
		await errorLogs('handleDisplayMsgError', 'Handle Display Msg Error: ', err);
		throw err;
	}
}

function displaySuccessMsg(messages, container) {
	try {
		let msgs = '';

		for (const msg of messages) {
			msgs += `<div>${msg}</div>`;
		}
		mySuccess(container, msgs);
	}
	catch (err) {
		console.warn('display success msg error: ', err);
	}
}

function displayErrorMsg(messages) {
	try {
		let msgs = '<ul class="w3-padding-small">';

		messages.forEach(error => {
			msgs += `<li class="w3-light-red w3-padding-small w3-margin-small w3-round-large">
					${error.msg ? error.msg.replace(/(SERVER ERROR:|ERROR:)/g, '<span class="w3-text-red w3-bold">$1</span>') : error.replace(/(SERVER ERROR:|ERROR:)/g, '<span class="w3-text-red w3-bold">$1</span>')}
					${error.data ? `
						 <ul class="w3-padding-small">
							  ${Object.entries(error.data).map(([_, message]) =>
				`<li class="w3-margin-left w3-text-red">${message}</li>`
			).join('')}
						 </ul>
					` : ''}
			  </li>`;
		});

		msgs += '</ul>';

		openModal({
			content: msgs,
			title: 'Backup Data Errors',
			configuration: [
				'w3-padding',
				'w3-margin-top',
				'w3-round-large',
				'w3-white',
				'w3-margin-center',
				'w3-margin'
			]
		});
	}
	catch (err) {
		console.warn('display error msg error: ', err);
	}
}