import { buildEle, clearMsg } from "../../../../dom/domUtils.js";
import buildPageContainer from "../../../helpers/buildPageContainer.js";
import buildPersonalNotesList from "./helpers/buildPersonalNotesListBlock.js";

export default async function buildEditPersonalNotesPage({ mainContainer }) {
	try {
		// Clear any page msgs
		clearMsg({ container: 'page-msg' });

		const [[container, card], buildNotesList] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Edit Personal Notes',
			}),
			buildPersonalNotesList(),
		]);

		// Build the notes Container
		const notesContainer = buildEle({
			type: 'div',
			attributes: { id: 'notes-container' },
		});

		container.append(card);
		card.append(notesContainer);
		notesContainer.append(buildNotesList);

		mainContainer.innerHTML = '';
		mainContainer.append(container);

		const { default: editPersonalNotes } = await import("../../../../../pages/personal-notes/edit/editPersonalNotesJS.js");
		await editPersonalNotes({ mainContainer });

	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'buildEditPersonalNotesPageError',
			'Error building edit personal notes page: ',
			err,
			'Unable to build the edit personal notes page. Please try again later.',
			'page-msg',
		);
	}
}