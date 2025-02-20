import { installPromptState } from "../../../classes/InstallPromptManager.js";

/**
 * Handles the PWA installation process using the browser's install prompt.
 * 
 * @async
 * @function installApp
 * @param {Event} evt - The event object that triggered the installation
 * @throws {Error} If there's an error during the installation process
 * @returns {Promise<void>}
 * 
 * @example
 * button.addEventListener('click', (evt) => 
 *     installApp(evt, updateUserSettings, currentSettings)
 * );
 */
export default async function installApp(manageUser){
    try {        
        const deferredprompt = installPromptState.getPrompt();

        if(deferredprompt){
            deferredprompt.prompt();
            const choiceResult = await deferredprompt.userChoice;

            if(choiceResult.outcome === 'accepted'){
                await manageUser.updateLocalUserSettings({
                    userData: { status: 'installed', timestamp: Date.now() },
                    settingsProperty: 'installApp'
                });
            }

            installPromptState.clearPrompt();
        }
    }
    catch(err){
        const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
        await errorLogs('installAppError.txt', 'App installation error.', err);
    }
}