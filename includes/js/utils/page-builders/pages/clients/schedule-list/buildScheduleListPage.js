import { clearMsg, top } from "../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import { buildPageElements } from "./helpers/pageBuilder.js";

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
        
        mainContainer.innerHTML = '';
        mainContainer.appendChild(pageElements);
        
        await initializeHandlers(); // Calls the clientListJS.js file.
        return () => {
            removeAllListeners(PAGE_BUILDER_ID);
        };
    } 
    catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError({
            filename: 'buildScheduleListPageError',
            consoleMsg: 'Build schedule list page error: ',
            err,
        });
        throw err;
    }
}

/**
 * Initializes the page by clearing messages and scrolling to top
 * @param {HTMLElement} mainContainer - Main container element
 * @throws {Error} If mainContainer is missing
 */
async function initializePage(mainContainer) {
    try {
        clearMsg({ container: 'page-msg' });
        top();
        if (!mainContainer) {
            throw new Error('mainContainer is required');
        }
    }
    catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError({
            filename: 'initializePageError',
            consoleMsg: 'Initialize page error: ',
            err,
        });
        throw err; // Propagate error to caller
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
        throw err;
    }
}