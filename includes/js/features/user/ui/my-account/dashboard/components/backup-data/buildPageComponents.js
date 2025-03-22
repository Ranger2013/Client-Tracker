import { buildEle } from '../../../../../../../core/utils/dom/elements.js';

/**
 * Builds the page components for the backup data page.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.manageUser - The manageUser instance.
 * @param {DocumentFragment} params.objectStoreRows - The object store rows fragment.
 * @returns {HTMLElement} The container element with the page components.
 */
export default function buildBackupDataPageComponents({manageUser, objectStoreRows}){
	try{
		const elements = pageElements();

		// Check if any store needs backup by examining all img elements in the fragment
		const imgElements = objectStoreRows.querySelectorAll('img[data-hasdata]');
		const needsBackup = Array.from(imgElements).some(img => img.dataset.hasdata === 'true');

		// Assemble the DOM structure
		elements.titleContainer.appendChild(elements.title);
		elements.container.append(
			elements.titleContainer,
			elements.errorContainer,
		);
		if(needsBackup) {
			elements.buttonContainer.appendChild(elements.button);
			elements.container.appendChild(elements.buttonContainer);
		}
		elements.container.appendChild(elements.displayContainer);

		elements.displayContainer.appendChild(objectStoreRows);
		return elements.container;
	}
	catch(err){
		throw err;
	}
}

/**
 * Creates the page elements for the backup data page.
 * @returns {Object} The page elements.
 */
function pageElements() {
	try{
		return {
			container: buildEle({ type: 'div', myClass: ['w3-container']}),
			titleContainer: buildEle({ type: 'div', myClass: ['w3-center']}),
			title: buildEle({ type: 'h5', text: 'Backup Your Data to the Server'}),
			errorContainer: buildEle({ type: 'div', myClass: ['w3-padding-small', 'w3-center'], attributes: { id: 'backup-msg-error'}}),
			buttonContainer: buildEle({ type: 'div', myClass: ['w3-margin-bottom', 'w3-center'], attributes: { id: 'button-container'}}),
			button: buildEle({ type: 'button', myClass: ['w3-button', 'w3-black', 'w3-round-large'], attributes: { id: 'submit-button'}, text: 'Backup Data'}),
			displayContainer: buildEle({ type: 'div', myClass: ['w3-margin-top', 'w3-padding-small'], attributes: { id: 'display-container'}}),
		};
	}
	catch(err){
		throw err;
	}
}