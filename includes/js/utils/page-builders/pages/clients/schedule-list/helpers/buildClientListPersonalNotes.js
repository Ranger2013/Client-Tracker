import { buildEle } from "../../../../../dom/domUtils.js";
import buildPersonalNotesSection from "./buildPersonalNotesSection.js";

/**
 * Builds the personal notes section for the client list.
 * @param {HTMLElement} container - The container element to which the personal notes section will be appended.
 * @returns {Promise<HTMLElement|null>} The personal notes block element or null if an error occurs.
 */
export default async function buildClientListPersonalNotes(container) {
	// Create the personal notes block element
	const personalNotesBlock = buildEle({
		type: 'div',
		attributes: { id: 'personal-notes-block' },
		myClass: ['w3-border-left', 'w3-border-top', 'w3-border-right', 'w3-hide', 'collapsed', 'slide-down']
	});

	try {
		// Fetch the personal notes section
		const getPersonalNotes = await buildPersonalNotesSection();

		// If personal notes are available, build the info block and append the notes
		if (getPersonalNotes) {
			const infoBlock = buildEle({
				type: 'div',
				attributes: { id: 'personal-notes-icon' },
				myClass: ['w3-pointer'],
				text: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						  <circle cx="12" cy="12" r="10"></circle>
						  <line x1="12" y1="18" x2="12" y2="10"></line>
						  <line x1="12" y1="6" x2="12" y2="6"></line>
					 </svg>`
			});

			// Add click event listener to toggle the visibility of the personal notes block
			infoBlock.addEventListener('click', () => {
				const isCollapsed = personalNotesBlock.classList.contains('collapsed');

				if (isCollapsed) {
					personalNotesBlock.classList.remove('w3-hide');
					personalNotesBlock.style.maxHeight = (personalNotesBlock.scrollHeight + 30) + 'px';
					personalNotesBlock.classList.remove('collapsed');
				} else {
					// Set maxHeight to the scrollHeight for a smooth transition
					personalNotesBlock.style.maxHeight = (personalNotesBlock.scrollHeight + 30) + 'px';

					// Delay to ensure the transition happens
					setTimeout(() => {
						personalNotesBlock.style.maxHeight = '0';
						personalNotesBlock.classList.add('collapsed');
						setTimeout(() => personalNotesBlock.classList.add('w3-hide'), 500); // Hide after transition
					}, 10);
				}
			});

			// Append the info block to the container and the personal notes to the personal notes block
			container.appendChild(infoBlock);
			personalNotesBlock.appendChild(getPersonalNotes);
		}

		return personalNotesBlock;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('buildClientListPersonalNotesError', 'Build client list personal notes error: ', err);

		const errorEle = buildEle({
			type: 'div',
			myClass: ['w3-text-red'],
			text: 'An error occurred while fetching the personal notes.',
		});

		personalNotesBlock.appendChild(errorEle);
		return personalNotesBlock;
	}
}