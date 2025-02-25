import { clearMsg, top } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import backUpDataToServer from "./helpers/backupDataToServer.js";
import buildBackupPageElements from "./helpers/buildBackupPageElements.js";
export default async function displayBackupDataPage(evt, fm, tabContentContainer) {
	evt.preventDefault();

	try {
		 clearMsg({ container: fm });

		 const [backupPageElements, objectStores, needsUpdating] = await buildBackupPageElements();

		 tabContentContainer.innerHTML = '';
		 tabContentContainer.append(backupPageElements);

		 const backupDataButton = document.getElementById('backup-data-button');
		 
		 if (!backupDataButton) return;

		 addListener(backupDataButton, 'click', async (evt) => {
			  try {
					const backupSuccess = await backUpDataToServer(evt, objectStores, needsUpdating);
					
					if (backupSuccess) {
						 backupDataButton.parentElement.remove();
					}
			  } catch(err) {
					const { handleError } = await import("../../../../utils/error-messages/handleError.js");
					await handleError(
						 'backupDataError',
						 'Error backing up data:',
						 err,
						 `An error occurred while trying to back up the data.`,
						 fm
					);
					top();
			  }
		 });
	} catch(err) {
		 const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		 await handleError(
			  'displayBackupPageError',
			  'Display backup page error:',
			  err, 
			  'Unable to retrieve local data for backing up',
			  fm
		 );
	}
}