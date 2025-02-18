import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import { initializePage, buildPageElements, renderSchedulePage } from "./helpers/pageBuilder.js";

/**
 * Builds the schedule list page
 * @param {Object} params Build parameters
 * @returns {Promise<Function>} Cleanup function
 */
export default async function buildScheduleListPage({ active, cID = null, primaryKey = null, mainContainer }) {
    try {
        await initializePage(mainContainer);
        const pageElements = await buildPageElements({ active, cID, primaryKey });
        renderSchedulePage(mainContainer, pageElements);
        await initializeHandlers();
        
        return () => {
            removeAllListeners();
            mainContainer.innerHTML = '';
        };
    } catch (err) {
        await handlePageError(err);
    }
}

async function initializeHandlers() {
    try {
        const { default: initClientList } = await import("../../../../../pages/clients/schedule-list/clientListJS.js");
        await initClientList();
    } catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError(
            'initializeHandlersError',
            'Failed to initialize client list handlers:',
            err,
            'Unable to set up client list functionality.',
            'page-msg'
        );
    }
}

async function handlePageError(err) {
    const { handleError } = await import("../../../../error-messages/handleError.js");
    await handleError(
        'buildScheduleListPageError',
        'Error building schedule list page: ',
        err,
        'Unable to build the schedule list page. Please try again later.',
        'page-msg'
    );
}