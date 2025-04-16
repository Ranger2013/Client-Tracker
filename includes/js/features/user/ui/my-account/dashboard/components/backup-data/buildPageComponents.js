import IndexedDBOperations from '../../../../../../../core/database/IndexedDBOperations.js';
import { buildEle, buildElementsFromConfig, buildElementTree } from '../../../../../../../core/utils/dom/elements.js';
import { ucwords, underscoreToHyphen, underscoreToSpaces } from '../../../../../../../core/utils/string/stringUtils.js';

const COMPONENT = 'Build Page Components';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Builds the page components for the backup data page.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.manageUser - The manageUser instance.
 * @param {DocumentFragment} params.objectStoreRows - The object store rows fragment.
 * @returns {HTMLElement} The container element with the page components.
*/
export default async function buildBackupDataPageComponents({ manageUser, objectStoreRows }) {
	try {
		// Returns the DOM structure
		const mainPageElements = buildMainPageComponents();	
		debugLog('In buildBackupDataPageComponents: mainPageElements: ', mainPageElements);

		const backupDataRows = await buildBackupDataRows({ manageUser });
		debugLog('In buildBackupDataPageComponents: backupDataRows: ', backupDataRows);

		mainPageElements.storeRowsContainer.appendChild(backupDataRows);
		debugLog('In buildBackupDataPageComponents: mainPageElements: ', mainPageElements);

		return mainPageElements;
	}
	catch (err) {
		throw err;
	}
}

function buildMainPageComponents() {
	const PAGE_MAPPING = {
		container: {
			type: 'div',
			myClass: ['w3-container'],
		},
		titleContainer: {
			type: 'div',
			myClass: ['w3-center'],
		},
		title: {
			type: 'h5',
			text: 'Backup Your Data to the Server',
		},
		successContainer: {
			type: 'div',
			attributes: { id: 'backup-msg-success' },
			myClass: ['w3-padding-small', 'w3-text-green'],
		},
		buttonContainer: {
			type: 'div',
			attributes: { id: 'backup-data-button-container' },
			myClass: ['w3-center', 'w3-padding-small', 'w3-hide'],
		},
		button: {
			type: 'button',
			attributes: { id: 'backup-data-submit-button' },
			myClass: ['w3-button', 'w3-black', 'w3-round-large', 'w3-card'],
			text: 'Backup Data',
		},
		storeRowsContainer: {
			type: 'div',
			attributes: { id: 'store-rows-container' },
			myClass: ['w3-margin-top'],
		},
	};

	const mainElements = buildElementsFromConfig(PAGE_MAPPING);
	debugLog('In buildMainPageComponents: mainElements: ', mainElements);
	return mainElements;
}

async function buildBackupDataRows({ manageUser }) {
	const objectStoreStructure = await buildObjectStoreStructure();
	debugLog('In buildBackupDataRows: objectStoreStructure: ', objectStoreStructure);

	const fragment = document.createDocumentFragment();

	const storeRows = Object.entries(objectStoreStructure)
	.map(([propertyName, storeData]) => {
		const storeRow = buildStoreRow({ storeList: storeData });

		fragment.appendChild(storeRow);
		return fragment;
	});

	debugLog('In buildBackupDataRows: storeRows: ', storeRows);
	return fragment;
}

function buildStoreRow({ storeList }) {
	debugLog('In buildStoreRow: storeList: ', storeList);
	const { hasData, indicatorId, message, storeName } = storeList;

	const ROW_MAPPING = {
		type: 'div',
		myClass: ['w3-row', 'w3-border-bottom', 'w3-padding-top', 'w3-padding-bottom'],
		children: {
			firstCol: {
				type: 'div',
				myClass: ['w3-col', 's11', 'w3-small'],
				text: `${message} is ${hasData ? 'out of sync:' : 'in sync:'}`,
			},
			secondCol: {
				type: 'div',
				myClass: ['w3-col', 's1'],
				children: {
					imgIndicator: {
						type: 'img',
						attributes: {
							src: `${hasData ? '/public/siteImages/indicator_blue_light.png' : '/public/siteImages/indicator_green_light.webp'}`,
							alt: `${hasData ? 'Blue light indicator' : 'Green light indicator'}`,
							title: `${hasData ? 'Blue light indicator' : 'Green light indicator'}`,
							width: '25px',
							height: '25px',
							'data-hasdata': hasData,
							'data-store': storeName,
						},
					},
				},
			},
		},
	};

	const row = buildElementTree(ROW_MAPPING);
	debugLog('In buildStoreRow: row: ', row);
	return row;
}

async function buildObjectStoreStructure() {
	const indexed = new IndexedDBOperations({ debug: false });
	const db = await indexed.openDBPromise();
	const stores = indexed.stores;

	const storeEntries = await Promise.all(
		Object.entries(stores).filter(([_, stringName]) => stringName.includes('backup_'))
			.map(async ([storeID, stringName]) => {
				// Get this specific store
				const storeData = await indexed.getAllStorePromise(db, stringName);
				// Check if there is any data waiting to be backed up
				const hasData = storeData.length > 0;

				// Set up the storeName, propertyName, the formatted store name used for the client, and the image indicator ID
				const storeName = stringName.replace('backup_', '');
				const propertyName = ucwords(underscoreToSpaces(storeName), false).replace(/ /g, '');
				const formattedStoreName = ucwords(underscoreToSpaces(storeName));
				const indicatorId = `${underscoreToHyphen(storeName)}-indicator`;

				return [propertyName,{
					indicatorId,
					storeName: stringName,
					message: `${formattedStoreName}`,
					hasData
				}];
			})
	);

	debugLog('In buildObjectStoreStructure: storeEntries: ', storeEntries);
	// Re-order the store entries based on the rowOrder array
	return Object.fromEntries(storeEntries);
}