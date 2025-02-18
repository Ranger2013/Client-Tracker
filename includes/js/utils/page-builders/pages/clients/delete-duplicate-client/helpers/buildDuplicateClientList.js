import { formatDate, formatTime } from "../../../../../date/dateUtils.js";
import { buildEle } from "../../../../../dom/domUtils.js";
import { cleanUserOutput } from "../../../../../string/stringUtils.js";

export default async function buildDuplicateClientList(duplicates, userSettings) {
	try {
		// Set the iterator
		let i = 1;

		const fragment = document.createDocumentFragment();

		if(duplicates.length === 0){
			const noDuplicates = buildEle({
				type: 'div',
				text: 'No duplicate clients found.',
				myClass: ['w3-center'],
			});
			fragment.appendChild(noDuplicates);
			return fragment;
		}

		duplicates.forEach(client => {
			const row = buildEle({
				type: 'div',
				myClass: ['w3-row', 'w3-padding-small', 'w3-border-bottom', 'w3-light-grey'],
			});

			const colOne = buildEle({
				type: 'div',
				myClass: ['w3-col', 'm3', 's3', 'w3-padding-small'],
			});

			const colOneName = buildEle({
				type: 'div',
				text: cleanUserOutput(client.client_name),
			});

			const colTwo = buildEle({
				type: 'div',
				myClass: ['w3-col', 'm3', 's5', 'w3-padding-small', 'w3-center'],
			});

			const colTwoAppDate = buildEle({
				type: 'div',
				text: formatDate(client.trim_date, userSettings.date_format),
			});

			const colThree = buildEle({
				type: 'div',
				myClass: ['w3-col', 'm3', 'w3-hide-small', 'w3-padding-small', 'w3-centr']
			});

			const colThreeAppTime = buildEle({
				type: 'div',
				text: formatTime(client.app_time, userSettings.time_format),
			});

			const colFour = buildEle({
				type: 'div',
				myClass: ['w3-col', 'm3', 's4', 'w3-padding-small', 'w3-center'],
			});

			const colFourDeleteButton = buildEle({
				type: 'button',
				myClass: ['w3-button', 'w3-red', 'w3-round-large'],
				attributes: {
					id: `delete-client-button-${i}`,
					value: client.primaryKey,
					type: 'button',
					name: `delete_client_button_${i}`,
				},
				text: 'Delete',
			});

			row.appendChild(colOne);
			colOne.appendChild(colOneName);
			row.appendChild(colTwo);
			colTwo.appendChild(colTwoAppDate);
			row.appendChild(colThree);
			colThree.appendChild(colThreeAppTime);
			row.appendChild(colFour);
			colFour.appendChild(colFourDeleteButton);

			fragment.appendChild(row);

			i++;
		});

		return fragment;
	}
	catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError(
			'buildDuplicateClientListError',
			'Error building duplicate client list: ',
			err,
			'Unable to display the duplicate client list. Please try again later.',
			'page-msg');
	}
}