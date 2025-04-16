import { buildElementsFromConfig, getValidElement } from '../../../../../../utils/dom/elements.js';
import { buildPageContainer } from '../../../../../../utils/dom/forms/buildUtils.js';

// Set up debug mode
const COMPONENT = 'Display Transfer Data Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function displayTransferDataPage({tabContainer, manageUser}) {
	try{
		const [pageComponents, storeRows] = await Promise.all([
			buildMainPageComponents(),
			buildStoreRows(),
		]);

		renderPage({ tabContainer, pageComponents, storeRows });
	}
	catch (err) {
		const { AppError } = await import("../../../../../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			message: AppError.BaseMessages.system.render,
		});
	}
}

async function buildMainPageComponents() {
	const [mainContainer, card] = await buildPageContainer({ pageTitle: 'Transfer Server Data to Your Device'});

	const PAGE_MAPPING = {
		container: {
			type: 'div',
			myClass: ['w3-container'],
		},
		row: {
			type: 'div',
			myClass: ['w3-center', 'w3-margin-bottom'],
		},
		button: {
			type: 'button',
			attributes: { id: 'transfer-data-button', },
			myClass: ['w3-button', 'w3-round-large', 'w3-black', 'w3-card'],
			text: 'Transfer Data',
		}
	};

	const elements = buildElementsFromConfig(PAGE_MAPPING);
	const { container, row, button } = elements;
	row.appendChild(button);

	return {
		mainContainer,
		card,
		container,
		buttonSection: row,
	}
}

async function buildStoreRows() {
	const fragment = document.createDocumentFragment();

	const ROW_DATA = [
		{ label: 'Clients:', indicatorId: 'clients-indicator' },
		{ label: 'Trimmings:', indicatorId: 'trimmings-indicator' },
		{ label: 'Personal Notes:', indicatorId: 'personal-notes-indicator' },
		{ label: 'Date/Time Options: ', indicatorId: 'date-time-indicator' },
		{ label: 'Farrier Prices:', indicatorId: 'farrier-prices-indicator' },
		{ label: 'Mileage Charges:', indicatorId: 'mileage-charges-indicator' },
		{ label: 'Schedule Options:', indicatorId: 'schedule-options-indicator' },
		{ label: 'Color Options:', indicatorId: 'color-options-indicator' },
	]

	ROW_DATA.forEach((rowData) => {
		const { label, indicatorId } = rowData;

		const ROW_MAPPING = {
			row: {
				type: 'div',
				myClass: ['w3-row', 'w3-border-bottom', 'w3-padding'],
			},
			colOne: {
				type: 'div',
				myClass: ['w3-col', 's11', 'w3-small'],
				text: `Sync ${label}`,
			},
			colTwo: {
				type: 'div',
				myClass: ['w3-col', 's1'],
			},
			img: {
				type: 'img',
				attributes: {
					id: indicatorId,
					src: '/public/siteImages/indicator_blue_light.png',
					width: '25px',
					height: '25px',
					alt: 'Blue Indicator Light'
				},
			},
		};

		const elements = buildElementsFromConfig(ROW_MAPPING);
		const { row, colOne, colTwo, img } = elements;
		colTwo.appendChild(img);
		row.append(colOne, colTwo);
		fragment.appendChild(row);
	});
	return fragment;
}

function renderPage({ tabContainer, pageComponents, storeRows }) {
	tabContainer = getValidElement(tabContainer);

	const { mainContainer, card, buttonSection, container } = pageComponents;

	container.appendChild(storeRows);
	card.append(buttonSection, container);
	mainContainer.appendChild(card);

	tabContainer.innerHTML = ''; // Clear existing content
	tabContainer.appendChild(mainContainer); // Append new content
}