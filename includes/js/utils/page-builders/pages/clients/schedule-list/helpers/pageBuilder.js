import { buildEle, clearMsg, top } from "../../../../../dom/domUtils.js";
import buildSearchBlock from "../../../../helpers/buildSearchBlock.js";
import buildScheduleTitleBlock from "./buildScheduleTitleBlock.js";
import buildClientListPersonalNotes from "./buildClientListPersonalNotes.js";
import buildClientList from "./buildClientList.js";

const PAGE_CONFIG = {
    filterOptions: [
        { value: 'client-name', text: 'Search By Client Name' },
        { value: 'address', text: 'Search By Address' },
        { value: 'phone', text: 'Search By Phone' },
        { value: 'app-time', text: 'Search By Time' },
        { value: 'app-date', text: 'Search By Date' }
    ],
    container: {
        type: 'div',
        class: ['w3-container']
    },
    formMsg: {
        type: 'div',
        class: ['w3-center']
    },
    counter: {
        type: 'div',
        class: ['w3-small']
    }
};

/**
 * Initializes the page by clearing messages and scrolling to top
 * @param {HTMLElement} mainContainer - Main container element
 * @throws {Error} If mainContainer is missing
 */
export async function initializePage(mainContainer) {
    try {
        clearMsg({ container: 'page-msg' });
        top();
        if (!mainContainer) {
            throw new Error('mainContainer is required');
        }
    }
    catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError({
            filename: 'initializePageError',
            consoleMsg: 'Initialize page error: ',
            err,
            userMsg: 'Unable to initialize page',
            errorEle: 'page-msg'
        });
        throw err; // Propagate error to caller
    }
}

/**
 * Builds all page elements
 * @param {Object} params - Build parameters
 * @returns {Promise<Object>} Page elements object
 */
export async function buildPageElements({ active, cID, primaryKey }) {
    try {
        console.log('In buildPageElements');
        
        const container = buildEle(PAGE_CONFIG.container);
        const scheduleListWrapper = buildEle({
            type: 'div',
            attributes: { id: 'schedule-list' }
        });

        const [
            personalNotesContainer,
            searchBlock, 
            scheduleTitleBlock,
            [clientScheduleList, clientCount]
        ] = await Promise.all([
            buildClientListPersonalNotes(container),
            buildSearchBlock(PAGE_CONFIG.filterOptions),
            buildScheduleTitleBlock(),
            buildClientList({ active, clientID: cID, primaryKey })
        ]);

        scheduleListWrapper.appendChild(clientScheduleList);

        return {
            container,
            formMsg: buildEle(PAGE_CONFIG.formMsg),
            personalNotes: personalNotesContainer,
            searchBlock,
            scheduleTitle: scheduleTitleBlock,
            scheduleList: scheduleListWrapper,
            counter: buildClientCounter(clientCount)
        };
    }
    catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError({
            filename: 'buildPageElementsError',
            consoleMsg: 'Build page elements error: ',
            err,
            userMsg: 'Unable to build page components',
            errorEle: 'page-msg'
        });
        throw err; // Propagate error to caller
    }
}

/**
 * Renders the schedule page with proper element ordering
 */
export async function renderSchedulePage(mainContainer, elements) {
    try {
        renderPage(mainContainer, elements, {
            renderOrder: RENDER_CONFIGS.scheduleList.renderOrder,
            targetContainer: elements.container
        });
    }
    catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError({
            filename: 'renderSchedulePageError',
            consoleMsg: 'Render schedule page error: ',
            err,
            userMsg: 'Unable to display page content',
            errorEle: 'page-msg'
        });
        throw err;
    }
}

function buildClientCounter(count) {
    return buildEle({
        ...PAGE_CONFIG.counter,
        text: `Current Clients: ${count}`
    });
}

export const RENDER_ORDER = [
    'personalNotes',
    'formMsg',
    'searchBlock',
    'scheduleList',
    'counter'
];
