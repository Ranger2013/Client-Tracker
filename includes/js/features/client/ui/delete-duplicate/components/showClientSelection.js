import { formatDate, formatTime } from '../../../../../core/utils/date/dateUtils.min.js';
import { buildEle, getValidElement } from '../../../../../core/utils/dom/elements.js';
import { cleanUserOutput } from '../../../../../core/utils/string/stringUtils.js';

// Handle debug logging
const COMPONENT = 'Show Client Selection';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function showClientSelection({ evt, duplicateClients, manageUser }) {
	try{
		const cID = parseInt(evt.target.value, 10);

		// Returns an array of client objects for the client with the selected cID
		const duplicatesData = getDuplicateClients({cID, clientData: duplicateClients});

		// Build the client selection view
		const pageComponents = await buildDuplicateClientSectionView({duplicatesData, manageUser});

		renderPage(pageComponents);
	}
	catch(err){
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err,{
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
			displayTarget: 'client-container',
		}, true);
	}
}

function getDuplicateClients({cID, clientData}){
	return clientData.filter(client => client.cID === cID);
}

async function buildDuplicateClientSectionView({duplicatesData, manageUser}){
	if(duplicatesData.length === 0){
		throw new Error('No duplicate clients found');
	}
	const fragment = document.createDocumentFragment();
	const {date_format: dateFormat, time_format: timeFormat} = await manageUser.getDateTimeOptions();

	let i = 1;

	duplicatesData.forEach(client => {
		const panel = buildEle({
			type: 'div',
			attributes: { id: `client-section-${i}` },
			myClass: ['w3-section', 'w3-border', 'w3-card', 'w3-round'],
		});

		const panelTitle = buildEle({
			type: 'div',
			myClass: ['w3-blue-grey', 'w3-border-bottom', 'w3-padding', 'w3-bold'],
			text: cleanUserOutput(client.client_name),
		});

		const panelBodyRow = buildEle({
			type: 'div',
			myClass: ['w3-row'],
		});

		const panelBodyColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 's8', 'w3-padding-small'],
		});

		const appDataRow = buildEle({
			type: 'div',
			myClass: ['w3-row'],
		});

		const appDateColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm4', 'w3-bold'],
			text: 'Appointment: ',
		});

		const appDateColTwo = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm8'],
			text: `${formatDate(client.trim_date, dateFormat)} at ${formatTime(client.app_time, timeFormat)}`,
		});

		const deleteButtonColTwo = buildEle({
			type: 'div',
			myClass: ['w3-col', 's4', 'w3-padding-small', 'w3-center'],
		});

		const deleteButton = buildEle({
			type: 'button',
			attributes: {
				id: `delete-button-${i}`,
				'data-primarykey': client.primaryKey,
				'data-cid': client.cID,
			},
			myClass: ['w3-button', 'w3-red', 'w3-round'],
			text: 'Delete',
		});

		deleteButtonColTwo.appendChild(deleteButton);
		appDataRow.append(appDateColOne, appDateColTwo);
		panelBodyColOne.append(appDataRow);
		panelBodyRow.append(panelBodyColOne, deleteButtonColTwo);
		panel.append(panelTitle, panelBodyRow);
		fragment.appendChild(panel);

		i++;
	});

	return fragment;
}

function renderPage(pageComponents){
	const clientContainer = getValidElement('client-container');
	clientContainer.innerHTML = '';
	clientContainer.appendChild(pageComponents);
}