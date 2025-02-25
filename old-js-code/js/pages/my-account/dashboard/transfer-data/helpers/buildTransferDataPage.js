import { buildEle } from "../../../../../utils/dom/domUtils";
import { underscoreToHyphen } from "../../../../../utils/string/stringUtils";

const transferElements = [
	{ clients: 'Clients' },
	{ trimmings: 'Trimmings' },
	{ personal_notes: 'Personal Notes' },
	{ date_time: 'Date/Time Options' },
	{ farrier_prices: 'Farrier Prices' },
	{ mileage_charges: 'Mileage Charges' },
	{ schedule_options: 'Schedule Options' },
	{ color_options: 'Color Options' },
];

const buildTransferElements = () => {
	const fragment = document.createDocumentFragment();

	transferElements.forEach(element => {
		const [key, value] = Object.entries(element)[0];
		const container = buildEle({
			type: 'div',
			myClass: ['w3-container'],
		});
		const row = buildEle({
			type: 'div',
			myClass: ['w3-row', 'w3-border-bottom', 'w3-padding-top', 'w3-padding-bottom'],
		});
		const colOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 's11', 'w3-small'],
			text: `Sync ${value}:`,
		});
		const colTwo = buildEle({
			type: 'div',
			myClass: ['w3-col', 's1'],
		});
		const indicatorImage = buildEle({
			type: 'img',
			attributes: {
				id: `${underscoreToHyphen(key)}-indicator`,
				src: '/public/siteImages/indicator_blue_light.png',
				width: '25px',
				height: '25px',
				alt: 'Blue indicator light',
			},
		});

		colTwo.append(indicatorImage);
		row.append(colOne, colTwo);
		container.append(row);
		fragment.append(container);
	});

	return fragment;
};

const createPageElements = () => ({
	buttonSection: buildEle({
		type: 'div',
		myClass: ['w3-center', 'w3-margin-bottom'],
	}),
	button: buildEle({
		type: 'button',
		myClass: ['w3-button', 'w3-round-large', 'w3-black'],
		attributes: { id: 'transfer-data-button' },
		text: 'Transfer Data',
	}),
	transferElements: buildTransferElements(),
});

export default async function buildTransferDataPage() {
	try {
		const fragment = document.createDocumentFragment();

		const { buttonSection, button, transferElements } = createPageElements();

		buttonSection.append(button);
		fragment.append(buttonSection, transferElements);

		return fragment;
	}
	catch (err) {
		throw err;
	}
}