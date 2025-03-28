import { buildElementsFromConfig } from '../../../../../../utils/dom/elements.js';

export default function buildNoHorsePage({ cID, primaryKey, mainContainer }) {
	try {
		const PAGE_MAPPING = {
			container: {
				type: 'div',
				myClass: ['w3-center'],
			},
			card: {
				type: 'div',
				myClass: ['w3-card'],
				attributes: { id: 'card' },
			},
			notice: {
				type: 'h4',
				myClass: ['w3-text-red'],
				text: 'This client does not have any horses Listed.',
			},
			linkContainer: {
				type: 'p',
				myClass: ['w3-margin-top', 'w3-padding-small'],
				text: 'Please ',
			},
			link: {
				type: 'a',
				attributes: {
					id: 'add-horse-link',
					href: `/tracker/client-horses/add/?cID=${cID}&primaryKey=${primaryKey}`,
					title: 'Add a Horse',
					'data-add-horse-navigation:': true, // This will give us something to look for when we create our event listeners in the UI file.
				},
				myClass: ['w3-text-blue'],
				text: 'add a horse',
			},
		};

		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { container, card, notice, linkContainer, link } = elements;

		// Add child elements first
		linkContainer.appendChild(link);
		// Append the elements
		card.append(notice, linkContainer);
		container.appendChild(card);

		mainContainer.innerHTML = '';
		mainContainer.appendChild(elements.container);
	}
	catch (err) {
		throw err;
	}
}
