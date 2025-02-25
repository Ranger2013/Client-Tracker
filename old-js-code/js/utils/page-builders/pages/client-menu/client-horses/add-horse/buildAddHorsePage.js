import ManageClient from "../../../../../../classes/ManageClient.js";
import { clearMsg } from "../../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../../event-listeners/listeners.js";
import { buildPageElements, renderPage } from "./helpers/pageRenderer.js";

/**
 * Builds the Add Horse page.
 * @param {Object} params Page parameters
 * @param {HTMLElement} params.mainContainer The main container element
 * @param {string} params.cID Client ID
 * @param {string} params.primaryKey Client primary key
 * @returns {Promise<Function>} Cleanup function
 */
export default async function buildAddHorsePage({ cID, primaryKey, mainContainer }) {
    try {
        clearMsg({container: 'page-msg'});
        
        if (!cID || !primaryKey) {
            return handleNoClient(mainContainer);
        }

        const clientInfo = await getClientInfo(primaryKey);
        const pageElements = await buildPageElements(clientInfo);
        
        renderPage(mainContainer, pageElements);
        await initializeEventHandlers({ cID, primaryKey });

        return removeAllListeners;
    } catch (err) {
        await handlePageError(err);
    }
}

async function handleNoClient(mainContainer) {
    const { default: buildNoClientAvailablePage } = await import("../helpers/buildNoClientAvailablePage.js");
    await buildNoClientAvailablePage(mainContainer);
    return removeAllListeners;
}

async function getClientInfo(primaryKey) {
    const manageClient = new ManageClient();
    return await manageClient.getClientInfo({ primaryKey });
}

async function initializeEventHandlers({ cID, primaryKey }) {
    const { default: addHorse } = await import("../../../../../../pages/client-menu/client-horses/add/addHorseJS.js");
    await addHorse({ cID, primaryKey });
}

async function handlePageError(err) {
    const { handleError } = await import("../../../../../error-messages/handleError.js");
    await handleError(
        'buildAddHorsePageError',
        'Error building the add horse page:',
        err,
        'Unable to build the add horse page. Please try again later.',
        'page-msg'
    );
}