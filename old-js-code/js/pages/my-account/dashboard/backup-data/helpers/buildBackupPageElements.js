import setupObjectStoreStructure from './setupObjectStoreStructure.js';
import handleIndicatorLights from './handleIndicatorLights.js';
import { buildEle } from "../../../../../utils/dom/domUtils.js";

const createPageElements = () => ({
	container: buildEle({
		type: 'div',
		myClass: ['w3-container']
	}),
	titleContainer: buildEle({
		type: 'div',
		myClass: ['w3-center']
	}),
	title: buildEle({
		type: 'h5',
		text: 'Save your data to the server'
	}),
	messages: {
		error: buildEle({
			type: 'div',
			attributes: { id: 'backup-msg-error' },
			myClass: ['w3-hide', 'w3-padding-small']
		}),
		success: buildEle({
			type: 'div',
			attributes: { id: 'backup-msg-success' },
			myClass: ['w3-padding-small']
		})
	},
	buttonContainer: buildEle({
		type: 'div',
		attributes: { id: 'backup-data-button-container' },
		myClass: ['w3-center', 'w3-margin-bottom']
	}),
	button: buildEle({
		type: 'button',
		myClass: ['w3-button', 'w3-round-large', 'w3-black'],
		attributes: { id: 'backup-data-button' },
		text: 'Back Up Data'
	})
});

/**
 * Asynchronously builds and returns the backup page elements.
 *
 * This function creates the necessary page elements, sets up the object store structure,
 * handles indicator lights, and assembles the DOM structure for the backup page.
 * It also conditionally appends the backup button if needed.
 *
 * @async
 * @function buildBackupPageElements
 * @returns {Promise<Array>} A promise that resolves to an array containing the container element,
 *                           object stores, and a flag indicating if an update is needed.
 * @throws Will throw an error if there is an issue building the backup page elements.
 */
export default async function buildBackupPageElements() {
	try {
		const elements = createPageElements();
		let objectStores = await setupObjectStoreStructure({});

		// Get indicators and backup status
		const [indicators, backupDataFlag, needsUpdating] = await handleIndicatorLights(objectStores);

		// Assemble DOM structure
		elements.titleContainer.append(elements.title);
		elements.container.append(elements.titleContainer);

		// Only show backup button if needed
		if (backupDataFlag) {
			elements.buttonContainer.append(elements.button);
			elements.container.append(elements.buttonContainer);
		}

		elements.container.append(
			elements.messages.success,
			elements.messages.error,
			indicators
		);

		return [elements.container, objectStores, needsUpdating];
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('buildBackupPageElementsError', 'Build backup page elements error: ', err);
		throw err;
	}
}