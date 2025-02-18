import ManageClient from "../../../../classes/ManageClient.js";
import { sortByTrimDateAndAppTime } from "../../../../utils/date/dateUtils.js";
import { buildEle } from "../../../../utils/dom/domUtils.js";
import { cleanUserOutput } from "../../../../utils/string/stringUtils.js";

export default async function buildClientListSelect(container) {
	try {
		// Get the client list
		const manageClient = new ManageClient();

		const clientList = await manageClient.getClientScheduleList();

		clientList.sort((a, b) => sortByTrimDateAndAppTime(a, b, true));

		// Build the options elements
		const options = clientList.map(client => {
			const clientName = cleanUserOutput(client.client_name);

			return buildEle({
				type: 'option',
				attributes: { value: clientName },
				text: clientName,
			})
		});

		if(options.length === 0){
			options.push(buildEle({
				type: 'option',
				attributes: { value: 'null', disabled: true, selected: true },
				text: 'No clients available',
			}));
		}

		// Build the select element
		const select = buildEle({
			type: 'select',
			attributes: {
				name: 'destination',
				title: 'Select Client Destination',
				required: true,
			},
			myClass: ['w3-input', 'w3-border'],
		});

		// Append the options to the select element
		select.append(...options);

		container.innerHTML = '';
		container.appendChild(select);
	}
	catch (err) {
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError('buildClientListSelectError', 'Build client list select error: ', err, 'Unable to get the list of clients.', container);
	}
}

