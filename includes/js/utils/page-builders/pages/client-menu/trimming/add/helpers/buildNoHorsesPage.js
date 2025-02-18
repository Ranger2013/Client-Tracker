import { buildEle } from "../../../../../../dom/domUtils.js";
import { addListener } from "../../../../../../event-listeners/listeners.js";
import selectClientMenuPage from "../../../../../../navigation/selectClientMenuPage.js";

/**
 * Builds a page indicating that the client has no horses.
 * 
 * @param {HTMLElement} mainContainer - The main container element where the page is built.
 * @param {string} cID - The client ID.
 * @param {string} primaryKey - The primary key of the client.
 */
export default async function buildNoHorsesPage(mainContainer, cID, primaryKey) {
	try {
		const pageMapping = {
			container: {
				type: 'div',
				myClass: ['w3-center'],
			},
			notice: {
				type: 'h4',
				myClass: ['w3-text-red'],
				text: 'This client does not have any horses listed.',
			},
			linkContainer: {
				type: 'p',
				myClass: ['w3-margin-top', 'w3-padding-small'],
				text: 'Please ',
			},
			link: {
				type: 'a',
				myClass: ['w3-text-blue', 'w3-underline'],
				attributes: {
					id: 'add-horse-link',
					href: `/tracker/client-horses/add/?cID=${cID}&key=${primaryKey}`,
					title: 'Add a horse',
				},
				text: 'add a horse',
			},
		};

		const elements = {};

		// Build elements from the mapping and append them to their respective parents
		for (const key in pageMapping) {
			elements[key] = buildEle(pageMapping[key]);
			if (key === 'link') {
				elements.linkContainer.appendChild(elements.link);
			} else if (key !== 'container') {
				elements.container.appendChild(elements[key]);
			}
		}

		// Clear the main container and append the built container
		mainContainer.innerHTML = '';
		mainContainer.appendChild(elements.container);

		// Add the event listener to prevent the default action
		addListener('add-horse-link', 'click', evt => selectClientMenuPage(evt, 'add-horse', cID, primaryKey));
	}
	catch (err) {
		const { default: backupErrorPage } = await import("../../../../../../error-messages/backupErrorPage.js");
		const { handleError } = await import("../../../../../../error-messages/handleError.js");
		await handleError('buildNoHorsesPageError', 'Build no horses page error: ', err);
		backupErrorPage(mainContainer);
	}
}
