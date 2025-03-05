import { clearMsg } from '../../../../../../core/utils/dom/messages.js';

/**
 * Sets the active tab that the user has selected.
 * Clears any messages when a new tab is selected and highlights the active tab.
 * 
 * @param {Event} evt - The event object from the clicked tab.
 * @param {Object} tabs - An object containing the list of tabs for the page.
 * @param {Element|string} msgElement - The Element Node or the string ID of the element to remove the message.
 */
export function setActiveTab({evt, tabs, msgElement}) {
	// Clear any messages when the user selects a different tab
	clearMsg({ container: msgElement });

	const ele = evt.target;

	for (const tab in tabs) {
		if (evt.target.id === tabs[tab].eleId) {
			ele.nextElementSibling.classList.add('w3-blue-grey');
		} else {
			const tabEle = document.getElementById(tabs[tab].eleId);
			if (tabEle) {
				tabEle.nextElementSibling.classList.remove('w3-blue-grey');
			}
		}
	}
}