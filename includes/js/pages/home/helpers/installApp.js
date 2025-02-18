import IndexedDBOperations from "../../../classes/IndexedDBOperations";
import { installPromptState } from "../../../classes/InstallPromptManager.js";
import { closeModal } from "../../../utils/modal/openModal.js";
import updateUserSettings from "./updateUserSettings.js";

const indexed = new IndexedDBOperations();

export default async function installApp(evt){
	console.log('In installApp: evt.target: ', evt.target);
	try{
		
		const deferredprompt = installPromptState.getPrompt();

		if(deferredprompt){
			deferredprompt.prompt();

			const choiceResult = await deferredprompt.userChoice;

			if(choiceResult.outcome === 'accepted'){
				// Update the user settings for the install app
				const db = await indexed.openDBPromise();
				const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);

				// update user settings closes the modal
				await updateUserSettings('installed', 'installApp', userSettings[0]);
			}

			// Clear the prompt
			installPromptState.clearPrompt();
		}
	}
	catch(err){
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('installAppError.txt', 'App installation error.', err);
	}
}