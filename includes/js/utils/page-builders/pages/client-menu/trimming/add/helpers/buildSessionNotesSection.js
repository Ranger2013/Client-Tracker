import { buildEle } from "../../../../../../dom/domUtils.js";

export default async function buildSessionNotesSection() {
	try {
		const container = buildEle({ type: 'div', myClass: ['w3-container', 'w3-margin-bottom'] });
		const notesLabel = buildEle({ type: 'label', attributes: { for: 'session-notes' }, text: 'Trimming/Shoeing Session Notes: ' });
		const sessionNotes = buildEle({
			type: 'textarea',
			attributes: {
				id: 'session-notes',
				title: 'Trimming/Shoeing Session Notes',
				name: 'session_notes',
				placeholder: 'Trimming/Shoeing Session Notes',
				rows: '5',
			},
			myClass: ['w3-input', 'w3-border']
		});

		notesLabel.appendChild(sessionNotes);
		container.appendChild(notesLabel);
		return container;
	}
	catch (err) {
		const { handleError } = await import("../../../../../../error-messages/handleError.js");
		await handleError('buildSessionNotesSectionError', 'Build session notes section error: ', err);

		const container = buildEle({ type: 'div', myClass: ['w3-center', 'w3-text-red'], text: 'Could not build the sessions notes section.' });
		return container;
	}
}
