import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import { initializePage, buildPageElements } from "./helpers/pageBuilder.js";

const PAGE_BUILDER_ID = 'schedule-list-builder';

/**
 * Builds the schedule list page
 * @param {Object} params Build parameters
 * @param {string} params.active - Active status filter
 * @param {string|null} params.cID - Client ID
 * @param {string|null} params.primaryKey - Primary key
 * @param {HTMLElement} params.mainContainer - Main container element
 * @returns {Promise<Function>} Cleanup function
 */
export default async function buildScheduleListPage({ active, cID = null, primaryKey = null, mainContainer }) {
    try {
        await initializePage(mainContainer);
        const pageElements = await buildPageElements({ active, cID, primaryKey });
        console.log('pageElements: ', pageElements);
        
        await initializeHandlers();
        
        return () => {
            removeAllListeners(PAGE_BUILDER_ID);
            mainContainer.innerHTML = '';
        };
    } 
    catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError({
            filename: 'buildScheduleListPageError',
            consoleMsg: 'Build schedule list page error: ',
            err,
            userMsg: 'Unable to build the schedule list page',
            errorEle: 'page-msg'
        });
    }
}

async function initializeHandlers() {
    try {
        const { default: initClientList } = await import("../../../../../pages/clients/schedule-list/clientListJS.js");
        await initClientList();
    } 
    catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError({
            filename: 'initHandlersError',
            consoleMsg: 'Initialize handlers error: ',
            err,
            userMsg: 'Unable to initialize page handlers',
            errorEle: 'page-msg'
        });
    }
}