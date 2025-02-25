
import IndexedDBOperations from "../../../../../classes/IndexedDBOperations.js";
import { buildEle } from "../../../../../utils/dom/domUtils.js";

/**
 * Creates indicator elements with store configuration
 * @param {Object} storeConfig - Single store configuration from objectStores
 */
const buildIndicatorRow = (storeConfig) => ({
	row: buildEle({
		type: 'div',
		myClass: ['w3-row', 'w3-border-bottom', 'w3-padding-top', 'w3-padding-bottom']
	}),
	firstCol: buildEle({
		type: 'div',
		myClass: ['w3-col', 's11', 'w3-small'],
		text: storeConfig.message
	}),
	secondCol: buildEle({
		type: 'div',
		myClass: ['w3-col', 's1', 'w3-small']
	}),
	imgIndicator: buildEle({
		type: 'img',
		attributes: {
			id: storeConfig.indicatorID,
			src: '/public/siteImages/indicator_green_light.webp',
			width: '25px',
			height: '25px',
		},
	})
});

/**
 * Builds indicator row with store data status
 * @param {Array} storeData - Data from IndexedDB store
 * @param {string} storeKey - Key from objectStores
 * @param {Object} objectStores - Store configurations
 */
const getIndicatorRow = (storeData, storeKey, objectStores) => {
	const elements = buildIndicatorRow(objectStores[storeKey]);
	const hasData = storeData?.length > 0;

	if (hasData) {
		elements.imgIndicator.src = '/public/siteImages/indicator_blue_light.png';
	}

	elements.row.append(elements.firstCol, elements.secondCol);
	elements.secondCol.appendChild(elements.imgIndicator);

	return { row: elements.row, hasData };
}

export default async function handleIndicatorLights(objectStores) {
	try {
		// Set up IDB Class and open db
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		// DOM Fragment
		const fragment = document.createDocumentFragment();

		// Back up data flag
		let backupDataFlag = false;
		let storesToUpdate = [];

		// Loop through the object stores to see which ones contain data that we need to update.
		for (const storeKey in objectStores) {
			const storeData = await indexed.getAllStorePromise(db, objectStores[storeKey].store);

			const { row: indicatorRow, hasData } = getIndicatorRow(storeData, storeKey, objectStores);

			// We have a store and it is not empty
			if (hasData) {
				backupDataFlag = true;
				storesToUpdate.push(objectStores[storeKey]);
			}

			fragment.appendChild(indicatorRow);
		}

		return [
			fragment,
			backupDataFlag,
			storesToUpdate.length > 0 ? storesToUpdate : null
		];
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleIndicatorLightsError', 'Get indicator lights error: ', err);
		throw err;
	}
}