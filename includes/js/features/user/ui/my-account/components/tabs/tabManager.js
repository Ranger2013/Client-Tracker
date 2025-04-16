import { clearMsg } from '../../../../../../core/utils/dom/messages.js';

/**
 * Sets the active tab that the user has selected.
 * Clears any messages when a new tab is selected and highlights the active tab.
 * 
 * @param {Event} evt - The event object from the clicked tab.
 * @param {Object} tabs - An object containing the list of tabs for the page.
 * @param {Element|string} msgElement - The Element Node or the string ID of the element to remove the message.
 */
export function setActiveTab({evt, msgElement}) {
	// Clear any messages when the user selects a different tab
	clearMsg({ container: msgElement });

	const tabs = document.getElementById('tab-container').querySelectorAll('[id$="-tab"]');

	Array.from(tabs).forEach(tab => {
		if(tab.id === evt.target.id) {
			tab.dataset.active = true;
			tab.nextElementSibling.classList.add('w3-blue-grey');
		}
		else {
			tab.dataset.active = false;
			tab.nextElementSibling.classList.remove('w3-blue-grey');
		}
	});
}