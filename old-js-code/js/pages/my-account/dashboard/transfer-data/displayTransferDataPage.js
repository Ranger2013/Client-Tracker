import buildPageContainer from "../../../../utils/page-builders/helpers/buildPageContainer.js";
import buildTransferDataPage from "./helpers/buildTransferDataPage.js";
import handleTransferDataButton from "./helpers/handleTransferDataButton.js";

export default async function displayTransferDataPage(evt, fm, tabContentContainer){
	evt.preventDefault();

	try{
		const [[container, card], pageElements] = await Promise.all([
			buildPageContainer({
				pageTitle: 'Transer Server Data to Your Device',
			}),
			buildTransferDataPage()
		]);

		tabContentContainer.innerHTML = '';

		container.append(card);
		card.append(pageElements);
		tabContentContainer.append(container);

		await handleTransferDataButton('transfer-data-button');
	}
	catch(err){
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError(
			 'displayTransferDataPageError',
			 'Display transfer data page error:',
			 err, 
			 'Unable to build the transfer data page',
			 fm
		);
  }
}