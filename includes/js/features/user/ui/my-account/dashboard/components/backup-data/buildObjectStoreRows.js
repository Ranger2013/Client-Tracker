import IndexedDBOperations from '../../../../../../../core/database/IndexedDBOperations.min.js';
import { buildEle } from '../../../../../../../core/utils/dom/elements.min.js';
import { ucwords, underscoreToHyphen, underscoreToSpaces } from '../../../../../../../core/utils/string/stringUtils.min.js';

/**
 * Builds the object store rows for the backup data page.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.manageUser - The manageUser instance.
 * @returns {Promise<DocumentFragment>} The document fragment containing the object store rows.
 */
export default async function buildObjectStoreRows({ manageUser }) {
	try {
		const objectStores = await setupObjectStoreStructure({ manageUser });

		const fragment = document.createDocumentFragment();

		for (const store in objectStores) {
			const row = buildStoreRow({ storeList: objectStores[store] });
			fragment.appendChild(row);
		}

		return fragment;
	}
	catch (err) { }
}

/**
 * Sets up the object store structure.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.manageUser - The manageUser instance.
 * @returns {Promise<Object>} The object store structure.
 */
async function setupObjectStoreStructure({ manageUser }) {
	try {
		const objectStore = {};

		const stores = manageUser.getStoreNames();
		const indexed = new IndexedDBOperations();
		const db = await indexed.openDBPromise();

		for (const [storeId, backupStoreName] of Object.entries(stores)) {
			// Skip all stores that do not have backup_ in the name
			if (!backupStoreName.includes('backup_')) continue;

			// Check if the store has any data
			const storeData = await indexed.getAllStorePromise(db, backupStoreName);
			const hasData = storeData.length > 0;

			// Get the store name and property name
			const storeName = backupStoreName.replace('backup_', '');
			const propertyName = ucwords(underscoreToSpaces(storeName), false).replace(/ /g, '');
			const formattedStoreName = ucwords(underscoreToSpaces(storeName));
			const indicatorId = `${underscoreToHyphen(storeName)}-indicator`;

			objectStore[propertyName] = {
				indicatorId,
				storeName: backupStoreName,
				message: `${formattedStoreName}`,
				hasData
			};
		}

		return objectStore;
	}
	catch (err) { }
}

/**
 * Builds a store row element.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.storeList - The list of stores.
 * @returns {HTMLElement} The store row element.
 */
function buildStoreRow({ storeList }) {
	try {
		const { hasData, indicatorId, message, storeName } = storeList;

		const formattedMsg = hasData ? `${message} is out of sync` : `${message} is in sync`;
		const imgSrc = hasData ? `/public/siteImages/indicator_blue_light.png` : `/public/siteImages/indicator_green_light.webp`;

		const row = buildEle({ type: 'div', myClass: ['w3-row', 'w3-border-bottom', 'w3-padding-top', 'w3-padding-bottom'] });
		const firstCol = buildEle({ type: 'div', myClass: ['w3-col', 's11', 'w3-small'], text: formattedMsg });
		const secondCol = buildEle({ type: 'div', myClass: ['w3-col', 's1', 'w3-small'] });
		const imgIndicator = buildEle({ type: 'img', attributes: { id: indicatorId, src: imgSrc, alt: 'Indicator', title: 'Indicator', width: '25px', height: '25px', 'data-hasdata': hasData, 'data-store': `${storeName}` } });

		secondCol.appendChild(imgIndicator);
		row.append(firstCol, secondCol);

		return row;
	}
	catch (err) { }
}