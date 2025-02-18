import { buildEle, clearMsg } from "../../../../dom/domUtils.js";
import buildPageContainer from "../../../helpers/buildPageContainer.js";
import buildSubmitButtonSection from "../../../helpers/buildSubmitButtonSection.js";
import buildTwoColumnTextareaSection from "../../../helpers/buildTwoColumnTextareaSection.js";

export default async function buildAddPersonalNotesPage({ mainContainer }) {
	try {
		clearMsg({ container: 'page-msg' });

		const form = buildEle({
			type: 'form',
			attributes: { id: 'add-notes-form' }
		});

		const [[container, card], textareaSection, buttonSection] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Add Personal Notes'
			}),
			buildTwoColumnTextareaSection({
				labelText: 'Notes:',
				textareaID: 'notes',
				textareaName: 'notes',
				textareaTitle: 'Personal Notes',
				required: true
			}),
			buildSubmitButtonSection('Add Notes')
		]);

		// Build DOM structure
		form.append(textareaSection, buttonSection);
		card.append(form);
		container.append(card);

		mainContainer.innerHTML = '';
		mainContainer.append(container);

		const { default: addPersonalNotes } = await import("../../../../../pages/personal-notes/add/addPersonalNotesJS.js");
		return addPersonalNotes({ mainContainer });

	}
	catch (err) {
		const { handleError } = await import("../../../../error-messages/handleError.js");
		await handleError('buildAddPersonalNotesPageError', 'Error building add personal notes page: ', err);
	}
}