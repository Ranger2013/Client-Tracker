import { buildElementsFromConfig } from '../../utils/dom/elements';

export default async function buildSessionNotesSection() {
	try{
		const PAGE_MAPPING = {
			container: { type: 'div', myClass: ['w3-container', 'w3-margin-bottom'] },
			notesLabel: { type: 'label', attributes: { for: 'session-notes' }, text: 'Trimming/Shoeing Session Notes: ' },
			sessionNotes: {
				type: 'textarea',
				attributes: {
					id: 'session-notes',
					title: 'Trimming/Shoeing Session Notes',
					name: 'session_notes',
					placeholder: 'Trimming/Shoeing Session Notes',
					rows: '5',
				},
				myClass: ['w3-input', 'w3-border']
			},
		};

		const pageElements = buildElementsFromConfig(PAGE_MAPPING);

		// Put it all together and return;
		const { container, notesLabel, sessionNotes } = pageElements;
		notesLabel.appendChild(sessionNotes);
		container.append(notesLabel);
		return container;
	}
	catch(err){
		throw err;
	}
}